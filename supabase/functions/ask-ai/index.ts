import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { question, context } = await req.json();

    if (!question || !question.trim()) {
      return new Response(JSON.stringify({ error: "Question vide." }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const MISTRAL_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_KEY) {
      return new Response(
        JSON.stringify({ error: "Clé API Mistral non configurée." }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      `Tu es un expert financier spécialisé dans les studios Club Pilates Reformer en France. ` +
      `Contexte du studio : ${context} ` +
      `Réponds en français, de manière concise, chiffrée et directement actionnable. ` +
      `Utilise des bullet points quand c'est pertinent. Maximum 300 mots.`;

    const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: `Mistral API : ${err}` }), {
        status: resp.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "Pas de réponse.";

    return new Response(JSON.stringify({ text }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
