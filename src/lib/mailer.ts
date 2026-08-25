import nodemailer from "nodemailer";

// Sent Mail cleanup is handled by the cron job at /api/cron/cleanup-sent (runs every 10 min via cron-job.org)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    const errMsg = "SMTP_USER or SMTP_PASS is not set in environment variables. Email sending is disabled.";
    console.error(errMsg);
    throw new Error(errMsg);
  }

  // Configure transporter for Google Workspace (Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Course Coordinator Portal" <${user}>`,
    to: to,
    subject: subject,
    html: html,
  };

  console.log(`[Email Info] Attempting to send email via SMTP to: ${to}`);
  console.log(`[Email Info] Sender (SMTP_USER): ${user}`);
  console.log(`[Email Info] Subject: "${subject}"`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Success] Email delivered successfully. Message ID: ${info.messageId}`);

    // Sent Mail cleanup is handled by the Vercel cron job at /api/cron/cleanup-sent (runs every 15 min)

    return info;
  } catch (error) {
    console.error("[Email Error] Nodemailer transport error during execution:", error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}
