import nodemailer from "nodemailer";

async function deleteSentEmailImap(user: string, pass: string, messageId: string) {
  const { ImapFlow } = await import("imapflow");
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();

  try {
    // 1. Detect Sent and Trash folders dynamically (handles localization/language settings)
    const list = await client.list();
    const sentFolder = list.find((f) => f.specialUse === "\\Sent" || f.path.toLowerCase().includes("sent"));
    const trashFolder = list.find((f) => f.specialUse === "\\Trash" || f.path.toLowerCase().includes("trash"));

    const sentPath = sentFolder ? sentFolder.path : "[Gmail]/Sent Mail";
    const trashPath = trashFolder ? trashFolder.path : "[Gmail]/Trash";

    let matchedUid = null;
    const maxRetries = 5;

    // 2. Retry loop in case Gmail is slow to index/save the sent email copy
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[IMAP Cleanup] (Attempt ${attempt}/${maxRetries}) Locating email in Sent Mail...`);
      const mailbox = await client.mailboxOpen(sentPath);

      if (mailbox.exists > 0) {
        // Fetch the last 20 messages in the Sent folder to handle concurrent/bulk sends safely
        const startRange = Math.max(1, mailbox.exists - 19);
        const lastMsgRange = `${startRange}:${mailbox.exists}`;
        for await (let msg of client.fetch(lastMsgRange, { envelope: true })) {
          if (msg.envelope?.messageId === messageId) {
            matchedUid = msg.uid;
            break; // Found the exact match, stop looping
          }
        }
      }

      if (matchedUid) {
        break; // Match found, break out of retry loop
      }

      // If not found yet, wait 2 seconds before the next check
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (matchedUid) {
      // In Gmail IMAP, messageDelete with uid:true permanently removes the message
      // from ALL labels (including Sent Mail). Simple move to Trash only adds a label.
      await client.messageDelete(String(matchedUid), { uid: true });
      console.log(`[IMAP Cleanup] Successfully purged email from Sent Mail (UID ${matchedUid}).`);
    } else {
      console.warn(`[IMAP Cleanup] Deletion skipped: Message-ID was not found in the Sent folder after ${maxRetries} attempts.`);
    }
  } finally {
    await client.logout();
  }
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
