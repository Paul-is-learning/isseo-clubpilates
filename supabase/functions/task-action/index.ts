// ═══════════════════════════════════════════════════════════════════════════
// Edge Function — task-action  (PUBLIC, --no-verify-jwt)
// ═══════════════════════════════════════════════════════════════════════════
// Reçoit les clics depuis les emails de tâches. Vérifie un token HMAC signé,
// mute la donnée (statut ou commentaire), et renvoie une page HTML de
// confirmation branded ISSEO.
//
// Routes (dispatch sur le payload du token) :
//   GET  /?t={token}                   → page statut confirmé OU page comment
//   POST /?t={token}  (form-urlencoded "body=…")  → ajoute un commentaire
//
// Secrets : TASK_ACTION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const TASK_ACTION_SECRET = Deno.env.get("TASK_ACTION_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://clubpilates.isseo-dev.com";
    if (!TASK_ACTION_SECRET || !SERVICE_KEY) {
      return htmlError("Configuration serveur incomplète.", PUBLIC_APP_URL);
    }

    // Récupère le token depuis la query string
    const url = new URL(req.url);
    const token = url.searchParams.get("t");
    if (!token) return htmlError("Lien invalide — token manquant.", PUBLIC_APP_URL);

    // Vérifie la signature
    const payload = await verifyToken(token, TASK_ACTION_SECRET);
    if (!payload) return htmlError("Lien invalide ou expiré.", PUBLIC_APP_URL);
    if (typeof payload.exp === "number" && payload.exp < Date.now()) {
      return htmlError("Ce lien a expiré (7 jours). Ouvre ISSEO pour continuer.", PUBLIC_APP_URL);
    }

    const sid = payload.sid as string;
    const taskId = payload.taskId as string;
    const action = payload.a as string;
    const targetUser = (payload.u as string) || "";
    if (!sid || !taskId || !action) return htmlError("Lien invalide.", PUBLIC_APP_URL);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Charge les todos du studio
    const { data: todoRow, error: todoErr } = await admin
      .from("studios")
      .select("data")
      .eq("id", `${sid}_todos`)
      .maybeSingle();
    if (todoErr) throw todoErr;
    const todos = (todoRow?.data?.todos as any[]) || [];
    const idx = todos.findIndex((t) => t.id === taskId);
    if (idx === -1) return htmlError("Tâche introuvable — elle a peut-être été supprimée.", PUBLIC_APP_URL);
    const task = todos[idx];

    // Nom du projet (pour l'affichage)
    const { data: studioRow } = await admin
      .from("studios")
      .select("data")
      .eq("id", sid)
      .maybeSingle();
    const studioName = (studioRow?.data?.name as string) || sid;

    // ── Dispatch ──────────────────────────────────────────────────────────
    if (action === "status") {
      const newStatut = (payload.s as string) || "todo";
      task.statut = newStatut;
      todos[idx] = task;
      await admin
        .from("studios")
        .upsert({ id: `${sid}_todos`, data: { todos }, updated_at: new Date().toISOString() });

      // Notifie in-app les autres assignés
      await notifyOthers(admin, sid, task, targetUser, `Statut : ${statutLabel(newStatut)}`, "statut");

      const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
        todo: { label: "À faire", color: "#6B7280", icon: "↺" },
        in_progress: { label: "En cours", color: "#2563EB", icon: "⏱" },
        done: { label: "Fait", color: "#16A34A", icon: "✓" },
        blocked: { label: "Bloqué", color: "#DC2626", icon: "⛔" },
      };
      const sm = statusLabels[newStatut] || statusLabels.todo;
      return htmlPage({
        title: "Statut mis à jour",
        headline: `${sm.icon} Tâche marquée « ${sm.label} »`,
        body: `
          <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 10px">Merci ${escHtml(firstName(targetUser))} ! La tâche <strong>${escHtml(task.titre)}</strong> dans <strong>${escHtml(studioName)}</strong> est désormais <strong style="color:${sm.color}">${sm.label.toLowerCase()}</strong>.</p>
          <p style="font-size:13px;color:#6b7280;margin:14px 0 0">Les autres membres de l'équipe ont été notifiés.</p>
        `,
        appUrl: `${PUBLIC_APP_URL}/#tache=${encodeURIComponent(sid)}:${encodeURIComponent(taskId)}`,
      });
    }

    if (action === "comment") {
      // GET → formulaire ; POST → ajoute le commentaire
      if (req.method === "POST") {
        const form = await req.formData();
        const body = (form.get("body") as string || "").trim();
        if (!body) {
          return htmlPage({
            title: "Commentaire vide",
            headline: "Commentaire vide",
            body: `<p style="font-size:14px;color:#374151">Écris quelque chose avant d'envoyer.</p><p style="margin-top:12px"><a href="${url.origin}${url.pathname}?t=${encodeURIComponent(token)}" style="color:#1a3a6b;font-weight:600">← Retour au commentaire</a></p>`,
            appUrl: PUBLIC_APP_URL,
          });
        }
        if (!task.comments) task.comments = [];
        task.comments.push({
          id: `cmt_${Date.now()}`,
          auteur: targetUser,
          ts: new Date().toISOString(),
          body,
        });
        todos[idx] = task;
        await admin
          .from("studios")
          .upsert({ id: `${sid}_todos`, data: { todos }, updated_at: new Date().toISOString() });

        await notifyOthers(admin, sid, task, targetUser, `💬 ${firstName(targetUser)} : ${body.slice(0, 120)}`, "message");

        return htmlPage({
          title: "Commentaire envoyé",
          headline: "💬 Commentaire envoyé",
          body: `
            <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 12px">Merci ${escHtml(firstName(targetUser))} ! Ton commentaire a été ajouté à la tâche <strong>${escHtml(task.titre)}</strong>.</p>
            <div style="background:#f8fafc;border-left:3px solid #6366F1;padding:12px 14px;border-radius:0 8px 8px 0;font-size:13px;color:#374151;margin:16px 0;white-space:pre-wrap">${escHtml(body)}</div>
            <p style="font-size:12px;color:#6b7280;margin:10px 0 0">L'équipe a été notifiée.</p>
          `,
          appUrl: `${PUBLIC_APP_URL}/#tache=${encodeURIComponent(sid)}:${encodeURIComponent(taskId)}`,
        });
      }

      // GET : formulaire
      return htmlPage({
        title: "Répondre à la tâche",
        headline: "💬 Répondre à la tâche",
        body: `
          <div style="font-size:14px;color:#6b7280;margin-bottom:6px">${escHtml(studioName)}</div>
          <div style="font-size:17px;font-weight:700;color:#111827;margin-bottom:14px">${escHtml(task.titre)}</div>
          ${
            task.description
              ? `<div style="font-size:13px;color:#374151;white-space:pre-wrap;background:#f8fafc;padding:10px 12px;border-radius:8px;margin-bottom:18px;line-height:1.5">${escHtml(task.description)}</div>`
              : ""
          }
          <form method="POST" action="${url.origin}${url.pathname}?t=${encodeURIComponent(token)}" style="margin-top:12px">
            <label style="display:block;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Ton commentaire (envoyé comme ${escHtml(targetUser)})</label>
            <textarea name="body" rows="5" required placeholder="Écris ton commentaire…" style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;outline:none;resize:vertical;line-height:1.5" onfocus="this.style.borderColor='#6366F1'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
            <button type="submit" style="margin-top:12px;width:100%;padding:13px;background:#111827;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Envoyer le commentaire</button>
          </form>
        `,
        appUrl: `${PUBLIC_APP_URL}/#tache=${encodeURIComponent(sid)}:${encodeURIComponent(taskId)}`,
        wide: true,
      });
    }

    return htmlError("Action inconnue.", PUBLIC_APP_URL);
  } catch (err) {
    console.error("[task-action]", err);
    return htmlError("Une erreur est survenue. Réessaie depuis l'app.", "");
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = b64urlDecode(sig);
    const ok = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(body));
    if (!ok) return null;
    const json = new TextDecoder().decode(b64urlDecode(body));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function notifyOthers(admin: any, sid: string, task: any, actor: string, body: string, type: string) {
  const assignees: string[] = (task.assignees && task.assignees.length)
    ? task.assignees
    : (task.responsable ? [task.responsable] : []);
  const targets = assignees.filter((n: string) => n && n !== actor);
  if (!targets.length) return;
  const { data: profs } = await admin.from("profiles").select("user_id, nom").in("nom", targets);
  if (!profs || !profs.length) return;
  const rows = profs
    .filter((p: any) => p.user_id)
    .map((p: any) => ({
      user_id: p.user_id,
      studio_id: sid,
      type,
      title: `${task.titre}`,
      body,
      read: false,
    }));
  if (rows.length) {
    await admin.from("notifications").insert(rows);
  }
}

function statutLabel(s: string): string {
  return ({ todo: "à faire", in_progress: "en cours", done: "terminée", blocked: "bloquée" } as Record<string, string>)[s] || s;
}

function firstName(s: string): string {
  return (s || "").split(" ")[0] || "";
}

function escHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function htmlError(message: string, appUrl: string): Response {
  return htmlPage({
    title: "Erreur",
    headline: "⚠ Lien invalide",
    body: `<p style="font-size:14px;color:#374151;line-height:1.6">${escHtml(message)}</p>`,
    appUrl,
  });
}

function htmlPage(opts: { title: string; headline: string; body: string; appUrl: string; wide?: boolean }): Response {
  const { title, headline, body, appUrl, wide } = opts;
  const maxW = wide ? 580 : 460;
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)} — ISSEO</title>
<style>
  body{margin:0;padding:0;background:#faf9f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;min-height:100vh}
  .wrap{max-width:${maxW}px;margin:40px auto;padding:0 16px}
  .card{background:#ffffff;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden}
  .hdr{background:linear-gradient(135deg,#1a3a6b 0%,#2e5a9e 100%);padding:24px 30px;color:#fff}
  .hdr-small{font-size:11px;font-weight:600;letter-spacing:1px;opacity:0.85;text-transform:uppercase}
  .hdr-big{font-size:19px;font-weight:700;margin-top:6px}
  .body{padding:26px 30px 22px}
  .btn{display:block;text-align:center;padding:11px 18px;background:#1a3a6b;color:#fff!important;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600;margin-top:22px}
  .footer{padding:14px 30px 18px;background:#faf9f6;border-top:1px solid #f0f0ea;font-size:11px;color:#9ca3af}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="hdr">
      <div class="hdr-small">ISSEO</div>
      <div class="hdr-big">${escHtml(headline)}</div>
    </div>
    <div class="body">
      ${body}
      ${appUrl ? `<a href="${appUrl}" class="btn">Ouvrir ISSEO</a>` : ""}
    </div>
    <div class="footer">isseo-dev.com · Tu peux fermer cette fenêtre.</div>
  </div>
</div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { ...CORS, "Content-Type": "text/html; charset=utf-8" },
  });
}
