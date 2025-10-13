import {log} from '../../utils/logger';
import {createTransporter} from '../transporter';
import {firestore} from '../../config/firebaseAdmin';


export const onUrlShortenedSendEmailHandler = async (
  urlData: any,
  gmailUserValue: string,
  gmailPassValue: string
) => {
  const { userId, shortCode, originalUrl } = urlData;

  if (!userId || !shortCode) {
    log.warn("Missing userId or shortCode in new URL document", "onUrlShortenedSendEmailHandler", { urlData });
    return;
  }

  try {
    const userRef = firestore.doc(`users/${userId}`);
    const userSnapshot = await userRef.get();

    const userEmail = userSnapshot.data()?.email;
    if (!userEmail) {
      log.error("User email not found for sending shortened URL email", "onUrlShortenedSendEmailHandler", { userId });
      return;
    }

    log.info("Preparing to send shortened link email", "onUrlShortenedSendEmailHandler", { userId, shortCode });

    const transporter = createTransporter(gmailUserValue, gmailPassValue);

    await transporter.sendMail({
      from: `"iNNkie" <hello@innkie.com>`,
      to: userEmail,
      subject: "Your shortened link is ready 🚀",
      html: `
        <div style="font-family:Inter,Roboto,sans-serif;line-height:1.6">
          <h2>Your link has been shortened!</h2>
          <p><strong>Original:</strong> <a href="${originalUrl}">${originalUrl}</a></p>
          <p><strong>Shortened:</strong> <a href="https://innkie.com/${shortCode}">https://innkie.com/${shortCode}</a></p>
          <p>Track clicks and analytics anytime from your dashboard.</p>
          <p>– The iNNkie Team</p>
        </div>
      `,
    });

    log.info("Shortened link email sent successfully", "onUrlShortenedSendEmailHandler", { userEmail, shortCode });

  } catch (err) {
    log.error("Failed to send shortened link email", "onUrlShortenedSendEmailHandler", { error: err, urlData });
  }
};
