# ClearConsent

**Website:** [clearconsent.net](https://clearconsent.net)

A secure digital platform for managing patient consent in healthcare settings. ClearConsent streamlines the informed consent process by enabling providers to create, send, and track consent forms digitally.

## Features

### For Healthcare Providers
- **AI-Powered Consent Generation** – Generate comprehensive consent text for procedures using AI, then review and customize as needed
- **Module Management** – Create reusable consent modules for different procedures with video support
- **Patient Invitations** – Send secure consent invitations via email with customizable messages
- **Dashboard Analytics** – Track consent submissions, pending invitations, and recent activity
- **Patient Management** – View and manage all patients and their consent history

### For Patients
- **Digital Signing** – Review and sign consent forms from any device
- **Consent History** – Access all signed consents in one place
- **Withdrawal Support** – Withdraw consent when needed with documented reasoning
- **Notification Preferences** – Control email notifications for reminders and updates

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (Supabase)
- **Authentication:** Email-based authentication with role separation (provider/patient)
- **AI Integration:** Lovable AI for consent text generation

## Getting Started

### Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment

This project uses Lovable Cloud for backend services. Environment variables are automatically configured when connected to Lovable.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── dashboard/    # Provider dashboard components
│   ├── layout/       # Navigation and layout components
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── pages/            # Route pages
└── integrations/     # Backend integrations

supabase/
└── functions/        # Backend edge functions
    ├── generate-consent-text/   # AI consent generation
    ├── generate-consent-pdf/    # PDF generation
    └── send-invite-email/       # Email invitations
```

## License

Proprietary – All rights reserved.
