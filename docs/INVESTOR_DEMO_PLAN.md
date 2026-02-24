# ClearConsent — Investor Demo Readiness Plan

## Current State (as of 2026-02-24)

### What's Already Working
- Module creation with AI consent text generation (Gemini 2.5 Flash)
- Invitation sending + email delivery (Resend)
- Patient consent signing (guest, login, or signup paths)
- PDF generation with professional formatting (pdf-lib)
- Provider & patient dashboards with real Supabase data
- Consent withdrawal tracking with reason capture
- Demo mode with floating toolbar (limited to mock patient view)
- Video support (YouTube, Vimeo, direct) in modules
- Module duplication, deletion, search/filter
- 7-day auto-expiring invitation links

---

## Priority 1: Fix Broken Things (must-fix before demo)

1. **Table name mismatch** — `Settings.tsx` queries `user_profiles` but recent migrations created `provider_profiles` / `patient_profiles`. Likely causes errors on the settings page.
2. **Missing `/submissions` page** — Dashboard "View All" link routes to a page that doesn't exist (404).
3. **Route protection** — No `ProtectedRoute` wrapper component. Protected pages flash briefly before redirecting unauthenticated users.

## Priority 2: Make the Demo Compelling

4. **Seed demo data** — Pre-populate a demo account with modules, invitations at various stages (pending, viewed, completed, withdrawn) so dashboards look alive, not empty.
5. **Landing page upgrade** — Current homepage should sell the vision. Investors need to see the value prop instantly.
6. **Guided demo flow** — Tooltip tour or step-by-step walkthrough so you can narrate while clicking through.

## Priority 3: Polish the Experience

7. **Patient progress tracking** — A view where the provider sees exactly where each patient is (invited → viewed → signed). This is the "money shot" for investors.
8. **PDF preview** — Let providers preview the signed consent in-browser instead of just downloading.
9. **Loading states / skeletons** — Replace blank loading screens with skeleton shimmer for a polished feel.
10. **Consent signing polish** — Add a step indicator, smooth transitions, and a satisfying success animation.

## Priority 4: Features That Show Vision

11. **Analytics dashboard** — Charts showing completion rates, average time-to-sign, trends over time. Investors love data visualizations.
12. **Real-time updates** — When a patient signs, the provider's dashboard updates live. Great for live demos.
13. **Account deletion** — Currently just shows a toast. Needs real implementation for compliance credibility.

---

## Bonus Feature Suggestions

- **Consent expiry reminders** — Auto-email patients when their invitation is about to expire
- **Multi-language support** — Even a "coming soon" badge shows accessibility thinking
- **Provider team management** — Multiple providers under one org, with role-based access
- **Consent versioning** — When a module is updated, show patients which version they signed
- **Patient portal branding** — Let providers customize colors/logo on the signing page
- **Mobile-first signing** — Most patients sign on their phone; ensure the experience is flawless

---

## Demo Walkthrough Script (Target Flow)

1. **Landing page** — Explain value prop, click "Get Started"
2. **Provider signup** — Create account as provider
3. **Module creation** — Create a consent module, use AI to generate text, add a video
4. **Send invitation** — Invite a patient by email
5. **Patient experience** — Open email link, review consent, watch video, sign
6. **Provider dashboard** — Show the signed consent appear, view progress
7. **Download PDF** — Download the signed consent document
8. **Analytics** — Show completion rates and trends

---

## Known Technical Debt

- No automated tests (unit, integration, or E2E)
- RLS policies may be incomplete across all tables
- Audit logging infrastructure exists but not fully wired
- Email validation is basic regex only
- Signature is typed text only (no canvas/cryptographic)
- No duplicate invite prevention (same email + same module)
- PDF signed URLs expire after 1 year with no revocation mechanism
- No rate limiting on invite resends
- Patient account deletion not implemented (toast placeholder only)
