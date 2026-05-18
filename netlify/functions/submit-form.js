const nodemailer = require("nodemailer");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Parse multipart form data manually using busboy
    const busboy = require("busboy");
    const bb = busboy({ headers: event.headers });

    const fields = {};
    const attachments = [];

    await new Promise((resolve, reject) => {
      bb.on("file", (name, file, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        file.on("data", (chunk) => chunks.push(chunk));
        file.on("end", () => {
          if (filename) {
            attachments.push({
              filename,
              content: Buffer.concat(chunks),
              contentType: mimeType,
            });
          }
        });
      });

      bb.on("field", (name, value) => {
        fields[name] = value;
      });

      bb.on("finish", resolve);
      bb.on("error", reject);

      const body = event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : Buffer.from(event.body);
      bb.write(body);
      bb.end();
    });

    // Build email HTML body
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #f5a623; padding-bottom: 10px;">
          New Inquiry — Brother's Global Sourcing
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          ${Object.entries(fields)
            .filter(([key]) => key !== "form-name")
            .map(
              ([key, value]) => `
            <tr>
              <td style="padding: 10px 12px; background: #fff; border: 1px solid #e5e5e5; font-weight: bold; color: #555; width: 35%;">${key}</td>
              <td style="padding: 10px 12px; background: #fff; border: 1px solid #e5e5e5; color: #1a1a1a;">${value || "—"}</td>
            </tr>`
            )
            .join("")}
        </table>
        ${
          attachments.length > 0
            ? `<p style="margin-top: 20px; color: #555; font-size: 13px;">📎 ${attachments.length} attachment(s) included.</p>`
            : ""
        }
        <p style="margin-top: 24px; font-size: 12px; color: #aaa;">Submitted via bdbgs.com contact form</p>
      </div>
    `;

    // Nodemailer transporter using Hostinger SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,       // e.g. smtp.hostinger.com
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,                       // true for port 465
      auth: {
        user: process.env.SMTP_USER,      // your full email e.g. info@bdbgs.com
        pass: process.env.SMTP_PASS,      // your email password
      },
    });

    await transporter.sendMail({
      from: `"BGS Website" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,          // sends to yourself
      replyTo: fields["Email"] || process.env.SMTP_USER,
      subject: `New Inquiry from ${fields["Name"] || "Website Visitor"} — ${fields["Inquiry Type"] || "General"}`,
      html: emailHtml,
      attachments,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Form submission error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
