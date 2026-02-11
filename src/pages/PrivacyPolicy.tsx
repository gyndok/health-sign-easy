import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">ClearConsent</span>
          </Link>
        </div>
      </header>

      <main className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-display mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 11, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold font-display">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              ClearConsent ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our digital
              consent management platform. We are committed to complying with the Health Insurance Portability
              and Accountability Act (HIPAA) and all applicable privacy regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Account Information:</strong> Name, email address, password (hashed), and role (provider or patient).</li>
              <li><strong>Patient Information:</strong> First name, last name, date of birth, phone number, and preferred contact method.</li>
              <li><strong>Protected Health Information (PHI):</strong> Consent form content, digital signatures, and records of consent decisions.</li>
              <li><strong>Usage Data:</strong> Log data, device information, and interaction timestamps for security and audit purposes.</li>
              <li><strong>Provider Information:</strong> Practice name, specialty, contact details, and consent module configurations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>To provide and maintain the consent management service.</li>
              <li>To process and record digital consent signatures.</li>
              <li>To send consent invitations and status notifications.</li>
              <li>To generate and store consent PDF documents.</li>
              <li>To maintain audit logs as required by HIPAA.</li>
              <li>To improve the security and functionality of our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">4. HIPAA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              ClearConsent handles Protected Health Information (PHI) in accordance with HIPAA requirements.
              We implement administrative, physical, and technical safeguards to protect PHI, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256).</li>
              <li>Role-based access controls and row-level security.</li>
              <li>Automatic session timeouts after 15 minutes of inactivity.</li>
              <li>Comprehensive audit logging of all data access and modifications.</li>
              <li>Business Associate Agreements (BAAs) with all third-party service providers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain consent records for a minimum of 6 years from the date of creation or last effective date,
              as required by HIPAA. Audit logs are retained for a minimum of 6 years. You may request deletion
              of your account, but consent records may be retained as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">6. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Between healthcare providers and their patients as part of the consent workflow.</li>
              <li>With service providers who have signed Business Associate Agreements.</li>
              <li>When required by law, regulation, or legal process.</li>
              <li>To protect the rights, safety, or property of ClearConsent or others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">Under HIPAA and applicable law, you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access your personal data and PHI.</li>
              <li>Request corrections to inaccurate information.</li>
              <li>Request an accounting of disclosures of your PHI.</li>
              <li>Request restrictions on certain uses of your PHI.</li>
              <li>Receive a copy of your data in a portable format.</li>
              <li>Request deletion of your account (subject to legal retention requirements).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">8. Breach Notification</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the event of a breach of unsecured PHI, we will notify affected individuals within 60 days
              of discovering the breach, as required by the HIPAA Breach Notification Rule. We will also
              notify the U.S. Department of Health and Human Services and, when required, the media.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">9. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use Supabase for authentication, database, and file storage services. Supabase maintains
              SOC 2 Type II compliance and offers HIPAA-eligible infrastructure. A Business Associate
              Agreement is in place with all third-party service providers who may access PHI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights,
              please contact our Privacy Officer:
            </p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:gyndok@yahoo.com" className="text-primary hover:underline">gyndok@yahoo.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            &copy; 2026 ClearConsent. All rights reserved. |{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
