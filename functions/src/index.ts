/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as functions from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { log } from "./utils/logger"; // <- your structured logger
import { sendShortenedEmailHandler } from './email/sendShortenedEmail';
import { sendWelcomeEmailHandler } from './email/sendWelcomeEmail';
import {
  onUserCreatedSendEmailHandler,
  UserData
} from './email/handlers/on-user-created-send-email';
import * as firestore from "firebase-functions/v2/firestore";
import { onUrlShortenedSendEmailHandler } from './email/handlers/on-url-shortened-send-email';
import { gmailPass, gmailUser } from './config/secrets';
export * from './analytics/aggregator';

// ====================
// Simple HTTP function
// ====================
export const healthCheck = onRequest((request, response) => {
  log.info("Health check!", "healthCheck");
  response.send("iNNkie Functions: Online");
});

// ====================
// Callable functions
// ====================

// send sendShortenedEmail
export const callable_sendShortenedEmail = functions.https.onCall(
  {
    secrets: [gmailUser, gmailPass]
  },
  async (request) => {
    const { email, shortUrl, originalUrl } = request.data;
    log.debug("Callable: sendShortenedEmail invoked", "callable_sendShortenedEmail", { email, shortUrl });

    return await sendShortenedEmailHandler(
      { email, shortUrl, originalUrl },
      gmailUser.value(),
      gmailPass.value()
    );
  }
);

// Send Welcome Email
export const callable_sendWelcomeEmail = functions.https.onCall(
  {
    secrets: [gmailUser, gmailPass]
  },
  async (request) => {
    const { email, name } = request.data;
    log.debug("Callable: sendWelcomeEmail invoked", "callable_sendWelcomeEmail", { email, name });

    return await sendWelcomeEmailHandler(
      {
        email,
        name
      },
      gmailUser.value(),
      gmailPass.value()
    );
  }
);

// ====================
// Firestore triggers
// ====================

// User created → send welcome email
export const trigger_onUserCreated_Welcome = firestore.onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [gmailUser, gmailPass],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      log.warn("No user data found in Firestore event", "trigger_onUserCreated_Welcome");
      return;
    }

    const user = snapshot.data() as UserData;

    if (!user?.email) {
      log.error("Missing email field in new user document", "trigger_onUserCreated_Welcome", { user });
      return;
    }

    log.info("Trigger: Sending welcome email", "trigger_onUserCreated_Welcome", { email: user.email });
    await onUserCreatedSendEmailHandler(user, gmailUser.value(), gmailPass.value());
  }
);

// URL shortened → send email
export const trigger_onUrlShortened_Confirmation = firestore.onDocumentCreated(
  {
    document: "shortUrls/{shortCode}",
    secrets: [gmailUser, gmailPass],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      log.warn("No URL data found in Firestore event", "trigger_onUrlShortened_Confirmation");
      return;
    }

    const urlData = snapshot.data();
    log.info("Trigger: Sending shortened URL email", "trigger_onUrlShortened_Confirmation", { shortCode: urlData.shortCode, userId: urlData.userId });

    await onUrlShortenedSendEmailHandler(urlData, gmailUser.value(), gmailPass.value());
  }
);
