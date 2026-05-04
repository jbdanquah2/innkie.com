import * as firestore from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';
import { log } from "../utils/logger";
import { PlatformUsageEvent, WorkspaceDailySummary } from "@innkie/shared-models";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Aggregates platform usage events into daily workspace summaries.
 */
export const onPlatformEventCreated = firestore.onDocumentCreated(
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

    const dateStr = (timestamp instanceof admin.firestore.Timestamp ? timestamp.toDate() : new Date(timestamp))
      .toISOString().split('T')[0];

    const summaryRef = db.collection('workspaceSummaries').doc(`${workspaceId}_${dateStr}`);

    const incrementMap: any = {};
    if (toolType === 'link_shortener' && action === 'shorten') {
      incrementMap['metrics.linksShortened'] = admin.firestore.FieldValue.increment(1);
    } else if (toolType === 'image_optimizer' && action === 'compress') {
      incrementMap['metrics.imagesCompressed'] = admin.firestore.FieldValue.increment(1);
      const bytesSaved = data.metadata?.bytesSaved || 0;
      incrementMap['metrics.bytesSaved'] = admin.firestore.FieldValue.increment(bytesSaved);
    } else if (toolType === 'qr_studio' && action === 'generate') {
      incrementMap['metrics.qrsGenerated'] = admin.firestore.FieldValue.increment(1);
    } else {
      incrementMap['metrics.otherToolsUsage'] = admin.firestore.FieldValue.increment(1);
    }

    log.info("Aggregating platform event", "onPlatformEventCreated", { workspaceId, toolType, action });

    await summaryRef.set({
      workspaceId,
      date: dateStr,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await summaryRef.update(incrementMap);
  }
);

/**
 * Aggregates link clicks into daily workspace summaries.
 * Document path: shortUrls/{shortCode}/clicks/{clickId}
 */
export const onClickCreated = firestore.onDocumentCreated(
  {
    document: "shortUrls/{shortCode}/clicks/{clickId}",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const { workspaceId, timestamp } = data;

    if (!workspaceId) return;

    const dateStr = (timestamp instanceof admin.firestore.Timestamp ? timestamp.toDate() : new Date(timestamp))
      .toISOString().split('T')[0];

    const summaryRef = db.collection('workspaceSummaries').doc(`${workspaceId}_${dateStr}`);

    log.info("Aggregating click event", "onClickCreated", { workspaceId, shortCode: event.params.shortCode });

    await summaryRef.set({
      workspaceId,
      date: dateStr,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await summaryRef.update({
      'metrics.clicksTotal': admin.firestore.FieldValue.increment(1)
    });
  }
);
