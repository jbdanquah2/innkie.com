import { createTransporter } from "../transporter";
import { log } from "../../utils/logger";
import { getWelcomeEmailTemplate } from "../templates/welcome.template";

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
      from: `"iNNkie.com" <hello@innkie.com>`,
      to: user.email,
      subject: "Welcome to iNNkie 🎉",
      html: getWelcomeEmailTemplate(user.name || "there"),
    };

    await transporter.sendMail(mailOptions);

    log.info("Welcome email sent successfully", "onUserCreatedSendEmailHandler", { email: user.email });

  } catch (err) {
    log.error("Failed to send welcome email", "onUserCreatedSendEmailHandler", { error: err, user });
  }
}
