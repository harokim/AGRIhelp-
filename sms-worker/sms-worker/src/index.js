const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://agri-e005a.web.app"
];

function getCorsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin)
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin)
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          message: "Only POST requests are allowed."
        },
        405,
        origin
      );
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return jsonResponse(
        {
          success: false,
          message: "Origin is not allowed."
        },
        403,
        origin
      );
    }

    try {
      const body = await request.json();

      const number = String(body.number || "").trim();
      const message = String(body.message || "").trim();
      const sendername = String(body.sendername || "").trim();

      if (!number) {
        return jsonResponse(
          {
            success: false,
            message: "Phone number is required."
          },
          400,
          origin
        );
      }

      if (!message) {
        return jsonResponse(
          {
            success: false,
            message: "SMS message is required."
          },
          400,
          origin
        );
      }

      if (message.length > 1600) {
        return jsonResponse(
          {
            success: false,
            message: "SMS message is too long."
          },
          400,
          origin
        );
      }

      const phoneNumbers = number
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (phoneNumbers.length > 1000) {
        return jsonResponse(
          {
            success: false,
            message: "A maximum of 1000 recipients is allowed."
          },
          400,
          origin
        );
      }

      const formData = new URLSearchParams({
        apikey: env.SEMAPHORE_API_KEY,
        number: phoneNumbers.join(","),
        message
      });

      if (sendername) {
        formData.append("sendername", sendername);
      }

      const semaphoreResponse = await fetch(
        "https://api.semaphore.co/api/v4/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData
        }
      );

      const responseText = await semaphoreResponse.text();

      let semaphoreData;

      try {
        semaphoreData = JSON.parse(responseText);
      } catch {
        semaphoreData = {
          response: responseText
        };
      }

      if (!semaphoreResponse.ok) {
        return jsonResponse(
          {
            success: false,
            message: "Semaphore failed to send the SMS.",
            data: semaphoreData
          },
          semaphoreResponse.status,
          origin
        );
      }

      return jsonResponse(
        {
          success: true,
          message: "SMS sent successfully.",
          data: semaphoreData
        },
        200,
        origin
      );
    } catch (error) {
      console.error("SMS worker error:", error);

      return jsonResponse(
        {
          success: false,
          message: "Unable to send SMS."
        },
        500,
        origin
      );
    }
  }
};