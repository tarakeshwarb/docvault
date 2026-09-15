import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

export const runtime = "nodejs";
// Vercel free plan has a 10s function timeout.
// Keep IMAP operations fast: connect → open → search → move → logout.

export async function GET(request: Request) {
  // Accept secret via header OR query param (for cron-job.org)
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  const expectedSecret = process.env.CRON_SECRET;
  const isAuthorized =
    (authHeader === `Bearer ${expectedSecret}`) ||
    (querySecret === expectedSecret);

  if (!expectedSecret || !isAuthorized) {
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
    // Tight timeouts to avoid Vercel killing mid-operation
    socketTimeout: 8000,
    greetingTimeout: 5000,
  });

  try {
    await client.connect();

    // Find the Sent folder
    const list = await client.list();
    const sentFolder = list.find(
      (f) => f.specialUse === "\\Sent" || f.path.toLowerCase().includes("sent")
    );
    const sentPath = sentFolder ? sentFolder.path : "[Gmail]/Sent Mail";

    // Find Trash folder for moving
    const trashFolder = list.find(
      (f) => f.specialUse === "\\Trash" || f.path.toLowerCase().includes("trash")
    );
    const trashPath = trashFolder ? trashFolder.path : "[Gmail]/Trash";

    const mailbox = await client.mailboxOpen(sentPath);
    const totalMessages = mailbox.exists;
    console.log(`[Cron Cleanup] Opened "${sentPath}". ${totalMessages} total messages.`);

    // Search for all reminder emails (IMAP subject search is substring match)
    const searchResult = await client.search(
      { subject: "Reminder: Pending Submissions" },
      { uid: true }
    );
    const matchingUids: number[] = Array.isArray(searchResult) ? searchResult : [];
    console.log(`[Cron Cleanup] Found ${matchingUids.length} reminder(s). UIDs: ${matchingUids.join(",") || "none"}`);

    let deleted = 0;
    if (matchingUids.length > 0) {
      // Gmail IMAP: messageMove is more reliable than messageDelete.
      // messageDelete uses STORE \Deleted + EXPUNGE which Gmail handles inconsistently.
      // messageMove uses MOVE command which Gmail handles properly.
      const uidRange = matchingUids.join(",");
      try {
        await client.messageMove(uidRange, trashPath, { uid: true });
        deleted = matchingUids.length;
        console.log(`[Cron Cleanup] Moved ${deleted} email(s) to "${trashPath}".`);
      } catch (moveErr) {
        console.error("[Cron Cleanup] messageMove failed, trying messageDelete fallback:", moveErr);
        // Fallback: try batch delete
        try {
          await client.messageDelete(uidRange, { uid: true });
          deleted = matchingUids.length;
          console.log(`[Cron Cleanup] Fallback: deleted ${deleted} email(s) via messageDelete.`);
        } catch (delErr) {
          console.error("[Cron Cleanup] messageDelete also failed:", delErr);
        }
      }
    }

    await client.logout();

    return NextResponse.json({
      ok: true,
      deleted,
      sentPath,
      totalMessages,
      matchedUids: matchingUids,
      message: deleted > 0
        ? `Removed ${deleted} reminder email(s) from Sent Mail.`
        : `No reminder emails found (checked ${totalMessages} messages in "${sentPath}").`,
    });
  } catch (err) {
    console.error("[Cron Cleanup] IMAP error:", err);
    try { await client.logout(); } catch {}
    return NextResponse.json(
      { error: "IMAP cleanup failed", detail: String(err) },
      { status: 500 }
    );
  }
}

