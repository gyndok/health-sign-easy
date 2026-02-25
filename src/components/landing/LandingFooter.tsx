import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold">ClearConsent</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/compliance" className="hover:text-foreground transition-colors">
              Compliance
            </Link>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ClearConsent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
