import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { exec } from 'child_process';

// Send an email-verification message via the VM mailer.
function sendVerificationEmail(email: string, name: string, token: string): void {
  const link = `https://www.psychometriccoach.com/verify-email?token=${token}`;
  const bodyTxt = `Hi ${name || ''},\n\nWelcome to PsychometricCoach! Please confirm your email address to activate your account (link valid for 24 hours):\n\n${link}\n\nIf you did not create this account, you can ignore this email.\n\n— PsychometricCoach`;
  try {
    exec(`gsk vm_email send ${JSON.stringify(email)} -s "Verify your PsychometricCoach email" -b ${JSON.stringify(bodyTxt)} -f $OPENCLAW_VM_NAME`, () => {});
  } catch {}
}

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 2 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, name } = req.body as { email: string; password: string; name: string };

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      const user = await prisma.user.create({
        data: { email, passwordHash, name, emailVerified: false, verifyToken, verifyTokenExpiry },
        select: { id: true, email: true, name: true },
      });

      sendVerificationEmail(user.email, user.name, verifyToken);

      // No token issued — user must verify their email before logging in.
      res.status(201).json({
        success: true,
        requiresVerification: true,
        message: 'Account created. Please check your email to verify your address before signing in.',
        email: user.email,
      });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Require a verified email before allowing access.
      if (!(user as any).emailVerified) {
        res.status(403).json({
          error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
          requiresVerification: true,
          email: user.email,
        });
        return;
      }

      // Update last active
      await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, plan: user.plan },
        process.env.JWT_SECRET!,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      );

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        streakDays: true,
        lastActiveAt: true,
        diagnosticDone: true,
        readinessScore: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post(
  '/change-password',
  authenticate,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

      res.json({ message: 'Password updated successfully' });
    } catch {
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// ── Forgot password: email a reset code ──────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const email = String((req.body || {}).email || '').toLowerCase().trim();
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiry: expiry } });
    const link = `https://www.psychometriccoach.com/reset-password?token=${token}`;
    try {
      const { exec } = require('child_process');
      const bodyTxt = `Hello,\n\nWe received a request to reset your PsychometricCoach password. Use the link below (valid for 1 hour):\n\n${link}\n\nOr enter this code on the reset page:\n${token}\n\nIf you did not request this, ignore this email.\n\n— PsychometricCoach`;
      exec(`gsk vm_email send "${user.email}" -s "Reset your PsychometricCoach password" -b ${JSON.stringify(bodyTxt)} -f $OPENCLAW_VM_NAME`, () => {});
    } catch {}
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.', resetToken: token });
    return;
  }
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// ── Reset password with a valid token ────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body || {};
  if (!token || !password || String(password).length < 6) { res.status(400).json({ error: 'token and a password (min 6 chars) are required' }); return; }
  const user = await prisma.user.findFirst({ where: { resetToken: String(token), resetTokenExpiry: { gt: new Date() } } });
  if (!user) { res.status(400).json({ error: 'Invalid or expired reset token' }); return; }
  await prisma.user.update({ where: { id: user.id }, data: {
    passwordHash: await bcrypt.hash(String(password), 10), resetToken: null, resetTokenExpiry: null,
  } });
  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

// ── Verify email with a token ────────────────────────────────────
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  const token = String((req.body || {}).token || (req.query.token as string) || '').trim();
  if (!token) { res.status(400).json({ error: 'token required' }); return; }
  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user) { res.status(400).json({ error: 'Invalid or already-used verification link.' }); return; }
  if ((user as any).emailVerified) { res.json({ success: true, message: 'Email already verified. You can sign in.' }); return; }
  if ((user as any).verifyTokenExpiry && (user as any).verifyTokenExpiry < new Date()) {
    res.status(400).json({ error: 'Verification link has expired. Please request a new one.', expired: true, email: user.email });
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null } as any });
  res.json({ success: true, message: 'Email verified! You can now sign in.' });
});

// ── Resend the verification email ───────────────────────────────
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
  const email = String((req.body || {}).email || '').toLowerCase().trim();
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !(user as any).emailVerified) {
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { verifyToken, verifyTokenExpiry } as any });
    sendVerificationEmail(user.email, user.name, verifyToken);
  }
  res.json({ success: true, message: 'If that account exists and is unverified, a new verification email has been sent.' });
});

export default router;
