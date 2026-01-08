import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  email: string;
  first_name: string;
  last_name: string;
  latest_signed_at: string;
  consent_count: number;
  has_withdrawal: boolean;
}

const Patients = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      const { data: submissions, error } = await supabase
        .from("consent_submissions")
        .select(`
          patient_email,
          patient_first_name,
          patient_last_name,
          signed_at,
          consent_withdrawals (id)
        `)
        .eq("provider_id", user?.id)
        .order("signed_at", { ascending: false });

      if (error) throw error;

      // Group by patient email
      const patientMap = new Map<string, Patient>();
      
      submissions?.forEach((submission) => {
        const existing = patientMap.get(submission.patient_email);
        const withdrawals = submission.consent_withdrawals;
        const hasWithdrawal = Array.isArray(withdrawals) ? withdrawals.length > 0 : !!withdrawals;
        
        if (existing) {
          existing.consent_count += 1;
          if (hasWithdrawal) existing.has_withdrawal = true;
        } else {
          patientMap.set(submission.patient_email, {
            email: submission.patient_email,
            first_name: submission.patient_first_name,
            last_name: submission.patient_last_name,
            latest_signed_at: submission.signed_at,
            consent_count: 1,
            has_withdrawal: hasWithdrawal,
          });
        }
      });

      setPatients(Array.from(patientMap.values()));
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.email.toLowerCase().includes(query) ||
      patient.first_name.toLowerCase().includes(query) ||
      patient.last_name.toLowerCase().includes(query)
    );
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ProviderLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">All Patients</h1>
            <p className="text-muted-foreground">
              {patients.length} patient{patients.length !== 1 ? "s" : ""} with signed consents
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No patients match your search" : "No patients yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => (
              <Card key={patient.email} className="card-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {patient.first_name} {patient.last_name}
                    </CardTitle>
                    {patient.has_withdrawal && (
                      <Badge variant="destructive" className="text-xs">
                        Withdrawn
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last consent: {format(new Date(patient.latest_signed_at), "MMM d, yyyy")}</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="secondary">
                      {patient.consent_count} consent{patient.consent_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProviderLayout>
  );
};

export default Patients;
