import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedCredentials = '';

export function createTransporter(user: string, pass: string): nodemailer.Transporter {
  const credKey = `${user}:${pass}`;
  if (!cachedTransporter || cachedCredentials !== credKey) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
    });
    cachedCredentials = credKey;
  }
  return cachedTransporter;
}
