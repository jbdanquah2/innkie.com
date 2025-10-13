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

// ====================
// Simple HTTP function
// ====================
export const helloWorld = onRequest((request, response) => {
  log.info("Hello logs!", "helloWorld");
  response.send("Hello from Firebase!");
});

// ====================
// Callable functions
// ====================

// send sendShortenedEmail
export const sendShortenedEmail = functions.https.onCall(
  {
    secrets: [gmailUser, gmailPass]
  },
  async (request) => {
    const { email, shortUrl, originalUrl } = request.data;
    log.debug("Callable: sendShortenedEmail invoked", "sendShortenedEmail", { email, shortUrl });

    return await sendShortenedEmailHandler(
      { email, shortUrl, originalUrl },
      gmailUser.value(),
      gmailPass.value()
    );
  }
);

// Send Welcome Email
export const sendWelcomeEmail = functions.https.onCall(
  {
    secrets: [gmailUser, gmailPass]
  },
  async (request) => {
    const { email, name } = request.data;
    log.debug("Callable: sendWelcomeEmail invoked", "sendWelcomeEmail", { email, name });

    return await sendWelcomeEmailHandler(
      { email, name },
      gmailUser.value(),
      gmailPass.value()
    );
  }
);

// ====================
// Firestore triggers
// ====================

// User created → send welcome email
export const onUserCreatedSendEmail = firestore.onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [gmailUser, gmailPass],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      log.warn("No user data found in Firestore event", "onUserCreatedSendEmail");
      return;
    }

    const user = snapshot.data() as UserData;

    if (!user?.email) {
      log.error("Missing email field in new user document", "onUserCreatedSendEmail", { user });
      return;
    }

    log.info("Trigger: Sending welcome email", "onUserCreatedSendEmail", { email: user.email });
    await onUserCreatedSendEmailHandler(user, gmailUser.value(), gmailPass.value());
  }
);

// URL shortened → send email
export const onUrlCreatedSendEmail = firestore.onDocumentCreated(
  {
    document: "shortUrls/{shortCode}",
    secrets: [gmailUser, gmailPass],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      log.warn("No URL data found in Firestore event", "onUrlCreatedSendEmail");
      return;
    }

    const urlData = snapshot.data();
    log.info("Trigger: Sending shortened URL email", "onUrlCreatedSendEmail", { shortCode: urlData.shortCode, userId: urlData.userId });

    await onUrlShortenedSendEmailHandler(urlData, gmailUser.value(), gmailPass.value());
  }
);
