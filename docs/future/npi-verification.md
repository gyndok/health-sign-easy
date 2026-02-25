# NPI Verification via NPPES Registry

> **Status:** Planned — not yet implemented
> **Priority:** Medium
> **Estimated scope:** 4-5 files, ~1 day of work

## Overview

Add live NPI verification and profile auto-fill using the free CMS NPPES registry API. When a provider enters their 10-digit NPI during onboarding or in settings, we validate it against the national registry and auto-populate their profile fields.

## Why

- Verifies provider identity without needing Doximity partnership access
- NPPES is free, requires no API key, no approval, and is updated daily
- ClearConsent already collects NPI — this connects it to a live data source
- Adds a "Verified" badge that builds trust with patients

## NPPES API Details

- **Endpoint:** `https://npiregistry.cms.hhs.gov/api/?version=2.1`
- **Auth:** None required (free public API)
- **Method:** GET only
- **CORS:** Not supported — requires server-side proxy
- **Rate limits:** Not formally documented; max 200 results/request
- **Data freshness:** Updated daily

### Key query parameters

| Param | Description |
|---|---|
| `number` | 10-digit NPI for exact lookup |
| `enumeration_type` | `NPI-1` (individual) or `NPI-2` (organization) |
| `first_name` / `last_name` | Name search (supports trailing `*` wildcard) |
| `taxonomy_description` | Specialty search (e.g., "cardiology") |
| `state` | Two-letter state code (cannot be sole search param) |
| `limit` / `skip` | Pagination (max 200 per request, 1200 total) |

### Data available per provider

| Field | API path |
|---|---|
| Full name | `basic.first_name`, `basic.last_name` |
| Credentials | `basic.credential` (e.g., "M.D.", "DO") |
| Primary specialty | `taxonomies[].desc` where `primary === true` |
| License number | `taxonomies[].license` |
| License state | `taxonomies[].state` |
| Practice address | `addresses[]` where `address_purpose === "LOCATION"` |
| Phone | `addresses[].telephone_number` |
| Active status | `basic.status` (`"A"` = active) |
| Enumeration date | `basic.enumeration_date` |
| Sex | `basic.sex` |

**Not available:** Hospital affiliations (not in NPPES data)

### Example response (trimmed)

```json
{
  "result_count": 1,
  "results": [{
    "number": "1003000126",
    "enumeration_type": "NPI-1",
    "basic": {
      "first_name": "ARDALAN",
      "last_name": "ENKESHAFI",
      "credential": "M.D.",
      "status": "A",
      "enumeration_date": "2007-08-31"
    },
    "addresses": [{
      "address_1": "6410 ROCKLEDGE DR STE 304",
      "address_purpose": "LOCATION",
      "city": "BETHESDA",
      "state": "MD",
      "postal_code": "208171841",
      "telephone_number": "443-602-6207"
    }],
    "taxonomies": [{
      "code": "208M00000X",
      "desc": "Hospitalist",
      "license": "MD600003480",
      "primary": true,
      "state": "DC"
    }]
  }]
}
```

**Note:** Names are ALL CAPS — apply title-case formatting. Postal codes are 9 digits without dash (e.g., `"208171841"` = `20817-1841`). The value `"--"` is used as a sentinel for empty prefix/suffix fields.

## Implementation Plan

### 1. Supabase Edge Function: `verify-npi`

Proxy to NPPES (needed because no CORS). Accepts an NPI number, calls NPPES, validates the response, and returns structured data.

```
POST /functions/v1/verify-npi
Body: { "npi": "1234567890" }

Response: {
  "valid": true,
  "active": true,
  "npiNumber": "1234567890",
  "firstName": "John",
  "lastName": "Smith",
  "credential": "M.D.",
  "primarySpecialty": "Internal Medicine",
  "licenseNumber": "D0000290",
  "licenseState": "MD",
  "practiceAddress": "6410 Rockledge Dr Ste 304",
  "practiceCity": "Bethesda",
  "practiceState": "MD",
  "practiceZip": "20817",
  "phone": "443-602-6207",
  "enumerationDate": "2007-08-31"
}
```

### 2. Migration: add `npi_verified_at` column

```sql
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS npi_verified_at timestamptz;

-- Update save_provider_onboarding and update_provider_profile RPCs
-- to accept and store npi_verified_at
```

### 3. Frontend: auto-fill on NPI entry

- In **ProviderOnboarding** (step 2) and **Settings** page
- When NPI field reaches 10 digits, debounce 500ms then call `verify-npi`
- On success: auto-fill specialty, license number, license state, practice address fields
- Show inline verification status (green check or red X)
- Provider can override any auto-filled field

### 4. Dashboard: verification badge

- If `npi_verified_at` is set, show "NPI Verified" badge with green checkmark
- Badge shows the verification date on hover
- Could link to the public NPI registry page for transparency

### 5. Optional: re-verification on login

- On provider login, if `npi_verified_at` is older than 30 days, re-verify in background
- If NPI is no longer active, clear `npi_verified_at` and notify provider

## Existing codebase touchpoints

These fields and RPCs already exist and would be updated:

- `provider_profiles.npi_number` — already collected in onboarding + settings
- `provider_profiles.license_number`, `license_state`, `primary_specialty` — auto-filled from NPPES
- `provider_profiles.practice_address`, `practice_city`, `practice_state`, `practice_zip` — auto-filled
- `save_provider_onboarding()` RPC — add `npi_verified_at` param
- `update_provider_profile()` RPC — add `npi_verified_at` param
- `src/pages/ProviderOnboarding.tsx` — add lookup trigger + auto-fill
- `src/pages/Settings.tsx` — add lookup trigger + auto-fill
- `src/pages/Dashboard.tsx` — add verification badge

## Doximity (deferred)

Doximity OAuth integration was researched but deferred because:
- API access requires formal approval (not self-serve)
- Approval is unlikely without significant existing user base
- NPI, license state, and hospital affiliations are not exposed via their OIDC claims
- No messaging API available to third parties

Doximity becomes viable once ClearConsent has meaningful provider adoption. At that point it would add OAuth login and a "Doximity-Verified" badge (stronger than NPI-only verification since Doximity verifies against DEA numbers and institutional credentials too).
