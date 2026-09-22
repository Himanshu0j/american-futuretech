const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"American FutureTech Admissions" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`[Email Dispatched]: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } else {
      // Mock / Dev logger
      console.log(`
=====================================================
[DEV MOCK EMAIL DISPATCHED]
To: ${to}
Subject: ${subject}
Time: ${new Date().toISOString()}
Message: ${text || 'HTML Template rendered'}
=====================================================
      `);
      return { success: true, mock: true };
    }
  } catch (error) {
    console.error(`Email delivery error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const sendLeadConfirmationEmail = async (lead, courseTitle = 'Technology Program') => {
  const subject = `Welcome to American FutureTech - Your Application for ${courseTitle}`;
  const text = `Hi ${lead.fullName},\n\nThank you for applying for ${courseTitle} at American FutureTech! An admissions counselor will reach out to you shortly to discuss your syllabus, batch timing (${lead.preferredBatch}), and career roadmap.\n\nBest regards,\nAmerican FutureTech Team`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #070b14; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0ea5e9; margin: 0; font-size: 26px;">American FutureTech</h1>
        <p style="color: #94a3b8; margin-top: 5px; font-size: 14px;">Build In-Demand Skills • Shape Your Future</p>
      </div>
      <div style="background-color: #0f172a; padding: 25px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
        <h2 style="color: #38bdf8; margin-top: 0;">Application Received!</h2>
        <p>Dear <strong>${lead.fullName}</strong>,</p>
        <p>We are thrilled to welcome your application for <strong>${courseTitle}</strong>.</p>
        <div style="background-color: #1e293b; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #cbd5e1;"><strong>Preferred Batch:</strong> ${lead.preferredBatch}</p>
          <p style="margin: 4px 0; color: #cbd5e1;"><strong>Phone:</strong> ${lead.phone}</p>
          <p style="margin: 4px 0; color: #cbd5e1;"><strong>Email:</strong> ${lead.email}</p>
        </div>
        <p>Your dedicated career counselor will contact you within 24 hours to guide you through course curriculum details, real-world project portfolios, and placement assistance.</p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 25px;">American FutureTech Admissions Office | 200+ Hiring Partners</p>
      </div>
    </div>
  `;
  return await sendEmail({ to: lead.email, subject, html, text });
};

const sendAdminLeadAlert = async (lead, courseTitle = 'Technology Program') => {
  const adminEmail = process.env.NOTIFICATION_EMAIL || 'info@americantechgloballlc.com';
  const subject = `[NEW LEAD] ${lead.fullName} - ${courseTitle}`;
  const text = `New application received for ${courseTitle} from ${lead.fullName} (${lead.email}, ${lead.phone}). Preferred Batch: ${lead.preferredBatch}.`;
  return await sendEmail({ to: adminEmail, subject, text });
};

module.exports = {
  sendEmail,
  sendLeadConfirmationEmail,
  sendAdminLeadAlert,
};
