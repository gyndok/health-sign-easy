import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { IdleTimeoutDialog } from "@/components/auth/IdleTimeoutDialog";
import { logAuditEvent } from "@/lib/auditLog";

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  organization: Organization | null;
  role: "provider" | "patient" | "org_admin" | "super_admin" | null;
  isLoading: boolean;
  profileLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: "provider" | "patient") => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<"provider" | "patient" | "org_admin" | "super_admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const fetchProfile = async (_userId: string) => {
    setProfileLoaded(false);
    // Use SECURITY DEFINER RPC to bypass the recursive RLS policy (42P17)
    // on user_profiles. Direct .from("user_profiles") queries fail for all users.
    const { data, error } = await supabase.rpc("get_my_profile");

    if (error) {
      console.error("Failed to fetch profile via RPC:", error);
      setProfile(null);
      setRole(null);
      setOrganization(null);
      setProfileLoaded(true);
      return;
    }

    const result = data as { profile: UserProfile | null; organization: Organization | null } | null;
    const profileData = result?.profile ?? null;
    const orgData = result?.organization ?? null;

    if (profileData) {
      setProfile(profileData);
      setRole(profileData.role as "provider" | "patient" | "org_admin" | "super_admin");
      setOrganization(orgData);
    } else {
      setProfile(null);
      setRole(null);
      setOrganization(null);
    }
    setProfileLoaded(true);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetching with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setOrganization(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      logAuditEvent("user.login", "user", data.user.id);
    }
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
    if (user) {
      logAuditEvent("user.logout", "user", user.id);
    }
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setOrganization(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const handleIdleTimeout = useCallback(async () => {
    await signOut();
    window.location.href = "/auth?reason=idle";
  }, []);

  const { showWarning, secondsLeft, stayLoggedIn } = useIdleTimeout({
    onTimeout: handleIdleTimeout,
    enabled: !!user,
  });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      organization,
      role,
      isLoading,
      profileLoaded,
      signIn,
      signUp,
      signOut,
      refreshProfile
    }}>
      {children}
      <IdleTimeoutDialog
        open={showWarning}
        secondsLeft={secondsLeft}
        onStayLoggedIn={stayLoggedIn}
      />
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
