// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — task-notify
// ═══════════════════════════════════════════════════════════════════════════
// Envoie des emails transactionnels aux assignés d'une tâche, avec boutons
// d'action signés HMAC pointant vers `task-action`.
//
// Body:
//   {
//     sid:       studioId
//     taskId:    id de la tâche
//     event:     'assigned' | 'commented' | 'status_changed' | 'mentioned'
//     actorName: nom de l'auteur de l'action (pour personnaliser le mail)
//     extra?:    { body?: string, statut?: string, newAssignee?: string, mentions?: string[] }
//   }
//
// Auth : JWT requis (fire-and-forget depuis le front).
// Secrets : RESEND_API_KEY, TASK_ACTION_SECRET, PUBLIC_APP_URL (optionnel).
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = 'ISSEO <noreply@isseo-dev.com>';
const TOKEN_TTL_DAYS = 7;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non autorisé" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller) return json({ error: "Session invalide" }, 401);

    // ── Parse body ────────────────────────────────────────────────────────
    const { sid, taskId, event, actorName, extra } = await req.json();
    if (!sid || !taskId || !event) {
      return json({ error: "sid, taskId et event requis" }, 400);
    }

    // ── Secrets ───────────────────────────────────────────────────────────
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const TASK_ACTION_SECRET = Deno.env.get("TASK_ACTION_SECRET");
    if (!RESEND_API_KEY || !TASK_ACTION_SECRET) {
      return json({ error: "Secrets manquants (RESEND_API_KEY, TASK_ACTION_SECRET)" }, 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://isseo-app.vercel.app";
    const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

    // ── Service-role client (lecture des tâches + profils) ────────────────
    const admin = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Charger les todos du studio
    const { data: todoRow, error: todoErr } = await admin
      .from("studios")
      .select("data")
      .eq("id", `${sid}_todos`)
      .maybeSingle();
    if (todoErr) throw todoErr;
    const todos = (todoRow?.data?.todos as any[]) || [];
    const task = todos.find((t) => t.id === taskId);
    if (!task) return json({ error: "Tâche introuvable" }, 404);

    // 2. Charger le studio (nom projet)
    const { data: studioRow } = await admin
      .from("studios")
      .select("data")
      .eq("id", sid)
      .maybeSingle();
    const studioName = (studioRow?.data?.name as string) || sid;

    // 3. Déterminer les destinataires
    const assignees: string[] = (task.assignees && task.assignees.length)
      ? task.assignees
      : (task.responsable ? [task.responsable] : []);

    // Sur une assignation ciblée (extra.newAssignee), on ne notifie que cette personne.
    // Sur 'assigned' (création de tâche) : tous les assignés, Y COMPRIS l'auteur s'il s'est auto-assigné
    //   → le créateur veut l'email de confirmation avec boutons d'action.
    // Sur 'commented' / 'status_changed' : tous les assignés sauf l'auteur (évite l'auto-spam).
    // Sur 'mentioned' : uniquement les personnes mentionnées (hors l'auteur).
    let recipients: string[] = [];
    if (event === "assigned" && extra?.newAssignee) {
      recipients = [extra.newAssignee];
    } else if (event === "assigned") {
      // Création de tâche : on notifie TOUS les assignés, auteur inclus s'il est dans la liste
      recipients = assignees.filter((n) => !!n);
    } else if (event === "mentioned") {
      const mentioned: string[] = Array.isArray(extra?.mentions) ? extra.mentions : [];
      recipients = mentioned.filter((n) => n && n !== actorName);
    } else if (event === "commented") {
      // V2 : éviter le double-email si la personne a été mentionnée, elle reçoit le mail mention à la place.
      const mentioned: string[] = Array.isArray(extra?.mentions) ? extra.mentions : [];
      recipients = assignees.filter((n) => n && n !== actorName && mentioned.indexOf(n) < 0);
    } else {
      recipients = assignees.filter((n) => n && n !== actorName);
    }
    if (!recipients.length) {
      return json({ success: true, skipped: true, reason: "Aucun destinataire" });
    }

    // 4. Résoudre les emails des destinataires
    const { data: profiles } = await admin
      .from("profiles")
      .select("nom, email")
      .in("nom", recipients);

    const byNom = new Map<string, string>();
    (profiles || []).forEach((p: any) => {
      if (p.nom && p.email) byNom.set(p.nom, p.email);
    });

    // 5. Pour chaque destinataire : générer tokens + composer HTML + envoyer
    const results: any[] = [];
    for (const nom of recipients) {
      const email = byNom.get(nom);
      if (!email) {
        results.push({ nom, skipped: "no-email" });
        continue;
      }

      const tokens = {
        done: await signToken({ sid, taskId, a: "status", s: "done", u: nom }, TASK_ACTION_SECRET),
        in_progress: await signToken({ sid, taskId, a: "status", s: "in_progress", u: nom }, TASK_ACTION_SECRET),
        todo: await signToken({ sid, taskId, a: "status", s: "todo", u: nom }, TASK_ACTION_SECRET),
        comment: await signToken({ sid, taskId, a: "comment", u: nom }, TASK_ACTION_SECRET),
      };

      const html = composeTaskEmail({
        task,
        studioName,
        event,
        actorName: actorName || "Quelqu'un",
        recipientName: nom,
        extra,
        tokens,
        functionsBase: FUNCTIONS_BASE,
        appUrl: PUBLIC_APP_URL,
      });

      const subject = composeSubject(event, task, studioName, actorName, nom);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject,
          html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("[task-notify] Resend error for", nom, data);
        results.push({ nom, error: data.message || "resend error" });
      } else {
        results.push({ nom, messageId: data.id });
      }
    }

    return json({ success: true, results });
  } catch (err) {
    console.error("[task-notify]", err);
    return json({ error: (err as Error).message || "Erreur serveur" }, 500);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// HMAC-SHA256 signed token.
// Payload is base64url(JSON) + '.' + base64url(signature).
async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const full = { ...payload, exp: Date.now() + TOKEN_TTL_DAYS * 24 * 3600 * 1000 };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(full)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

function b64urlEncode(bytes: Uint8Array): string {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function composeSubject(event: string, task: any, studioName: string, actorName?: string, recipientName?: string): string {
  const t = task.titre || "Tâche";
  const actor = (actorName || "").split(" ")[0] || "";
  const isSelf = recipientName && actorName && recipientName === actorName;
  if (event === "assigned") {
    if (isSelf) return `📌 Tâche créée : ${t} — ${studioName}`;
    return `🎯 Nouvelle tâche : ${t} — ${studioName}`;
  }
  if (event === "commented") return `💬 ${actor} a commenté « ${t} » — ${studioName}`;
  if (event === "status_changed") return `↻ ${t} — statut mis à jour — ${studioName}`;
  if (event === "mentioned") return `@ ${actor} t'a mentionné dans « ${t} » — ${studioName}`;
  return `ISSEO — ${t}`;
}

function composeTaskEmail(opts: {
  task: any;
  studioName: string;
  event: string;
  actorName: string;
  recipientName: string;
  extra?: any;
  tokens: { done: string; in_progress: string; todo: string; comment: string };
  functionsBase: string;
  appUrl: string;
}): string {
  const { task, studioName, event, actorName, recipientName, extra, tokens, functionsBase, appUrl } = opts;

  const priorityMap: Record<string, { label: string; color: string; icon: string }> = {
    P0: { label: "Urgent",  color: "#DC2626", icon: "🔥" },
    P1: { label: "Haute",   color: "#D97706", icon: "▲" },
    P2: { label: "Normale", color: "#6B7280", icon: "●" },
    P3: { label: "Basse",   color: "#9CA3AF", icon: "▽" },
  };
  const pri = priorityMap[task.priority || "P2"] || priorityMap.P2;

  let deadlineTxt = "";
  if (task.deadline) {
    const d = new Date(`${task.deadline}T00:00:00`);
    deadlineTxt = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  // Headline contextuelle
  const isSelfAssigned = event === "assigned" && recipientName === actorName;
  let headline = "";
  if (event === "assigned") {
    headline = isSelfAssigned ? `Nouvelle tâche créée` : `${actorName} t'a assigné une tâche`;
  } else if (event === "commented") {
    headline = `${actorName} a commenté une tâche`;
  } else if (event === "status_changed") {
    const stLabels: Record<string, string> = { todo: "à faire", in_progress: "en cours", done: "terminée", blocked: "bloquée" };
    headline = `Statut mis à jour : ${stLabels[extra?.statut || task.statut] || task.statut}`;
  } else if (event === "mentioned") {
    headline = `💬 ${actorName} t'a mentionné`;
  }

  const urlDone = `${functionsBase}/task-action?t=${encodeURIComponent(tokens.done)}`;
  const urlDoing = `${functionsBase}/task-action?t=${encodeURIComponent(tokens.in_progress)}`;
  const urlTodo = `${functionsBase}/task-action?t=${encodeURIComponent(tokens.todo)}`;
  const urlComment = `${functionsBase}/task-action?t=${encodeURIComponent(tokens.comment)}`;

  const esc = (s: string) =>
    (s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const commentBlock =
    ((event === "commented" || event === "mentioned") && extra?.body)
      ? `<tr><td style="padding:0 32px 18px"><div style="background:#f8fafc;border-left:3px solid #6366F1;padding:12px 14px;border-radius:0 8px 8px 0;font-size:14px;color:#374151;line-height:1.55;white-space:pre-wrap">${esc(extra.body)}</div></td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(task.titre || "Tâche")}</title>
</head>
<body style="margin:0;padding:0;background:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a">
<div style="display:none;max-height:0;overflow:hidden">${esc(headline)} — ${esc(task.titre || "")} — ${esc(studioName)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#1a3a6b 0%,#2e5a9e 100%);padding:26px 32px">
        <div style="color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;opacity:0.85">ISSEO · ${esc(studioName)}</div>
        <div style="color:#ffffff;font-size:17px;font-weight:600;margin-top:6px">${esc(headline)}</div>
      </td></tr>

      <!-- Titre tâche -->
      <tr><td style="padding:28px 32px 10px">
        <div style="font-size:22px;font-weight:700;color:#111827;line-height:1.35">${esc(task.titre || "(sans titre)")}</div>
      </td></tr>

      <!-- Méta -->
      <tr><td style="padding:0 32px 18px">
        <div style="font-size:13px;color:#6b7280;line-height:1.7">
          ${deadlineTxt ? `📅 ${esc(deadlineTxt)}<br>` : ""}
          <span style="color:${pri.color};font-weight:600">${pri.icon} Priorité ${pri.label}</span><br>
          ${
            event === "mentioned"
              ? `Salut ${esc(recipientName.split(" ")[0] || "")}, ${esc(actorName)} t'a mentionné dans un commentaire.`
              : isSelfAssigned
                ? `Salut ${esc(recipientName.split(" ")[0] || "")}, voici ta nouvelle tâche — utilise les boutons ci-dessous pour la piloter directement depuis cet email.`
                : `Salut ${esc(recipientName.split(" ")[0] || "")}, ${esc(actorName)} a besoin de toi sur cette tâche.`
          }
        </div>
      </td></tr>

      ${
        task.description
          ? `<tr><td style="padding:0 32px 18px"><div style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${esc(task.description)}</div></td></tr>`
          : ""
      }

      ${commentBlock}

      <!-- Actions -->
      <tr><td style="padding:8px 32px 10px">
        <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Mettre à jour rapidement</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:6px"><a href="${urlDone}" style="display:block;text-align:center;padding:11px 6px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">✓ Fait</a></td>
          <td style="padding:0 6px"><a href="${urlDoing}" style="display:block;text-align:center;padding:11px 6px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">⏱ En cours</a></td>
          <td style="padding-left:6px"><a href="${urlTodo}" style="display:block;text-align:center;padding:11px 6px;background:#6b7280;color:#ffffff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">↺ À faire</a></td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:14px 32px 6px">
        <a href="${urlComment}" style="display:block;text-align:center;padding:12px;background:#ffffff;color:#1a3a6b;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600;border:1px solid #1a3a6b">💬 Répondre / Commenter</a>
      </td></tr>

      <tr><td style="padding:8px 32px 24px">
        <a href="${appUrl}" style="display:block;text-align:center;padding:10px;background:#f3f4f6;color:#374151;text-decoration:none;border-radius:9px;font-size:12px;font-weight:500">Ouvrir dans l'app</a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:18px 32px 22px;background:#faf9f6;border-top:1px solid #f0f0ea">
        <div style="font-size:11px;color:#9ca3af;line-height:1.55">
          Tu reçois cet email car tu es assigné à cette tâche dans ISSEO. Les boutons d'action restent valides 7 jours.<br>
          <span style="color:#cbd5e1">ISSEO · isseo-dev.com</span>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
