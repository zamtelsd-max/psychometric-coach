// SRS FR-9.3 + ad-slot polish: default promo banners + house ads (self-promo)
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function main() {
  const month = new Date().toISOString().slice(0, 7);
  // Promo banners (trial conversion + general)
  const banners = [
    { message: `Launch offer: 20% off Enterprise this month — code GROW20`, ctaText: 'See plans', ctaUrl: '/enterprise', audience: 'ALL' },
    { message: 'Your 30-day enterprise trial includes the full question bank — upgrade anytime', ctaText: 'Upgrade', ctaUrl: '/enterprise', audience: 'TRIAL' },
  ];
  for (const b of banners) {
    const exists = await prisma.promoBanner.findFirst({ where: { message: b.message } });
    if (!exists) await prisma.promoBanner.create({ data: { ...b, createdBy: 'seed' } });
  }
  // House ad (clearly self-promotional) so SIDEBAR slot renders out of the box
  const email = 'house@psychometriccoach.com';
  let adv = await prisma.advertiser.findUnique({ where: { email } });
  if (!adv) adv = await prisma.advertiser.create({ data: { companyName: 'PsychometricCoach (House)', contactName: 'House Ads', email, passwordHash: await bcrypt.hash('house-' + Math.random(), 10), verified: true } });
  const adExists = await prisma.ad.findFirst({ where: { advertiserId: adv.id, title: 'House — Advertise with us' } });
  if (!adExists) {
    await prisma.ad.create({ data: {
      advertiserId: adv.id, title: 'House — Advertise with us',
      headline: 'Reach thousands of job-seekers & HR teams',
      bodyText: 'Promote your brand across PsychometricCoach assessments, practice screens and dashboards.',
      ctaText: 'Start advertising', ctaUrl: 'https://www.psychometriccoach.com/advertise',
      slot: 'SIDEBAR', status: 'APPROVED', budget: 0,
    } });
  }
  console.log(`promo seeded (banners + house ad) — ${month}`);
}
main().finally(() => prisma.$disconnect());
