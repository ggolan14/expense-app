import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
//  SMTP_USER,
//  SMTP_PASS,
  SMTP_SECURE,
  SMTP_TLS_REJECT_UNAUTHORIZED,
  EMAIL_FROM,
} = process.env;

export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT || 587),
  secure: Number(EMAIL_PORT) === 465, // true עבור 465 (SSL)
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

export async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
