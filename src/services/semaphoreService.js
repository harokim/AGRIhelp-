export async function sendSemaphoreSMS({ phoneNumber, message }) {
  const endpoint = import.meta.env.VITE_SEMAPHORE_PROXY_URL;
  if (!endpoint) return { skipped: true, reason: "Semaphore endpoint is not configured." };
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber, message }) });
  if (!response.ok) throw new Error("SMS service request failed.");
  return response.json();
}
