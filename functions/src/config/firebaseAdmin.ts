import * as admin from "firebase-admin";

// 🔹 Singleton pattern: Initialize only once
if (!admin.apps.length) {
  admin.initializeApp();
  console.log("✅ Firebase Admin initialized");
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
