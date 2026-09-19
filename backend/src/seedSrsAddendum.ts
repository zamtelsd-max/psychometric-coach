// Seed: localization assets + sample coupons (SRS FR-2.2, FR-9.2)
import prisma from './lib/prisma';

const ASSETS: Array<{ region: string; token: string; value: string }> = [
  { region: 'ZM', token: 'LocalName1', value: 'Chansa' }, { region: 'ZM', token: 'LocalName2', value: 'Bwalya' },
  { region: 'ZM', token: 'LocalCompany1', value: 'Mwansa Ltd' }, { region: 'ZM', token: 'LocalCompany2', value: 'Zambezi Logistics' },
  { region: 'ZM', token: 'LocalCurrency', value: 'K' },
  { region: 'US', token: 'LocalName1', value: 'John' }, { region: 'US', token: 'LocalName2', value: 'Sarah' },
  { region: 'US', token: 'LocalCompany1', value: 'Smith Corp' }, { region: 'US', token: 'LocalCompany2', value: 'Riverside Logistics' },
  { region: 'US', token: 'LocalCurrency', value: '$' },
  { region: 'UK', token: 'LocalName1', value: 'Oliver' }, { region: 'UK', token: 'LocalName2', value: 'Amelia' },
  { region: 'UK', token: 'LocalCompany1', value: 'Smith & Co' }, { region: 'UK', token: 'LocalCompany2', value: 'Thames Logistics' },
  { region: 'UK', token: 'LocalCurrency', value: '£' },
];

async function main() {
  for (const a of ASSETS) await prisma.localizationAsset.upsert({ where: { region_token: { region: a.region, token: a.token } }, update: { value: a.value }, create: a });
  const coupons = [
    { couponCode: 'GROW20', discountType: 'PERCENTAGE' as const, discountValue: 20 },
    { couponCode: 'ZAMBIA_ENTERPRISE', discountType: 'FLAT_FIXED' as const, discountValue: 50 },
  ];
  for (const c of coupons) await prisma.coupon.upsert({ where: { couponCode: c.couponCode }, update: {}, create: c });
  console.log('SRS addendum seed done');
}
main().finally(() => prisma.$disconnect());
