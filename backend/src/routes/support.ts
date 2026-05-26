import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'zamtel.sd@gmail.com',
    pass: 'kmuopprbwoccnhvo', // App Password
  },
});

// POST /api/support/chat — relay live chat message to support email
router.post('/chat', async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    await transporter.sendMail({
      from: '"PsychometricCoach Chat" <zamtel.sd@gmail.com>',
      to: 'support@psycometriccoach.online',
      replyTo: email,
      subject: `[Live Chat] New message from ${name}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
          <div style="background: #0A528A; color: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">💬 New Live Chat Message</h2>
            <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">PsychometricCoach Support</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 16px; font-weight: 600; color: #6b7280; font-size: 13px; width: 100px;">From</td>
              <td style="padding: 12px 16px; color: #111827;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 16px; font-weight: 600; color: #6b7280; font-size: 13px;">Email</td>
              <td style="padding: 12px 16px;"><a href="mailto:${email}" style="color: #0A528A;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: 600; color: #6b7280; font-size: 13px; vertical-align: top;">Message</td>
              <td style="padding: 12px 16px; color: #111827; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
          <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
            Sent via live chat on www.psychometriccoach.com · ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lusaka' })} CAT
          </p>
          <p style="font-size: 12px; color: #9ca3af;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Support email error:', err);
    res.status(500).json({ error: 'Failed to send' });
  }
});

export default router;
