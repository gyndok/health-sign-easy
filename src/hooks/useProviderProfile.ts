import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";

type ProviderProfile = Database["public"]["Tables"]["provider_profiles"]["Row"];

export function useProviderProfile() {
  const { user, role } = useAuth();
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user || role !== "provider") {
      setProviderProfile(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("provider_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching provider profile:", error);
      setProviderProfile(null);
    } else {
      setProviderProfile(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user, role]);

  return { providerProfile, isLoading, refreshProviderProfile: fetchProfile };
}
