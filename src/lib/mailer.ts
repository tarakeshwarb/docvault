import nodemailer from "nodemailer";

// For local testing, we'll configure a mock transporter.
// In production, you would use actual SMTP credentials like SendGrid, AWS SES, or a generic SMTP server.

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Generate a test account on Ethereal (https://ethereal.email) for catching test emails.
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const mailer = await getTransporter();

  const info = await mailer.sendMail({
    from: '"Course Coordinator Portal" <noreply@college-system.local>', // sender address
    to, // list of receivers
    subject, // Subject line
    html, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  return info;
}
