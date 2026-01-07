import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { ArrowLeft, Send, Mail, User, FileText, MessageSquare, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export default function NewInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const [modules, setModules] = useState<Tables<"consent_modules">[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [firstName, setFirstName] = useState(searchParams.get("firstName") || "");
  const [lastName, setLastName] = useState(searchParams.get("lastName") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [phone, setPhone] = useState("");
  const [selectedModule, setSelectedModule] = useState(searchParams.get("module") || "");
  const [customMessage, setCustomMessage] = useState("");
  const [sendSms, setSendSms] = useState(false);
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

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !selectedModule) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (sendSms && !phone.trim()) {
      toast.error("Please enter a phone number for SMS");
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
        patient_first_name: firstName.trim(),
        patient_last_name: lastName.trim(),
        patient_email: email.trim().toLowerCase(),
        patient_phone: phone.trim() || null,
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

    // Copy the link to clipboard
    const consentLink = `${window.location.origin}/consent/${data.token}`;
    await navigator.clipboard.writeText(consentLink);

    toast.success("Invitation created!", {
      description: `The consent link has been copied to your clipboard. Send it to ${firstName} ${lastName}.`,
    });
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
              Invite a patient to review and sign a consent form
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
            {/* Patient Information */}
            <div className="card-elevated p-6 space-y-5">
              <h2 className="font-semibold font-display flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Sarah"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-focus-ring"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Johnson"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-focus-ring"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="patient@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 input-focus-ring"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="sendSms"
                      checked={sendSms}
                      onCheckedChange={setSendSms}
                    />
                    <Label htmlFor="sendSms" className="text-sm font-normal">
                      Also send SMS
                    </Label>
                  </div>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 input-focus-ring"
                  />
                </div>
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
                  placeholder="Add a personal message to include in the invitation..."
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create & Copy Link
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
