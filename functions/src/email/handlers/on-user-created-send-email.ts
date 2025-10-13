import { createTransporter } from "../transporter.js";
import { log } from "../../utils/logger";

export interface UserData {
  email: string;
  name?: string;
}

export async function onUserCreatedSendEmailHandler(user: UserData, gmailUser: string, gmailPass: string) {
  if (!user.email) {
    log.error("Missing email in user data", "onUserCreatedSendEmailHandler", { user });
    return;
  }

  try {
    log.info("Preparing to send welcome email", "onUserCreatedSendEmailHandler", { email: user.email });

    const transporter = createTransporter(gmailUser, gmailPass);

    const mailOptions = {
      from: `"iNNkie" <hello@innkie.com>`,
      to: user.email,
      subject: "Welcome to iNNkie 🎉",
      html: `
        <div style="font-family:Inter,Roboto,sans-serif;line-height:1.6">
          <h2>Welcome to <span style="color:#2563eb">iNNkie</span>, ${user?.name ?? "there"}!</h2>
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

    log.info("Welcome email sent successfully", "onUserCreatedSendEmailHandler", { email: user.email });

  } catch (err) {
    log.error("Failed to send welcome email", "onUserCreatedSendEmailHandler", { error: err, user });
  }
}
