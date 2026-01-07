import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Mail, FileText, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export default function NewInvitation() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();

  const [modules, setModules] = useState<Tables<"consent_modules">[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchModules();
    }
  }, [user]);

  const fetchModules = async () => {
    if (!user) return;

    setIsLoadingModules(true);
    const { data, error } = await supabase
      .from("consent_modules")
      .select("*")
      .eq("created_by", user.id)
      .order("name");

    if (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to load modules");
    } else {
      setModules(data || []);
    }
    setIsLoadingModules(false);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !selectedModule) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsSubmitting(true);

    // Create expires_at 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("invites")
      .insert({
        created_by: user.id,
        module_id: selectedModule,
        patient_email: email.trim().toLowerCase(),
        custom_message: customMessage.trim() || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invitation:", error);
      toast.error("Failed to create invitation");
      setIsSubmitting(false);
      return;
    }

    // Build a link for clipboard fallback; email uses the backend's PUBLIC_APP_URL
    const consentLink = `${window.location.origin}/consent/${data.token}`;

    // Get selected module name
    const selectedModuleData = modules.find((m) => m.id === selectedModule);

    // Send email via edge function
    try {
      const { error: emailError } = await supabase.functions.invoke(
        "send-invite-email",
        {
          body: {
            inviteId: data.id,
            inviteToken: data.token,
            patientEmail: email.trim().toLowerCase(),
            moduleName: selectedModuleData?.name || "Consent Form",
            providerName: profile?.full_name || user.email?.split("@")[0] || "Your Provider",
            practiceName: profile?.practice_name || "",
            customMessage: customMessage.trim() || undefined,
            consentLink,
          },
        }
      );

      if (emailError) {
        console.error("Error sending email:", emailError);
        await navigator.clipboard.writeText(consentLink);
        toast.success("Invitation created!", {
          description: `Email failed to send, but the link has been copied to your clipboard.`,
        });
      } else {
        toast.success("Invitation sent!", {
          description: `The patient will receive an email with the consent link.`,
        });
      }
    } catch (emailErr) {
      console.error("Error invoking email function:", emailErr);
      await navigator.clipboard.writeText(consentLink);
      toast.success("Invitation created!", {
        description: `Email service unavailable. Link copied to clipboard.`,
      });
    }

    navigate("/invitations");
  };

  if (authLoading || isLoadingModules) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/invitations">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Send Consent Invitation</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              The patient will provide their details when they open the link
            </p>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Modules Available</h3>
            <p className="text-muted-foreground mb-4">
              You need to create at least one consent module before sending invitations.
            </p>
            <Button asChild>
              <Link to="/modules/new">Create Module</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Email */}
            <div className="card-elevated p-6 space-y-5">
              <h2 className="font-semibold font-display flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Patient Email
              </h2>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="patient@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-focus-ring"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The patient will enter their name and other details when they open the consent link
                </p>
              </div>
            </div>

            {/* Consent Module Selection */}
            <div className="card-elevated p-6 space-y-5">
              <h2 className="font-semibold font-display flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Consent Module
              </h2>

              <div className="space-y-2">
                <Label htmlFor="module">Select Module *</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="input-focus-ring">
                    <SelectValue placeholder="Choose a consent module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  The patient will receive a unique link to review and sign this consent form.
                  Links expire after <strong>7 days</strong>.
                </p>
              </div>
            </div>

            {/* Custom Message */}
            <div className="card-elevated p-6 space-y-5">
              <h2 className="font-semibold font-display flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Custom Message (Optional)
              </h2>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Note</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to include in the invitation email..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[100px] input-focus-ring resize-y"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link to="/invitations">Cancel</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ProviderLayout>
  );
}
