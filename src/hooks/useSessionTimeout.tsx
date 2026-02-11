import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_MS = 2 * 60 * 1000; // 2-minute warning before timeout

export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTimeout = useCallback(async () => {
    toast.error("Session expired due to inactivity. Please sign in again.");
    await signOut();
  }, [signOut]);

  const resetTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (!user) return;

    warningRef.current = setTimeout(() => {
      toast.warning("Your session will expire in 2 minutes due to inactivity.", {
        duration: 10000,
      });
    }, TIMEOUT_MS - WARNING_MS);

    timeoutRef.current = setTimeout(handleTimeout, TIMEOUT_MS);
  }, [user, handleTimeout]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    const onActivity = () => resetTimers();

    events.forEach((event) => window.addEventListener(event, onActivity));
    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimers]);
}
