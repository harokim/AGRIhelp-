const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

setGlobalOptions({
  maxInstances: 10,
});

const semaphoreApiKey = defineSecret("SEMAPHORE_API_KEY");

exports.sendSms = onCall(
  {
    region: "asia-southeast1",
    secrets: [semaphoreApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to send an SMS."
      );
    }

    const data = request.data || {};
    const number = String(data.number || "").trim();
    const message = String(data.message || "").trim();
    const sendername = String(data.sendername || "").trim();

    if (!number) {
      throw new HttpsError(
        "invalid-argument",
        "A phone number is required."
      );
    }

    if (!message) {
      throw new HttpsError(
        "invalid-argument",
        "An SMS message is required."
      );
    }

    if (message.length > 1600) {
      throw new HttpsError(
        "invalid-argument",
        "The SMS message is too long."
      );
    }

    try {
      const formData = new URLSearchParams({
        apikey: semaphoreApiKey.value(),
        number,
        message,
      });

      if (sendername) {
        formData.append("sendername", sendername);
      }

      const response = await fetch(
        "https://api.semaphore.co/api/v4/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      const responseText = await response.text();

      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        result = { response: responseText };
      }

      if (!response.ok) {
        logger.error("Semaphore API error", {
          status: response.status,
          result,
        });

        throw new HttpsError(
          "internal",
          "Semaphore failed to send the SMS."
        );
      }

      logger.info("SMS sent successfully", {
        userId: request.auth.uid,
        number,
        result,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("SMS function error", error);

      throw new HttpsError(
        "internal",
        "Unable to send SMS."
      );
    }
  }
);