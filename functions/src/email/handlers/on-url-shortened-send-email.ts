import {log} from '../../utils/logger';
import {createTransporter} from '../transporter';
import {firestore} from '../../config/firebaseAdmin';
import {getShortenedLinkTemplate} from '../templates/shortened-link.template';


export const onUrlShortenedSendEmailHandler = async (
  urlData: any,
  gmailUserValue: string,
  gmailPassValue: string
) => {
  const { userId, shortCode, originalUrl, workspaceId } = urlData;

  if (!userId || !shortCode) {
    log.warn("Missing userId or shortCode in new URL document", "onUrlShortenedSendEmailHandler", { urlData });
    return;
  }

  try {
    const userRef = firestore.doc(`users/${userId}`);
    const userSnapshot = await userRef.get();

    const userData = userSnapshot.data();
    const userEmail = userData?.email;
    
    if (!userEmail) {
      log.error("User email not found for sending shortened URL email", "onUrlShortenedSendEmailHandler", { userId });
      return;
    }

    // Check notification preference
    if (userData?.notificationDisabled) {
      log.info("Email notifications disabled for user, skipping", "onUrlShortenedSendEmailHandler", { userId });
      return;
    }

    // Fetch Workspace branding if available
    let brandColor = "#4f46e5"; // Default iNNkie Indigo
    let brandName = "Personal";
    
    if (workspaceId) {
      const wsRef = firestore.doc(`workspaces/${workspaceId}`);
      const wsSnapshot = await wsRef.get();
      if (wsSnapshot.exists) {
        const wsData = wsSnapshot.data();
        brandColor = wsData?.branding?.brandColor || brandColor;
        brandName = wsData?.name || brandName;
      }
    }

    log.info("Preparing to send shortened link email", "onUrlShortenedSendEmailHandler", { userId, shortCode, workspaceId });

    const transporter = createTransporter(gmailUserValue, gmailPassValue);
    const shortUrl = `https://innkie.com/${shortCode}`;

    await transporter.sendMail({
      from: `"iNNkie.com" <hello@innkie.com>`,
      to: userEmail,
      subject: "Your shortened link is ready 🚀",
      html: getShortenedLinkTemplate(originalUrl, shortUrl, brandColor, brandName),
    });

    log.info("Shortened link email sent successfully", "onUrlShortenedSendEmailHandler", { userEmail, shortCode });

  } catch (err) {
    log.error("Failed to send shortened link email", "onUrlShortenedSendEmailHandler", { error: err, urlData });
  }
};
