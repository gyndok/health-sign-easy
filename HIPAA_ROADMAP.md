# HIPAA Compliance Roadmap

This document tracks HIPAA-related items that are **important but not yet implemented**. These are planned for future phases, some of which require a paid Supabase plan or additional infrastructure.

---

## Implemented (Current)

- [x] Data encryption at rest (Supabase AES-256) and in transit (TLS 1.2+)
- [x] Row-Level Security (RLS) on all tables
- [x] Role-based access control (provider, patient, org_admin, super_admin)
- [x] Automatic session timeout after 20 minutes of inactivity
- [x] Strong password validation (8+ chars, uppercase, lowercase, number)
- [x] Immutable audit logging with SECURITY DEFINER RPCs
- [x] Short-lived signed URLs for PDF documents (1-hour expiry)
- [x] Audit trail viewer for providers
- [x] Compliance page documenting security posture

---

## Planned — Requires Paid Supabase Plan

### Multi-Factor Authentication (MFA)
- Supabase supports TOTP-based MFA on Pro plan and above
- Should be enforced for all provider accounts
- Patient accounts: optional but recommended
- Priority: **High**

### Business Associate Agreement (BAA)
- Supabase offers BAA execution on their Team/Enterprise plans
- Required before handling real PHI in production
- Priority: **Critical** (before production launch)

---

## Planned — Software Changes Required

### Data Retention Policies
- Define and enforce retention periods for consent records
- Auto-archive or flag records past retention period
- Document retention schedules per consent type
- Priority: **Medium**

### Breach Notification Workflow
- Automated breach detection (unusual access patterns)
- Notification workflow: affected patients + HHS within 60 days
- Breach log and documentation
- Priority: **Medium**

### Minimum Necessary Access
- Implement more granular permissions beyond role-based access
- Ensure providers only see patients assigned to them
- Org-level data isolation (multi-tenancy with RLS per org_id)
- Priority: **Medium**

### Password Expiry / Rotation
- Enforce password change every 90 days for providers
- Track last password change date in user_profiles
- Show warning banner when password is nearing expiry
- Priority: **Low** (current NIST guidance de-emphasizes mandatory rotation)

### Org-Level RLS Isolation
- Current RLS policies scope to individual user_id
- Need to add org_id-scoped policies for multi-provider organizations
- Ensure one org cannot access another org's data
- Priority: **High**

### Backup and Disaster Recovery Plan
- Document RPO (Recovery Point Objective) and RTO (Recovery Time Objective)
- Supabase provides daily backups on Pro plan
- Test restore procedures quarterly
- Priority: **Medium**

### Security Training Documentation
- Create security awareness materials for provider onboarding
- Document acceptable use policies
- Track training completion per user
- Priority: **Low**

### PHI De-identification
- Support for de-identified data exports for research
- Implement Safe Harbor or Expert Determination methods
- Priority: **Low**

---

## Notes

- HIPAA compliance is an ongoing process, not a one-time checklist
- Regular risk assessments should be conducted (at minimum annually)
- All subprocessors handling PHI must have BAAs in place
- Policies should be reviewed and updated as the product evolves
