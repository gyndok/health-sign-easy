import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold font-display mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 11, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold font-display">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using ClearConsent ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service. These terms apply to all users, including healthcare
              providers and patients.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              ClearConsent is a digital consent management platform that enables healthcare providers to create
              educational consent modules, send invitations to patients, and collect digitally signed consent
              forms. The Service includes consent form creation, email invitations, video embedding, digital
              signature collection, and PDF generation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">3. User Accounts</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>Passwords must meet our minimum security requirements (12+ characters with complexity).</li>
              <li>You must immediately notify us of any unauthorized access to your account.</li>
              <li>You may not share your account credentials with others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">4. HIPAA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              Healthcare providers using ClearConsent acknowledge that the Service handles Protected Health
              Information (PHI). By using the Service, healthcare provider organizations agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Execute a Business Associate Agreement (BAA) with ClearConsent prior to processing PHI.</li>
              <li>Use the Service in compliance with HIPAA Privacy and Security Rules.</li>
              <li>Ensure appropriate authorization and consent from patients before processing their data.</li>
              <li>Report any suspected security incidents or breaches promptly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">5. Digital Signatures</h2>
            <p className="text-muted-foreground leading-relaxed">
              ClearConsent provides digital signature functionality for consent forms. By using the digital
              signature feature, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Typing your name in the signature field constitutes your electronic signature.</li>
              <li>Your electronic signature has the same legal effect as a handwritten signature under the
                  E-SIGN Act and applicable state laws.</li>
              <li>All signatures are timestamped and securely recorded.</li>
              <li>You are the authorized person providing the signature.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">6. Provider Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">Healthcare providers using the Service agree to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Ensure consent module content is accurate, complete, and up-to-date.</li>
              <li>Use the Service only for legitimate informed consent purposes.</li>
              <li>Comply with all applicable medical, legal, and regulatory requirements.</li>
              <li>Not use the Service to collect information beyond what is necessary for informed consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              ClearConsent provides the Service "as is" without warranties of any kind. To the maximum extent
              permitted by law, ClearConsent shall not be liable for any indirect, incidental, special, or
              consequential damages arising out of or in connection with the Service. ClearConsent does not
              provide medical or legal advice. Healthcare providers remain responsible for the content and
              adequacy of their consent forms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">8. Data Ownership</h2>
            <p className="text-muted-foreground leading-relaxed">
              Healthcare providers retain ownership of all consent module content they create. Patients retain
              rights to their personal information as outlined in our Privacy Policy. ClearConsent retains the
              right to use anonymized, aggregated data for service improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              Either party may terminate their use of the Service at any time. Upon termination, we will
              retain consent records as required by HIPAA (minimum 6 years). You may request export of your
              data prior to account deletion. We reserve the right to suspend or terminate accounts that
              violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify users of material changes via email
              or through the Service. Continued use of the Service after changes constitutes acceptance of the
              updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us:
            </p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:gyndok@yahoo.com" className="text-primary hover:underline">gyndok@yahoo.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            &copy; 2026 ClearConsent. All rights reserved. |{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
