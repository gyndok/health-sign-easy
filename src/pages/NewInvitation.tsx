import { useState } from "react";
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
import { ArrowLeft, Send, Mail, User, FileText, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const mockModules = [
  { id: "1", name: "Surgical Consent - Knee Replacement" },
  { id: "2", name: "Anesthesia Consent - General" },
  { id: "3", name: "MRI Procedure Consent" },
  { id: "4", name: "Physical Therapy Treatment Plan" },
  { id: "5", name: "Blood Work Authorization" },
];

export default function NewInvitation() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !selectedModule) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (sendSms && !phone.trim()) {
      toast.error("Please enter a phone number for SMS");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success("Invitation sent successfully!", {
      description: `${firstName} ${lastName} will receive the consent request.`,
    });
    navigate("/invitations");
    setIsLoading(false);
  };

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
                  {mockModules.map((module) => (
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
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProviderLayout>
  );
}
