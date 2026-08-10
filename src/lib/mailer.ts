import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn("BREVO_API_KEY is not set. Skipping email send.");
    return null;
  }

  const payload = {
    sender: { name: "Course Coordinator Portal", email: "yourboyy1727@gmail.com" },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Brevo API error:", errorBody);
    throw new Error(`Failed to send email: ${response.statusText}`);
  }

  return await response.json();
}
