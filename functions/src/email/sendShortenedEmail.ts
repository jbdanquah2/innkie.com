import { createTransporter } from "./transporter";
import { log } from "../utils/logger";

interface ShortenedEmailData {
  email: string;
  shortUrl: string;
  originalUrl: string;
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

    const transporter = createTransporter(gmailUser, gmailPass);

    const mailOptions = {
      from: `"iNNkie.com" <hello@innkie.com>`,
      to: data.email,
      subject: "Your shortened link is ready 🚀",
      html: `
        <div style="font-family:Inter,Roboto,sans-serif;line-height:1.6">
          <h2>Your link has been shortened!</h2>
          <p><strong>Original:</strong> <a href="${data.originalUrl}">${data.originalUrl}</a></p>
          <p><strong>Shortened:</strong> <a href="https://innkie.com/${data.shortUrl}">https://innkie.com/${data.shortUrl}</a></p>
          <p>Track clicks and analytics anytime from your dashboard.</p>
          <p>– The iNNkie Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    log.info("Shortened link email sent successfully", "sendShortenedEmailHandler", { email: data.email, shortUrl: data.shortUrl });

    return { success: true };

  } catch (err) {
    log.error("Failed to send shortened link email", "sendShortenedEmailHandler", { error: err, data });
    return { success: false };
  }
}
