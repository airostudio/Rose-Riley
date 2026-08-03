// Vercel serverless function — contact form handler
// Sends a confirmation to the enquirer and a notification to Rose via Resend.
// Required env var: RESEND_API_KEY (set in Vercel project settings)
// The `from` domain (rosereilly.com.au) must be verified in your Resend account.

// Prevent MaxListenersExceededWarning on warm Vercel invocations:
// the Node fetch/undici internals add a `close` listener per request and
// accumulate across reused processes. Setting a higher ceiling suppresses
// the false-positive warning without masking real leaks.
process.setMaxListeners(25);

const ROSE_EMAIL   = 'rose@rosereilly.com.au';
const FROM_ADDRESS = 'Rose Reilly Psychology <noreply@rosereilly.com.au>';

const REFERRAL_LABELS = {
  self:       'Self-referral',
  gp:         'GP / Mental Health Treatment Plan',
  specialist: 'Specialist referral',
  other:      'Other',
};

const HEAR_ABOUT_LABELS = {
  gp:        'GP / Treating doctor',
  search:    'Internet search',
  referral:  'Friend or colleague',
  directory: 'Psychology directory',
  other:     'Other',
};

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

async function sendEmail(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  return res.json();
}

function confirmationHtml(name) {
  const safeName = escapeHtml(name);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thank you for your enquiry</title></head>
<body style="margin:0;padding:0;background:#F5F1EB;font-family:Georgia,'Times New Roman',serif;color:#2C3233;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EB;padding:48px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#FFFFFF;border-radius:10px;overflow:hidden;">
        <!-- Header band -->
        <tr><td style="background:#6B8F71;padding:24px 36px 22px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Rose Reilly Psychology</p>
        </td></tr>
        <!-- Main content -->
        <tr><td style="padding:40px 36px 32px;">
          <h1 style="margin:0 0 22px;font-weight:400;font-size:26px;line-height:1.3;color:#2C3233;">Thank you for reaching out.</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#4A5568;">Dear ${safeName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.8;color:#4A5568;">Your enquiry has been received. Rose will be in touch within 1 business day to discuss your needs and arrange a suitable time to speak.</p>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.8;color:#4A5568;">If you need to contact Rose directly in the meantime:</p>
          <table cellpadding="0" cellspacing="0" style="border-left:3px solid #6B8F71;padding-left:16px;margin-bottom:32px;">
            <tr><td style="font-family:Arial,sans-serif;font-size:14px;color:#4A5568;padding:5px 0;"><strong style="color:#2C3233;">Phone</strong>&ensp;08 6185 8254</td></tr>
            <tr><td style="font-family:Arial,sans-serif;font-size:14px;color:#4A5568;padding:5px 0;"><strong style="color:#2C3233;">Email</strong>&ensp;rose@rosereilly.com.au</td></tr>
          </table>
          <p style="margin:0;font-size:18px;font-style:italic;color:#6B8F71;line-height:1.4;">You're in safe hands.</p>
        </td></tr>
        <!-- Divider -->
        <tr><td style="padding:0 36px;"><div style="border-top:1px solid #E2DDD6;"></div></td></tr>
        <!-- Crisis footer -->
        <tr><td style="padding:20px 36px 28px;">
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;line-height:1.65;color:#6B7280;"><strong>Not a crisis service.</strong> If you or someone else is in immediate danger, call <strong>000</strong>. For 24/7 crisis support: Lifeline 13&nbsp;11&nbsp;14 &middot; Beyond Blue 1300&nbsp;22&nbsp;4636.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#9CA3AF;">Rose Reilly Psychology &middot; Provider No.&nbsp;257129EX &middot; AHPRA Registered Psychologist</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function notificationHtml(data) {
  const { name, email, phone, referral, message, hearAbout } = data;
  const safeName      = escapeHtml(name);
  const safeEmail     = escapeHtml(email);
  const safePhone     = escapeHtml(phone || '—');
  const safeMessage   = nl2br(message);
  const referralText  = escapeHtml(REFERRAL_LABELS[referral]  || referral  || '—');
  const hearAboutText = escapeHtml(HEAR_ABOUT_LABELS[hearAbout] || hearAbout || '—');

  const row = (label, value) =>
    `<tr>
      <td style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#4A6A50;padding:9px 14px 9px 0;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#2C3233;padding:9px 0;vertical-align:top;">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>New enquiry from ${safeName}</title></head>
<body style="margin:0;padding:0;background:#F5F1EB;font-family:Arial,sans-serif;color:#2C3233;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1EB;padding:48px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#FFFFFF;border-radius:10px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#6B8F71;padding:24px 36px 22px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Rose Reilly Psychology</p>
          <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);">New website enquiry</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:36px 36px 28px;">
          <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#2C3233;">Enquiry from ${safeName}</h2>
          <!-- Details table -->
          <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #E2DDD6;margin-bottom:24px;">
            ${row('Name', safeName)}
            ${row('Email', `<a href="mailto:${safeEmail}" style="color:#4A6A50;">${safeEmail}</a>`)}
            ${row('Phone', safePhone !== '—' ? `<a href="tel:${safeEmail}" style="color:#4A6A50;">${safePhone}</a>` : '—')}
            ${row('Referral type', referralText)}
            ${row('Heard about practice', hearAboutText)}
          </table>
          <!-- Message -->
          <div style="background:#F2F6F3;border-left:3px solid #6B8F71;border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4A6A50;">Message</p>
            <p style="margin:0;font-size:15px;line-height:1.75;color:#2C3233;">${safeMessage}</p>
          </div>
          <!-- Reply prompt -->
          <p style="margin:0;font-size:13px;color:#6B7280;">Reply directly to this email to respond to ${safeName}.</p>
        </td></tr>
        <tr><td style="padding:0 36px;"><div style="border-top:1px solid #E2DDD6;"></div></td></tr>
        <tr><td style="padding:16px 36px 24px;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;">Rose Reilly Psychology &middot; Website enquiry form</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, referral, message, hearAbout } = req.body ?? {};

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'Email service is not configured.' });
    }

    await Promise.all([
      // Confirmation to the enquirer
      sendEmail(apiKey, {
        from:     FROM_ADDRESS,
        to:       email.trim(),
        reply_to: ROSE_EMAIL,
        subject:  'Thank you for your enquiry — Rose Reilly Psychology',
        html:     confirmationHtml(name.trim()),
      }),
      // Notification to Rose
      sendEmail(apiKey, {
        from:     FROM_ADDRESS,
        to:       ROSE_EMAIL,
        reply_to: email.trim(),
        subject:  `New enquiry from ${name.trim()}`,
        html:     notificationHtml({ name, email, phone, referral, message, hearAbout }),
      }),
    ]);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({
      error: 'Something went wrong sending your enquiry. Please try again or contact Rose directly on 08 6185 8254.',
    });
  }
};
