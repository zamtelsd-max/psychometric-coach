// Permanent platform admin. Usage (password never lives in the repo):
//   ADMIN_PASSWORD='Strong-Pass-Here' npx ts-node src/seedAdmin.ts
// Rerun-safe upsert: create-only, so the password you set the first time stays permanent.
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@psychometriccoach.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) { console.error('Set ADMIN_PASSWORD (min 10 chars)'); process.exit(1); }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { console.log(`Admin already exists: ${email} (password unchanged)`); return; }
  await prisma.user.create({ data: {
    email, name: 'Platform Admin', role: 'ADMIN', plan: 'PREMIUM',
    passwordHash: await bcrypt.hash(password, 10), emailVerified: true, diagnosticDone: true,
  } });
  console.log(`Permanent admin created: ${email}`);
}
main().finally(() => prisma.$disconnect());
