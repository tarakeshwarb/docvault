import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

export const runtime = "nodejs";

// This route is called by Vercel Cron every 15 minutes.
// It connects to Gmail IMAP and deletes any portal reminder emails from Sent Mail.
export async function GET(request: Request) {
  // Protect this route — only allow Vercel's cron scheduler to call it
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return NextResponse.json({ error: "SMTP credentials not configured" }, { status: 500 });
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  try {
    await client.connect();

    const list = await client.list();
    const sentFolder = list.find((f) => f.specialUse === "\\Sent" || f.path.toLowerCase().includes("sent"));
    const sentPath = sentFolder ? sentFolder.path : "[Gmail]/Sent Mail";

    const mailbox = await client.mailboxOpen(sentPath);
    const totalMessages = mailbox.exists;
    console.log(`[Cron Cleanup] Opened "${sentPath}". Total messages: ${totalMessages}`);

    // Search by subject using uid:true to get UIDs (not sequence numbers)
    const searchResult = await client.search(
      { subject: "Reminder: Pending Submissions" },
      { uid: true }
    );
    const matchingUids = Array.isArray(searchResult) ? searchResult : [];
    console.log(`[Cron Cleanup] Found ${matchingUids.length} portal reminder email(s). UIDs: ${matchingUids.join(",") || "none"}`);

    let deleted = 0;
    if (matchingUids.length > 0) {
      const uidList = matchingUids.join(",");
      await client.messageDelete(uidList, { uid: true });
      deleted = matchingUids.length;
      console.log(`[Cron Cleanup] Successfully deleted ${deleted} email(s) from Sent Mail.`);
    }

    await client.logout();

    return NextResponse.json({
      ok: true,
      deleted,
      sentPath,
      totalMessages,
      matchedUids: matchingUids,
      message: deleted > 0
        ? `Deleted ${deleted} reminder email(s) from Sent Mail.`
        : `No reminder emails found in Sent Mail (checked ${totalMessages} messages in "${sentPath}").`,
    });
  } catch (err) {
    console.error("[Cron Cleanup] IMAP error:", err);
    try { await client.logout(); } catch {}
    return NextResponse.json({ error: "IMAP cleanup failed", detail: String(err) }, { status: 500 });
  }
}
