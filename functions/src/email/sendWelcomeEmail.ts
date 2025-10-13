import { createTransporter } from "./transporter";
import { log } from "../utils/logger";

interface WelcomeEmailData {
  email: string;
  name: string;
}

export async function sendWelcomeEmailHandler(
  data: WelcomeEmailData,
  gmailUser: string,
  gmailPass: string
) {
  if (!data.email) {
    log.warn("Missing email in welcome email data", "sendWelcomeEmailHandler", { data });
    return { success: false };
  }

  try {
    log.info("Preparing to send welcome email", "sendWelcomeEmailHandler", { email: data.email });

    const transporter = createTransporter(gmailUser, gmailPass);

    const mailOptions = {
      from: `"iNNkie" <hello@innkie.com>`,
      to: data.email,
      subject: "Welcome to innkie 🎉",
      html: `
        <div style="font-family:Inter,Roboto,sans-serif;line-height:1.6">
          <h2>Welcome to <span style="color:#2563eb">innkie</span>, ${data.name}!</h2>
          <p>Thanks for joining us. Start shortening your URLs and tracking your insights right away.</p>
          <p>
            <a href="https://innkie.com/dashboard"
               style="background:#2563eb;color:#fff;padding:10px 18px;
                      text-decoration:none;border-radius:8px;display:inline-block;">
              Go to Dashboard
            </a>
          </p>
          <p>– The iNNkie Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    log.info("Welcome email sent successfully", "sendWelcomeEmailHandler", { email: data.email });

    return { success: true };

  } catch (err) {
    log.error("Failed to send welcome email", "sendWelcomeEmailHandler", { error: err, data });
    return { success: false };
  }
}
