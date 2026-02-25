import { useEffect, useRef, useState, useCallback } from "react";

const IDLE_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const WARNING_DURATION_MS = 2 * 60 * 1000; // 2-minute warning countdown

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "pointerdown",
];

interface UseIdleTimeoutOptions {
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({ onTimeout, enabled = true }: UseIdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsLeftRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearTimers();
    setShowWarning(false);

    idleTimerRef.current = setTimeout(() => {
      // Idle timeout reached — start warning countdown
      const totalSeconds = Math.floor(WARNING_DURATION_MS / 1000);
      secondsLeftRef.current = totalSeconds;
      setSecondsLeft(totalSeconds);
      setShowWarning(true);

      countdownRef.current = setInterval(() => {
        secondsLeftRef.current -= 1;
        setSecondsLeft(secondsLeftRef.current);

        if (secondsLeftRef.current <= 0) {
          clearTimers();
          setShowWarning(false);
          onTimeout();
        }
      }, 1000);
    }, IDLE_TIMEOUT_MS);
  }, [clearTimers, onTimeout]);

  const stayLoggedIn = useCallback(() => {
    startIdleTimer();
  }, [startIdleTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    const handleActivity = () => {
      // Only reset if warning is not yet showing
      if (!countdownRef.current) {
        startIdleTimer();
      }
    };

    // Start timer and attach listeners
    startIdleTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [enabled, startIdleTimer, clearTimers]);

  return { showWarning, secondsLeft, stayLoggedIn };
}
