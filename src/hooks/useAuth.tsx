import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ProviderProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  practice_name: string | null;
  primary_specialty: string | null;
  phone: string | null;
  timezone: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProviderProfile | null;
  role: "provider" | "patient" | null;
  isLoading: boolean;
  mfaRequired: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: "provider" | "patient") => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshMFAStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [role, setRole] = useState<"provider" | "patient" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  const checkMFAStatus = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error("Error checking MFA:", error);
      return;
    }
    // If user has enrolled MFA factors but current level is aal1, they need to verify
    if (data.currentLevel === "aal1" && data.nextLevel === "aal2") {
      setMfaRequired(true);
    } else {
      setMfaRequired(false);
    }
  }, []);

  const refreshMFAStatus = useCallback(async () => {
    await checkMFAStatus();
  }, [checkMFAStatus]);

  const fetchProfile = async (userId: string) => {
    // Fetch role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleData) {
      setRole(roleData.role as "provider" | "patient");

      // If provider, fetch profile
      if (roleData.role === "provider") {
        const { data: profileData } = await supabase
          .from("provider_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (profileData) {
          setProfile(profileData as ProviderProfile);
        }
      }
    }
  };

  useEffect(() => {
    const logAuditEvent = async (action: string, userId: string, details?: Record<string, string | undefined>) => {
      try {
        await supabase.from("audit_logs").insert([{
          user_id: userId,
          action,
          table_name: "auth",
          details: (details || {}) as any,
        }]);
      } catch (err) {
        console.error("Failed to log audit event:", err);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Log auth events
        if (event === "SIGNED_IN" && session?.user) {
          setTimeout(() => {
            logAuditEvent("user_login", session.user.id, { email: session.user.email });
          }, 0);
        } else if (event === "SIGNED_OUT") {
          // Use previous user ref since session is now null
        } else if (event === "USER_UPDATED" && session?.user) {
          setTimeout(() => {
            logAuditEvent("user_updated", session.user.id, { email: session.user.email });
          }, 0);
        }

        // Defer profile fetching with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkMFAStatus();
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setMfaRequired(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        Promise.all([fetchProfile(session.user.id), checkMFAStatus()]).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: "provider" | "patient") => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Log logout before clearing session
    if (user) {
      try {
        await supabase.from("audit_logs").insert([{
          user_id: user.id,
          action: "user_logout",
          table_name: "auth",
          details: { email: user.email } as any,
        }]);
      } catch (err) {
        console.error("Failed to log logout:", err);
      }
    }
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setMfaRequired(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      role, 
      isLoading, 
      mfaRequired,
      signIn, 
      signUp, 
      signOut,
      refreshProfile,
      refreshMFAStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
