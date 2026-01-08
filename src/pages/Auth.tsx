import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "login" | "signup";
type UserRole = "provider" | "patient";

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, role: userRole, signIn, signUp } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("provider");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      navigate(userRole === "patient" ? "/patient-dashboard" : "/dashboard");
    }
  }, [user, userRole, navigate]);

  const validateEmail = (email: string) => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email";
    return undefined;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  const validateFullName = (name: string) => {
    if (mode === "signup" && !name.trim()) return "Full name is required";
    if (mode === "signup" && name.trim().length < 2) return "Name must be at least 2 characters";
    return undefined;
  };

  const validateForm = () => {
    const newErrors: FormErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      fullName: validateFullName(fullName),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password && !newErrors.fullName;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === "email") setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    if (field === "password") setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    if (field === "fullName") setErrors(prev => ({ ...prev, fullName: validateFullName(fullName) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setTouched({ email: true, password: true, fullName: true });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }
        toast.success("Welcome back!");
        // Don't navigate here - let the useEffect handle redirect based on role
      } else {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }
        toast.success("Account created successfully!");
        // For signup, we know the role they selected
        navigate(selectedRole === "patient" ? "/patient-dashboard" : "/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <span className="font-display text-3xl font-bold text-white">ClearConsent</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Secure Digital<br />
            Patient Consent<br />
            Management
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Streamline your consent workflow with secure digital signatures, 
            educational modules, and automated tracking.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10k+</p>
              <p className="text-sm text-white/70">Consents Signed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-white/70">Providers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-sm text-white/70">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold">ClearConsent</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold font-display">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "login" 
                ? "Sign in to access your dashboard" 
                : "Get started with ClearConsent"}
            </p>
          </div>

          {/* Role Selector (for signup) */}
          {mode === "signup" && (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("provider")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedRole === "provider"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <User className={`h-6 w-6 mx-auto mb-2 ${selectedRole === "provider" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-medium ${selectedRole === "provider" ? "text-primary" : ""}`}>Healthcare Provider</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("patient")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedRole === "patient"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <User className={`h-6 w-6 mx-auto mb-2 ${selectedRole === "patient" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-medium ${selectedRole === "patient" ? "text-primary" : ""}`}>Patient</p>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Dr. Jane Roberts"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                    className={`pl-10 input-focus-ring ${touched.fullName && errors.fullName ? "border-destructive" : ""}`}
                  />
                </div>
                {touched.fullName && errors.fullName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@practice.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={`pl-10 input-focus-ring ${touched.email && errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={`pl-10 input-focus-ring ${touched.password && errors.password ? "border-destructive" : ""}`}
                />
              </div>
              {touched.password && errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to ClearConsent's{" "}
              <a href="#" className="underline hover:text-foreground">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
