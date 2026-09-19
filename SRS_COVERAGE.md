# SRS Addendum — Coverage Matrix (requirement → status)

| SRS ref | Requirement | Status | Where |
|---|---|---|---|
| §2.1.1 | Enterprises table | ✅ Done | schema.prisma Enterprise + migration |
| §2.1.2 | Coupons table | ✅ Done | schema.prisma Coupon + migration |
| §2.1.3 | Employee_Certifications table | ✅ Done | schema.prisma + migration |
| §1.1 | Grading engine (<80 NONE / 80–99.99 GOLD / 100 PLATINUM) | ✅ Done | services/certification.ts, POST /assessments/submit |
| §1.2 | Trial gatekeeping middleware | ✅ Done | services/trialGate.ts |
| FR-1.1 | Drag-and-drop custom test builder | ✅ Done | routes/testBuilder.ts + Enterprise Hub |
| FR-1.2 | Unique URL token generation | ✅ Done | crypto link tokens |
| FR-1.3 | Bulk candidate invites + email routing | ✅ Done | POST /testbuilder/:id/invites |
| FR-1.4 | Custom prospect screens | ✅ Done | /invite/[token] landing |
| FR-2.1 | Geo-IP lookup engine | ✅ Done | services/localization.ts detectRegion |
| FR-2.2 | Localized token replacement | ✅ Done | localizeText + asset bank (ZM/US/UK) |
| FR-2.3 | Currency calibration | ✅ Done | symbol swap in localizeText |
| FR-3.1–3.3 | Competency frameworks + gap extraction | ⚠️ Partial | gap feed in /growth/summary; admin baseline UI pending |
| FR-4.1 | Dark-mode workspace UI | ⚠️ Partial | navy/gold screening UI matches; full hub page pending |
| FR-4.2 | Login streak counter | ✅ Done | /growth/summary (48h reset) |
| FR-4.3 | XP engine | ✅ Done | xpPoints awards |
| FR-4.4 | Row-level data isolation | ✅ Done | authenticate + userId-scoped queries |
| FR-5.1–5.4 | AI learning recommendations | ⚠️ Partial | gap-rationale feed; full library pending |
| FR-6.x | CMS Studio | ⬜ Not started | — |
| FR-7.1–7.4 | Certification loop | ✅ Done | certification engine + my-certifications |
| FR-8.1 | Team performance metrics | ✅ Done | /growth/msr |
| FR-8.2 | Automated MSR on the 1st | ✅ Done | services/msr.ts scheduler (07:00 Africa/Lusaka, stored + emailed) |
| FR-8.3 | MSR PDF/CSV export | ✅ Done | /growth/msr/export/csv + /pdf + Hub buttons |
| FR-9.1 | Base price management | ⚠️ Partial | Dodo product ids env-driven; price panel pending |
| FR-9.2 | Coupon configuration matrix | ✅ Done | /coupons CRUD + validate |
| FR-9.3 | Promo banners | ⬜ Not started | — |
| FR-10.1–10.3 | 30-day trial logic | ✅ Done | trialGate (allow/redirect/lock) |
| FR-11.1 | Webhook signature validation | ✅ Done | HMAC-SHA256 timing-safe |
| FR-11.2 | subscription.created handler | ✅ Done | /webhooks/dodo |
| FR-11.3 | subscription.cancelled handler | ✅ Done | /webhooks/dodo |
| §5 | 300+ question bank (4 pillars × 75) | ✅ Done | seedQuestionBank.ts |
| §4 | Sidebar navigation tree | ⬜ Not started | layout integration pending |

Legend: ✅ implemented · ⚠️ partial · ⬜ not started
