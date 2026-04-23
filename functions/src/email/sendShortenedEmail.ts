import { createTransporter } from "./transporter";
import { log } from "../utils/logger";
import { getShortenedLinkTemplate } from "./templates/shortened-link.template";
import { firestore } from "../config/firebaseAdmin";

interface ShortenedEmailData {
  email: string;
  shortUrl: string;
  originalUrl: string;
  workspaceId?: string;
}

export async function sendShortenedEmailHandler(
  data: ShortenedEmailData,
  gmailUser: string,
  gmailPass: string
) {
  if (!data.email || !data.shortUrl || !data.originalUrl) {
    log.warn("Missing email, shortUrl, or originalUrl in data", "sendShortenedEmailHandler", { data });
    return { success: false };
  }

  try {
    log.info("Preparing to send shortened link email", "sendShortenedEmailHandler", { email: data.email, shortUrl: data.shortUrl });

    // Fetch Workspace branding if available
    let brandColor = "#4f46e5"; // Default iNNkie Indigo
    let brandName = "Personal";
    
    if (data.workspaceId) {
      const wsRef = firestore.doc(`workspaces/${data.workspaceId}`);
      const wsSnapshot = await wsRef.get();
      if (wsSnapshot.exists) {
        const wsData = wsSnapshot.data();
        brandColor = wsData?.branding?.brandColor || brandColor;
        brandName = wsData?.name || brandName;
      }
    }

    const transporter = createTransporter(gmailUser, gmailPass);

    const mailOptions = {
      from: `"iNNkie.com" <hello@innkie.com>`,
      to: data.email,
      subject: "Your shortened link is ready 🚀",
      html: getShortenedLinkTemplate(data.originalUrl, data.shortUrl, brandColor, brandName),
    };

    await transporter.sendMail(mailOptions);

    log.info("Shortened link email sent successfully", "sendShortenedEmailHandler", { email: data.email, shortUrl: data.shortUrl });

    return { success: true };

  } catch (err) {
    log.error("Failed to send shortened link email", "sendShortenedEmailHandler", { error: err, data });
    return { success: false };
  }
}
