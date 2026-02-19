# ClearConsent User Stories

This document contains 14 user stories covering all four phases of the ClearConsent PRD v1.0.  
Each story is sized to be completable in one developer session and includes verifiable acceptance criteria.

## Story Format

- **ID:** Unique identifier (US-XXX)
- **Title:** Short descriptive title
- **Description:** As a [role], I need to [action] so that [benefit]
- **Acceptance Criteria:** Mechanically verifiable criteria; includes test and typecheck requirements
- **Phase:** PRD phase number (1–4)
- **Complexity:** Estimated effort (S=1–2 days, M=3–5 days, L=1–2 weeks)

---

## Phase 1: Infrastructure & Decoupling

### US-001: Purge leaked credentials from git history
**Description:** As a developer, I need to remove the committed .env file from git history, add .env to .gitignore, and audit the entire commit history for any other leaked credentials so that the repository no longer contains exposed secrets and is safe for public distribution.

**Acceptance Criteria:**
- .env file is removed from git history (no trace in any commit)
- .gitignore includes .env, .env.local, .env.*.local
- truffleHog/git‑secrets scan reports no high‑confidence secrets in git history
- Tests for secret‑detection pass
- Typecheck passes

**Phase:** 1  
**Complexity:** S

### US-002: Migrate from Lovable Cloud to Supabase Pro
**Description:** As a developer, I need to create a new Supabase Pro project, export the existing schema from the Lovable‑managed instance, apply enhanced production schema, migrate edge functions, and update frontend configuration so that ClearConsent runs on a HIPAA‑eligible infrastructure with a signed BAA.

**Acceptance Criteria:**
- New Supabase Pro project created in us‑east‑1 (or equivalent HIPAA‑eligible region)
- Existing schema exported and applied to new project with production enhancements (Section 9)
- Three edge functions (generate‑consent‑text, generate‑consent‑pdf, send‑invite‑email) copied and environment variables updated
- Frontend configuration points to new Supabase project URLs and anon keys via environment variables
- No hardcoded secrets in source code
- Typecheck passes

**Phase:** 1  
**Complexity:** M

### US-003: Set up deployment pipeline with Vercel and CI/CD
**Description:** As a developer, I need to connect the GitHub repo to Vercel Pro, configure staging and production environments, implement CI/CD with linting, type checking, unit tests, and branch protection so that code changes are automatically validated and deployed safely.

**Acceptance Criteria:**
- Repository linked to Vercel Pro with environment variables configured in dashboard
- Staging (staging.clearconsent.net) and production (clearconsent.net) environments active
- GitHub Actions workflow runs ESLint, tsc, Vitest on every PR
- Automated deployment to staging on PR merge; production deploys require manual approval
- Branch protection enabled on main (PR reviews, passing CI checks, no direct pushes)
- Typecheck passes

**Phase:** 1  
**Complexity:** M

---

## Phase 2: Core Application Build‑Out

### US-004: Implement authentication enhancements
**Description:** As a developer, I need to add TOTP‑based MFA for providers, enforce password policies, implement session timeout with warning modal, and create organization onboarding so that provider accounts are secure and each practice is isolated as a tenant.

**Acceptance Criteria:**
- Providers required to set up TOTP MFA at signup (Supabase Auth MFA)
- Password policy: minimum 12 characters, complexity requirements, lockout after 5 failed attempts
- 15‑minute inactivity timeout for providers, 30 minutes for patients with 2‑minute warning modal
- Provider signup creates an organization; additional providers can be invited by OrgAdmin
- All authentication flows work across Chrome, Safari, Firefox, and mobile browsers
- Tests for auth flows pass
- Typecheck passes

**Phase:** 2  
**Complexity:** M

### US-005: Rebuild provider dashboard with overview and patient management
**Description:** As a developer, I need to create a provider dashboard with overview cards, recent activity feed, quick actions, and a filterable patient list so that providers can monitor consent activity and manage patients efficiently.

**Acceptance Criteria:**
- Dashboard displays: total patients, pending consents, completed this month, expiring soon
- Recent activity feed shows consent status changes, new patient sign‑ups, approaching expirations
- Quick actions: create consent request, invite patient, generate report
- Patient list supports search, status filters, and sorting
- All dashboard data respects RLS (providers see only their organization’s data)
- Tests for dashboard components pass
- Typecheck passes

**Phase:** 2  
**Complexity:** M

### US-006: Implement consent module management with AI text generation
**Description:** As a developer, I need to build consent template creation, AI‑powered text generation via Anthropic API, version control, and SUD‑specific module type so that providers can create reusable, compliant consent forms with clinically accurate language.

**Acceptance Criteria:**
- Providers can create consent templates with title, consent text, education materials (video/PDF links)
- AI endpoint calls Anthropic API with procedure‑specific prompts; generated text is draft only
- Providers must explicitly approve AI‑generated text before template becomes active
- Template versioning: modifications create new versions, existing active consents unaffected
- SUD module type includes required fields: recipient name, purpose, information description
- Tests for consent template creation and AI integration pass
- Typecheck passes

**Phase:** 2  
**Complexity:** L

### US-007: Build patient consent workflow including SUD consent flow
**Description:** As a developer, I need to implement patient onboarding, consent assignment, educational material completion, e‑signature capture, and SUD‑specific prohibition acknowledgment so that patients can securely review and sign consents with full compliance for 42 CFR Part 2.

**Acceptance Criteria:**
- Patients receive email invitation with secure link; first‑time users create account
- Patient dashboard shows assigned consents with status badges
- Educational materials (video/PDF) must be completed before consent form is accessible
- SUD consents display federal prohibition statement in amber callout with required acknowledgment checkbox
- E‑signature capture supports drawn (canvas) and typed signatures
- Consent PDF generated immediately upon signing and available for download
- Tests for patient consent workflow pass
- Typecheck passes

**Phase:** 2  
**Complexity:** L

### US-008: Integrate Stripe subscription billing
**Description:** As a developer, I need to integrate Stripe Checkout for subscription signup, implement tier‑based usage tracking, and create a customer portal for self‑service management so that ClearConsent can operate as a sustainable SaaS business.

**Acceptance Criteria:**
- Stripe Checkout embedded for subscription signup (Starter, Professional, Enterprise tiers)
- Stripe Customer Portal accessible for billing management
- Usage tracking: consent volume per organization per billing period; enforce tier limits
- 14‑day free trial on Professional tier (no credit card required)
- Graceful upgrade prompts when limits approached
- Tests for billing integration pass
- Typecheck passes

**Phase:** 2  
**Complexity:** M

### US-009: Implement blockchain timestamping (optional feature)
**Description:** As a developer, I need to add keccak256 hash generation, Base L2 transaction submission, and verification page so that signed consents have cryptographic proof of existence at a specific time, providing tamper‑evident audit trail.

**Acceptance Criteria:**
- On consent submission, compute keccak256 hash of consent document (all fields + signature data)
- Edge function submits hash to Base L2 network via viem (cost ~$0.01 per transaction)
- Verification page allows anyone with consent ID to confirm hash matches stored consent
- Graceful degradation: if blockchain submission fails, consent still valid; retry queue processes failures
- Consent flagged as “pending blockchain verification” until confirmed
- Tests for blockchain integration pass
- Typecheck passes

**Phase:** 2  
**Complexity:** M

---

## Phase 3: Security & Compliance Implementation

### US-010: Implement RLS policies for all PHI tables
**Description:** As a developer, I need to create row‑level security policies for every table containing PHI, enforcing organization‑level data isolation and immutability of signed consents so that users can only access data belonging to their organization and signed records cannot be altered.

**Acceptance Criteria:**
- RLS enabled on organizations, user_profiles, consent_templates, consent_requests, signatures, audit_log
- SELECT policies restrict rows to matching org_id (derived from auth.uid())
- INSERT policies ensure org_id consistency with authenticated user’s organization
- UPDATE policies prevent modifications to signed consents (status = ‘signed’)
- No DELETE policies — soft delete only via deleted_at flag
- Integration tests verify User A cannot access User B’s data across all tables
- Typecheck passes

**Phase:** 3  
**Complexity:** M

### US-011: Implement comprehensive audit logging system
**Description:** As a developer, I need to create an audit_log table with append‑only enforcement, automate logging of all PHI access and modifications, and implement retention policies so that every interaction with PHI is recorded for compliance and security monitoring.

**Acceptance Criteria:**
- audit_log table includes: timestamp, actor_id, action, resource_type, resource_id, org_id, ip_address, user_agent, details (JSONB)
- Append‑only enforcement: RLS allows INSERT only, no UPDATE or DELETE
- Database triggers on all PHI tables automatically insert audit records on INSERT/UPDATE/DELETE
- Frontend middleware logs READ events for consent views
- 6‑year retention policy; after 1 year, archive to cold storage
- Tests for audit logging pass
- Typecheck passes

**Phase:** 3  
**Complexity:** M

### US-012: Set up data encryption and key management
**Description:** As a developer, I need to verify encryption at rest, enforce TLS 1.3, implement application‑level encryption for sensitive fields, and document key rotation procedures so that PHI is protected both in transit and at rest with industry‑standard cryptographic controls.

**Acceptance Criteria:**
- Supabase Pro uses AES‑256 encryption at rest (verified in project settings)
- TLS 1.3 enforced on all connections (Vercel + Supabase)
- Sensitive fields (signature_data, patient SSN if collected) encrypted at application level before storage
- Encryption keys stored in Supabase Vault or AWS Secrets Manager
- Key rotation procedure documented and tested
- Tests for encryption workflows pass
- Typecheck passes

**Phase:** 3  
**Complexity:** S

### US-013: Draft compliance documentation
**Description:** As a developer, I need to draft privacy policy, terms of service, notice of privacy practices template, risk assessment, breach notification plan, and data retention policy so that the necessary compliance documents are ready for attorney review and publication.

**Acceptance Criteria:**
- Privacy policy draft covers PHI collection, use, disclosure, and patient rights (HIPAA Privacy Rule)
- Terms of service draft outlines provider responsibilities and liability
- Notice of Privacy Practices (NPP) template provided for provider customization
- Risk assessment document identifies threats, vulnerabilities, and mitigations
- Breach notification plan details 60‑day notification procedures
- Data retention policy specifies retention periods for all data types
- All drafts saved in docs/ directory
- Typecheck passes

**Phase:** 3  
**Complexity:** S

---

## Phase 4: Testing, Audit & Launch Preparation

### US-014: Implement automated test suite and prepare for security audit
**Description:** As a developer, I need to write unit, integration, and E2E tests covering critical user flows, set up security testing tools, and prepare the codebase for third‑party penetration testing so that ClearConsent meets quality standards and is ready for HIPAA compliance review.

**Acceptance Criteria:**
- Unit tests (Vitest) achieve 80%+ coverage on critical paths (consent creation, signing, withdrawal, audit logging)
- Integration tests verify RLS policies prevent cross‑tenant data access
- E2E tests (Playwright) cover: provider signup → create consent → invite patient → patient signs → verify
- Security tests: XSS, SQL injection, CSRF, session timeout automated checks
- Snyk/Dependabot integrated for dependency vulnerability monitoring
- OWASP ZAP scan runs against staging environment
- All tests pass
- Typecheck passes

**Phase:** 4  
**Complexity:** L

---

## Notes

- **Complexity guide:** S = 1–2 days, M = 3–5 days, L = 1–2 weeks
- Every story includes “Tests for [feature] pass” and “Typecheck passes” as mandatory acceptance criteria
- Stories are ordered by dependency; earlier stories must not depend on later ones
- Each story is designed to be completable in one developer session (one context window)
