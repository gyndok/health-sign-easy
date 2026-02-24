import { supabase } from "@/integrations/supabase/client";

export interface SeedResult {
  status: "seeded" | "already_seeded";
  modules?: number;
  invites?: number;
  submissions?: number;
  withdrawals?: number;
}

export interface ClearResult {
  status: "cleared";
  modules_deleted?: number;
}

export async function seedDemoData(): Promise<SeedResult> {
  const { data, error } = await supabase.rpc("seed_demo_data");
  if (error) throw error;
  return data as unknown as SeedResult;
}

export async function clearDemoData(): Promise<ClearResult> {
  const { data, error } = await supabase.rpc("clear_demo_data");
  if (error) throw error;
  return data as unknown as ClearResult;
}

export async function hasDemoData(): Promise<boolean> {
  const { count, error } = await supabase
    .from("consent_modules")
    .select("*", { count: "exact", head: true })
    .contains("tags", ["demo-data"]);

  if (error) return false;
  return (count ?? 0) > 0;
}
