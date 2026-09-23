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

const money = (amount) => `$${Number(amount || 0).toLocaleString('en-US')}`;

const receiptRows = (payment) => `
  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Invoice:</strong> ${payment.invoiceNumber}</p>
  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Transaction:</strong> ${payment.transactionId}</p>
  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Program:</strong> ${payment.courseTitle}</p>
  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Tier:</strong> ${payment.tier === 'deposit' ? 'Seat Reservation Deposit' : payment.tier === 'personalized' ? 'Personalized 1-on-1 Track' : 'Full Tuition'}</p>
  ${payment.discountAmount ? `<p style="margin: 4px 0; color: #cbd5e1;"><strong>Voucher Discount:</strong> -${money(payment.discountAmount)}</p>` : ''}
  <p style="margin: 4px 0; color: #86efac;"><strong>Amount Paid:</strong> ${money(payment.amount)} ${payment.currency}</p>
`;

const shell = (inner) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #070b14; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #0ea5e9; margin: 0; font-size: 24px;">American FutureTech</h1>
      <p style="color: #94a3b8; margin-top: 5px; font-size: 13px;">Build In-Demand Skills • Shape Your Future</p>
    </div>
    <div style="background-color: #0f172a; padding: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
      ${inner}
    </div>
    <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 22px;">
      American FutureTech · 30 N Gould St Ste R, Sheridan, WY 82801, United States
    </p>
  </div>
`;

// Sent to the student immediately after Stripe confirms the payment.
const sendPaymentReceiptEmail = async ({ payment, studentName, loginUrl }) => {
  const subject = `Payment Confirmed — Invoice ${payment.invoiceNumber} | American FutureTech`;
  const text = `Hi ${studentName}, we received your payment of ${money(payment.amount)} ${payment.currency} for ${payment.courseTitle}. Invoice: ${payment.invoiceNumber}. Transaction: ${payment.transactionId}.`;
  const html = shell(`
    <h2 style="color: #38bdf8; margin-top: 0;">Payment Received ✅</h2>
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>Your enrollment for <strong>${payment.courseTitle}</strong> is confirmed. Here is your official receipt:</p>
    <div style="background-color: #1e293b; padding: 15px; border-radius: 6px; margin: 18px 0;">
      ${receiptRows(payment)}
    </div>
    <p>Keep this email for your records. A member of our admissions team will contact you with onboarding and cohort details.</p>
    ${loginUrl ? `<p style="margin-top: 18px;"><a href="${loginUrl}" style="background-color: #4338ca; color: #ffffff; padding: 11px 22px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 13px;">Open Student Portal</a></p>` : ''}
  `);
  return await sendEmail({ to: payment.email, subject, html, text });
};

// Sent when a brand-new student account was created by the payment webhook.
const sendEnrollmentCredentialsEmail = async ({ payment, tempPassword, loginUrl }) => {
  const subject = `Your Student Portal Access — ${payment.courseTitle} | American FutureTech`;
  const text = `Hi ${payment.studentName}, your enrollment is confirmed. Student portal login: ${loginUrl}. Email: ${payment.email}. Temporary password: ${tempPassword} — please change it after your first login.`;
  const html = shell(`
    <h2 style="color: #38bdf8; margin-top: 0;">Your Enrollment Is Complete 🎓</h2>
    <p>Dear <strong>${payment.studentName}</strong>,</p>
    <p>Welcome aboard! Your seat in <strong>${payment.courseTitle}</strong> is confirmed and your student portal account has been created.</p>
    <div style="background-color: #1e293b; padding: 15px; border-radius: 6px; margin: 18px 0;">
      <p style="margin: 4px 0; color: #cbd5e1;"><strong>Portal Login (Email):</strong> ${payment.email}</p>
      <p style="margin: 4px 0; color: #fde68a;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 15px;">${tempPassword}</span></p>
      ${receiptRows(payment)}
    </div>
    <p style="color: #fca5a5;">For your security, please change this temporary password from <em>Profile → Security</em> right after your first login.</p>
    ${loginUrl ? `<p style="margin-top: 18px;"><a href="${loginUrl}" style="background-color: #4338ca; color: #ffffff; padding: 11px 22px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 13px;">Login to Student Portal</a></p>` : ''}
  `);
  return await sendEmail({ to: payment.email, subject, html, text });
};

// Internal alert so the team sees money landing in real time.
const sendAdminPaymentAlert = async (payment) => {
  const adminEmail = process.env.NOTIFICATION_EMAIL || 'info@americantechgloballlc.com';
  const subject = `[PAYMENT] ${money(payment.amount)} — ${payment.studentName} (${payment.courseTitle})`;
  const text = `${payment.studentName} (${payment.email}, ${payment.phone}) paid ${money(payment.amount)} ${payment.currency} via ${payment.tier} for ${payment.courseTitle}. Invoice ${payment.invoiceNumber}, transaction ${payment.transactionId}.`;
  return await sendEmail({ to: adminEmail, subject, text });
};

module.exports = {
  sendEmail,
  sendLeadConfirmationEmail,
  sendAdminLeadAlert,
  sendPaymentReceiptEmail,
  sendEnrollmentCredentialsEmail,
  sendAdminPaymentAlert,
};
