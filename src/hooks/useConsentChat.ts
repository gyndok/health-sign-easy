import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  invite_id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface UseConsentChatOptions {
  /** Token mode: patient fetches/sends by token */
  token?: string;
  /** Provider mode: provider fetches/sends by invite ID */
  inviteId?: string;
  /** Required for token mode (patient name for sending) */
  senderName?: string;
  /** Whether to enable the hook */
  enabled?: boolean;
}

export function useConsentChat({
  token,
  inviteId,
  senderName,
  enabled = true,
}: UseConsentChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchedRef = useRef(false);

  const isTokenMode = !!token;
  const isProviderMode = !!inviteId && !token;

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!enabled) return;

    if (isTokenMode && token) {
      const { data, error } = await supabase.rpc("get_consent_messages_by_token", {
        p_token: token,
      });
      if (error) {
        console.error("Error fetching chat messages:", error);
        return;
      }
      setMessages((data as ChatMessage[]) || []);
    } else if (isProviderMode && inviteId) {
      const { data, error } = await supabase
        .from("consent_messages")
        .select("id, invite_id, sender_role, sender_name, message, created_at")
        .eq("invite_id", inviteId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching chat messages:", error);
        return;
      }
      setMessages((data as ChatMessage[]) || []);
    }
  }, [token, inviteId, isTokenMode, isProviderMode, enabled]);

  // Initial fetch
  useEffect(() => {
    if (!enabled || fetchedRef.current) return;
    fetchedRef.current = true;
    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));
  }, [enabled, fetchMessages]);

  // Reset when token/inviteId changes
  useEffect(() => {
    fetchedRef.current = false;
    setMessages([]);
  }, [token, inviteId]);

  // Realtime subscription + polling fallback
  useEffect(() => {
    if (!enabled) return;

    const targetInviteId = inviteId;
    if (!targetInviteId && !token) return;

    // Set up realtime subscription if we have an invite ID
    if (targetInviteId) {
      const channel = supabase
        .channel(`consent-chat-${targetInviteId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "consent_messages",
            filter: `invite_id=eq.${targetInviteId}`,
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            setMessages((prev) => {
              // Deduplicate
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Realtime connected, clear polling if running
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            // Fallback to polling
            if (!pollingRef.current) {
              pollingRef.current = setInterval(fetchMessages, 10000);
            }
          }
        });

      channelRef.current = channel;
    } else {
      // Token mode without invite ID — use polling
      pollingRef.current = setInterval(fetchMessages, 10000);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [enabled, inviteId, token, fetchMessages]);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsSending(true);
      try {
        if (isTokenMode && token) {
          const { error } = await supabase.rpc("send_consent_message_by_token", {
            p_token: token,
            p_message: text.trim(),
            p_sender_name: senderName || "Patient",
          });
          if (error) {
            console.error("Error sending message:", error);
            throw error;
          }
        } else if (isProviderMode && inviteId) {
          const { error } = await supabase.rpc("send_consent_message_as_provider", {
            p_invite_id: inviteId,
            p_message: text.trim(),
          });
          if (error) {
            console.error("Error sending message:", error);
            throw error;
          }
        }

        // If no realtime, manually refetch
        if (!channelRef.current) {
          await fetchMessages();
        }
      } finally {
        setIsSending(false);
      }
    },
    [token, inviteId, senderName, isTokenMode, isProviderMode, fetchMessages]
  );

  return { messages, sendMessage, isLoading, isSending, refetch: fetchMessages };
}
