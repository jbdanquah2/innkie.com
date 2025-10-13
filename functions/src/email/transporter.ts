import nodemailer from "nodemailer";

export function createTransporter(user: string, pass: string) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}
