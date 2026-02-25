import { Link } from "react-router-dom";
import { Shield, Lock, Eye, ClipboardList, Server, FileCheck, ArrowLeft } from "lucide-react";

const sections = [
  {
    icon: Lock,
    title: "Data Encryption",
    items: [
      "All data encrypted in transit with TLS 1.2+",
      "Database-level encryption at rest (AES-256)",
      "Signed PDF documents stored in encrypted object storage",
      "Short-lived signed URLs (1-hour expiry) for document access",
    ],
  },
  {
    icon: Eye,
    title: "Access Controls",
    items: [
      "Role-based access control (RBAC) for providers, patients, and admins",
      "Row-Level Security (RLS) policies on all database tables",
      "Automatic session timeout after 20 minutes of inactivity",
      "Strong password requirements (8+ characters, uppercase, lowercase, number)",
      "Token-based patient consent access with expiring invite links",
    ],
  },
  {
    icon: ClipboardList,
    title: "Audit Logging",
    items: [
      "Immutable audit trail for all consent-related actions",
      "Login/logout events tracked per user",
      "Consent signing, withdrawal, and PDF access logged",
      "Invite creation and deletion events recorded",
      "Audit logs accessible to providers via dashboard",
    ],
  },
  {
    icon: Server,
    title: "Infrastructure & Subprocessors",
    items: [
      "Supabase (database, authentication, storage) \u2014 SOC 2 Type II certified",
      "Vercel (frontend hosting) \u2014 SOC 2 Type II certified",
      "All infrastructure hosted in the United States",
      "No third-party analytics or tracking on patient-facing pages",
    ],
  },
  {
    icon: FileCheck,
    title: "Business Associate Agreements",
    items: [
      "BAA available with Supabase on supported plans",
      "ClearConsent is designed for HIPAA-covered entity use",
      "We are committed to executing BAAs with all subprocessors handling PHI",
      "Contact us at compliance@clearconsent.io for BAA inquiries",
    ],
  },
];

export default function Compliance() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">ClearConsent</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-12 px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            HIPAA Compliance
          </div>
          <h1 className="text-4xl font-bold font-display mb-4">
            Security & Compliance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            ClearConsent is designed from the ground up to meet the security and
            privacy requirements of healthcare organizations. We implement
            administrative, physical, and technical safeguards aligned with HIPAA
            regulations.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-border bg-card p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold font-display">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-2.5 ml-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h3 className="text-xl font-semibold font-display mb-2">
            Questions about our security posture?
          </h3>
          <p className="text-muted-foreground mb-4">
            We're happy to discuss our compliance program and provide
            additional documentation.
          </p>
          <a
            href="mailto:compliance@clearconsent.io"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Compliance Team
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ClearConsent. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
