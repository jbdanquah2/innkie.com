import { createTransporter } from "./transporter";
import { log } from "../utils/logger";
import { getWelcomeEmailTemplate } from "./templates/welcome.template";

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
      from: `"iNNkie.com" <hello@innkie.com>`,
      to: data.email,
      subject: "Welcome to iNNkie 🎉",
      html: getWelcomeEmailTemplate(data.name || "there"),
    };

    await transporter.sendMail(mailOptions);

    log.info("Welcome email sent successfully", "sendWelcomeEmailHandler", { email: data.email });

    return { success: true };

  } catch (err) {
    log.error("Failed to send welcome email", "sendWelcomeEmailHandler", { error: err, data });
    return { success: false };
  }
}
