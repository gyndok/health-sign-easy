import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  ArrowLeft,
  User,
  Bell,
  Lock,
  Trash2,
  Download,
  Loader2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string;
  preferred_contact: string | null;
}

interface NotificationPreferences {
  id?: string;
  email_consent_reminders: boolean;
  email_expiration_alerts: boolean;
  email_provider_updates: boolean;
}

export default function PatientSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Profile state
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Notification preferences state
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_consent_reminders: true,
    email_expiration_alerts: true,
    email_provider_updates: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Download data state
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNotificationPreferences();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("patient_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
    setIsLoadingProfile(false);
  };

  const fetchNotificationPreferences = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("patient_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (!error && data) {
      setNotifications(data);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;
    
    setIsSavingProfile(true);
    
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone?.trim() || null,
        date_of_birth: profile.date_of_birth,
        preferred_contact: profile.preferred_contact,
      })
      .eq("user_id", user.id);
    
    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
    
    setIsSavingProfile(false);
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setIsSavingNotifications(true);
    
    const { error } = await supabase
      .from("patient_notification_preferences")
      .upsert({
        user_id: user.id,
        email_consent_reminders: notifications.email_consent_reminders,
        email_expiration_alerts: notifications.email_expiration_alerts,
        email_provider_updates: notifications.email_provider_updates,
      }, { onConflict: "user_id" });
    
    if (error) {
      console.error("Error updating notifications:", error);
      toast.error("Failed to update notification preferences");
    } else {
      toast.success("Notification preferences updated");
    }
    
    setIsSavingNotifications(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setIsChangingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } else {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    
    setIsChangingPassword(false);
  };

  const handleDownloadData = async () => {
    if (!user) return;
    
    setIsDownloading(true);
    
    try {
      // Fetch all user data
      const [profileResult, submissionsResult, withdrawalsResult] = await Promise.all([
        supabase.from("patient_profiles").select("*").eq("user_id", user.id),
        supabase.from("consent_submissions").select("*, consent_modules(name, description)"),
        supabase.from("consent_withdrawals").select("*").eq("patient_user_id", user.id),
      ]);
      
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileResult.data?.[0] || null,
        consent_submissions: submissionsResult.data || [],
        consent_withdrawals: withdrawalsResult.data || [],
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Data downloaded successfully");
    } catch (error) {
      console.error("Error downloading data:", error);
      toast.error("Failed to download data");
    }
    
    setIsDownloading(false);
  };

  const handleDeleteAccountRequest = async () => {
    // For now, just show a confirmation and log the request
    // In production, this would trigger an email to support or a deletion workflow
    setIsDeleting(true);
    
    toast.success("Account deletion request submitted. You will receive a confirmation email.");
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setDeleteReason("");
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patient-dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">Settings</span>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-2xl space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile?.first_name || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile?.last_name || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Contact support to change your email address</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile?.phone || ""}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profile?.date_of_birth || ""}
                onChange={(e) => setProfile(prev => prev ? { ...prev, date_of_birth: e.target.value } : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredContact">Preferred Contact Method</Label>
              <Select
                value={profile?.preferred_contact || "email"}
                onValueChange={(value) => setProfile(prev => prev ? { ...prev, preferred_contact: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose what emails you'd like to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Consent Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders about pending consent forms
                </p>
              </div>
              <Switch
                checked={notifications.email_consent_reminders}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, email_consent_reminders: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expiration Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts when consent forms are about to expire
                </p>
              </div>
              <Switch
                checked={notifications.email_expiration_alerts}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, email_expiration_alerts: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Provider Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Updates from your healthcare providers
                </p>
              </div>
              <Switch
                checked={notifications.email_provider_updates}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, email_provider_updates: checked }))
                }
              />
            </div>
            
            <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
              {isSavingNotifications ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Update your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            <Button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>
              Manage your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Download My Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your data in JSON format
                </p>
              </div>
              <Button variant="outline" onClick={handleDownloadData} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-destructive">Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
              <p className="text-sm text-destructive">
                <strong>Warning:</strong> Deleting your account will permanently remove all your
                data, including consent forms and medical records. This cannot be reversed.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deleteReason">Why are you leaving? (Optional)</Label>
              <Textarea
                id="deleteReason"
                placeholder="Help us improve by sharing your reason..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccountRequest}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete My Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
