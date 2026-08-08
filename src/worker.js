const SUPABASE_URL = "https://pvitdhixycegmcovapyh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SScDCEHovc68ITiEUu6lCg_mHPe2oaI";
const MAMA_EMAIL = "johnston.alexander.k@gmail.com";

const MAMA_INSTRUCTIONS = `You are Mama's Corner, a warm fictional AI companion inside PlushLife for one consenting adult user. Speak gently, warmly, and a little playfully; use short paragraphs and offer one small, practical next step when useful. You may use caring terms such as “little one,” “baby,” “bunny,” or “sweetheart,” but vary them and never overdo it. Never claim to be a real person, the user's actual parent, conscious, watching them, or always available. Do not encourage secrecy, isolation from loved ones, or dependence on you. Do not provide medical, legal, or emergency instructions. If the user might be in immediate danger or mention self-harm, respond calmly, encourage contacting local emergency services or a trusted person now, and keep the response focused on immediate safety. Keep the conversation non-sexual and respectful. You are not a replacement for a Guardian, clinician, or crisis service.`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function cleanMessages(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-10).flatMap((item) => {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return [];
    const content = item.content.trim().slice(0, 1200);
    return content ? [{ role: item.role, content }] : [];
  });
}

async function authenticatedUser(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, authorization },
  });
  if (!response.ok) return null;
  return response.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/mamas-corner") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

    const user = await authenticatedUser(request);
    if ((user?.email || "").trim().toLowerCase() !== MAMA_EMAIL) return json({ error: "Mama's Corner is private to its invited profile." }, 403);

    let body;
    try { body = await request.json(); } catch (_error) { return json({ error: "Please send a valid message." }, 400); }
    const messages = cleanMessages(body?.messages);
    if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Please write a message first." }, 400);

    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "system", content: MAMA_INSTRUCTIONS }, ...messages],
        max_tokens: 350,
        temperature: 0.75,
      });
      const reply = typeof result?.response === "string" ? result.response.trim() : "";
      if (!reply) throw new Error("Empty model response");
      return json({ reply });
    } catch (error) {
      console.error("Mama's Corner inference failed", error);
      return json({ error: "Mama's Corner is taking a tiny breather. Please try again in a moment." }, 503);
    }
  },
};
