export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").trim();
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": allowed || "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    if (allowed && origin !== allowed) return new Response("Forbidden", { status: 403 });
    let body;
    try { body = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
    const phoneNumber = String(body.phoneNumber || "").trim();
    const message = String(body.message || "").trim();
    if (!/^09\d{9}$/.test(phoneNumber) || !message) return new Response("Invalid request", { status: 400 });
    const form = new URLSearchParams();
    form.set("apikey", env.SEMAPHORE_API_KEY);
    form.set("number", phoneNumber);
    form.set("message", message);
    const response = await fetch("https://api.semaphore.co/api/v4/messages", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": allowed || "*" } });
  }
};
