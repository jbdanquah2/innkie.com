import * as firestore from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';
import { firestore as db } from "../config/firebaseAdmin";
import { log } from "../utils/logger";
import { PlatformUsageEvent } from "@innkie/shared-models";

/**
 * Normalizes a timestamp (Firestore Timestamp, Date, numeric, or plain object) into a YYYY-MM-DD string.
 */
function normalizeDate(timestamp: any): string {
  try {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    if (timestamp instanceof admin.firestore.Timestamp) {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString().split('T')[0];
    }
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    if (typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
    }
    if (typeof timestamp._seconds === 'number') {
      return new Date(timestamp._seconds * 1000).toISOString().split('T')[0];
    }
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (err) {
    log.warn("normalizeDate fallback to current date", "normalizeDate", { error: err });
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Aggregates platform usage events into daily workspace summaries atomically.
 */
export const onPlatformEvent_Aggregator = firestore.onDocumentCreated(
  {
    document: "platformEvents/{eventId}",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data() as PlatformUsageEvent;
    const { workspaceId, toolType, action, timestamp } = data;

    if (!workspaceId) {
      log.warn("PlatformEvent missing workspaceId", "onPlatformEventCreated", { eventId: event.params.eventId });
      return;
    }

    const dateStr = normalizeDate(timestamp);
    const summaryRef = db.collection('workspaceSummaries').doc(`${workspaceId}_${dateStr}`);

    const metricsIncrements: Record<string, any> = {};
    if (toolType === 'link_shortener' && action === 'shorten') {
      metricsIncrements.linksShortened = admin.firestore.FieldValue.increment(1);
    } else if (toolType === 'image_optimizer' && action === 'compress') {
      metricsIncrements.imagesCompressed = admin.firestore.FieldValue.increment(1);
      const rawBytes = data.metadata?.bytesSaved;
      const bytesSaved = typeof rawBytes === 'number' && !isNaN(rawBytes) ? rawBytes : 0;
      metricsIncrements.bytesSaved = admin.firestore.FieldValue.increment(bytesSaved);
    } else if (toolType === 'qr_studio' && action === 'generate') {
      metricsIncrements.qrsGenerated = admin.firestore.FieldValue.increment(1);
    } else {
      metricsIncrements.otherToolsUsage = admin.firestore.FieldValue.increment(1);
    }

    log.info("Aggregating platform event atomically", "onPlatformEventCreated", { workspaceId, toolType, action });

    // Single atomic write with deep merge
    await summaryRef.set({
      workspaceId,
      date: dateStr,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metrics: metricsIncrements
    }, { merge: true });
  }
);

/**
 * Aggregates link clicks into daily workspace summaries atomically.
 * Document path: shortUrls/{shortCode}/clicks/{clickId}
 */
export const onClick_Aggregator = firestore.onDocumentCreated(
  {
    document: "shortUrls/{shortCode}/clicks/{clickId}",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const { workspaceId, timestamp } = data;

    if (!workspaceId) return;

    const dateStr = normalizeDate(timestamp);
    const summaryRef = db.collection('workspaceSummaries').doc(`${workspaceId}_${dateStr}`);

    log.info("Aggregating click event atomically", "onClickCreated", { workspaceId, shortCode: event.params.shortCode });

    // Single atomic write with deep merge
    await summaryRef.set({
      workspaceId,
      date: dateStr,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metrics: {
        clicksTotal: admin.firestore.FieldValue.increment(1)
      }
    }, { merge: true });
  }
);
