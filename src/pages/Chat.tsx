import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useConsentChat, ChatMessage } from "@/hooks/useConsentChat";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Search,
  Send,
  ArrowLeft,
  MessageSquare,
  Loader2,
  Shield,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Short Time Formatter ────────────────────────────────────────────
function shortTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

// ─── Types ───────────────────────────────────────────────────────────
interface Conversation {
  inviteId: string;
  patientName: string;
  patientEmail: string;
  patientInitials: string;
  moduleName: string;
  inviteStatus: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// ─── Sidebar Skeleton Loader ─────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-3 w-[85%]" />
          </div>
          <Skeleton className="h-3 w-6 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Navigation Rail ─────────────────────────────────────────────────
function NavigationRail() {
  return (
    <div className="hidden md:flex flex-col items-center w-[68px] bg-muted/30 border-r border-border py-4 gap-1 shrink-0">
      {/* Brand mark */}
      <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
        <Shield className="h-5 w-5" />
      </Link>

      <div className="flex-1 flex flex-col items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Dashboard</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Patient Questions</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Conversation Sidebar ────────────────────────────────────────────
function ConversationSidebar({
  conversations,
  activeInviteId,
  onSelectConversation,
  isLoading,
  searchQuery,
  onSearchChange,
  onBackToDashboard,
}: {
  conversations: Conversation[];
  activeInviteId: string | null;
  onSelectConversation: (id: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onBackToDashboard: () => void;
}) {
  const filtered = conversations.filter(
    (c) =>
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.moduleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="flex flex-col w-full md:w-[340px] lg:w-[380px] border-r border-border bg-background shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onBackToDashboard}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg font-bold">Patient Questions</h2>
        </div>
        {totalUnread > 0 && (
          <Badge variant="default" className="text-[10px] px-2 py-0.5">
            {totalUnread} new
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by patient or module..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <SidebarSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {conversations.length === 0 ? (
              <>
                <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No patient questions yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Questions from patients will appear here
                </p>
              </>
            ) : (
              <>
                <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No conversations match your search</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-1.5">
            {filtered.map((conv) => (
              <button
                key={conv.inviteId}
                onClick={() => onSelectConversation(conv.inviteId)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left group",
                  activeInviteId === conv.inviteId
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/60 border border-transparent"
                )}
              >
                {/* Avatar */}
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold",
                      activeInviteId === conv.inviteId
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {conv.patientInitials}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        conv.unreadCount > 0 && "font-semibold"
                      )}
                    >
                      {conv.patientName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <FileText className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {conv.moduleName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-xs truncate",
                        conv.unreadCount > 0
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {conv.lastMessage || "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────
function MessageBubble({
  message,
  isSent,
  showName,
}: {
  message: ChatMessage;
  isSent: boolean;
  showName: boolean;
}) {
  return (
    <div
      className={cn("flex gap-2 px-4 group", isSent ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn("max-w-[75%] space-y-1", isSent ? "items-end" : "items-start")}
      >
        {/* Sender name */}
        {showName && (
          <p
            className={cn(
              "text-[11px] font-medium px-1",
              isSent ? "text-right text-primary/70" : "text-muted-foreground"
            )}
          >
            {message.sender_name}
          </p>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          {message.message}
        </div>

        {/* Timestamp */}
        <p
          className={cn(
            "text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isSent ? "text-right" : "text-left"
          )}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ─── Chat Input Area ─────────────────────────────────────────────────
function ChatInput({
  onSend,
  isSending,
}: {
  onSend: (text: string) => Promise<void>;
  isSending: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, []);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const msg = text.trim();
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await onSend(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a reply..."
            rows={1}
            disabled={isSending}
            className="w-full resize-none rounded-xl bg-muted/50 border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all disabled:opacity-50"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
        </div>
        <div className="shrink-0 pb-0.5">
          <Button
            size="icon"
            className={cn(
              "h-9 w-9 rounded-xl transition-all duration-150",
              text.trim()
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
            disabled={!text.trim() || isSending}
            onClick={handleSend}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20">
      <div className="text-center max-w-sm px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold mb-2">Patient Questions</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select a conversation to view and reply to patient questions about their consent forms.
        </p>
      </div>
    </div>
  );
}

// ─── Main Chat Window ────────────────────────────────────────────────
function ChatWindow({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, isLoading, isSending } = useConsentChat({
    inviteId: conversation.inviteId,
    enabled: true,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {conversation.patientInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{conversation.patientName}</h3>
            <p className="text-[11px] text-muted-foreground">
              {conversation.moduleName} &middot; {conversation.inviteStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                The patient hasn&apos;t asked any questions
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isSent = msg.sender_role === "provider";
              const showName =
                i === 0 || messages[i - 1].sender_role !== msg.sender_role;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSent={isSent}
                  showName={showName}
                />
              );
            })
          )}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} isSending={isSending} />
    </div>
  );
}

// ─── Main Chat Page ──────────────────────────────────────────────────
export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // Fetch conversations (invites that have messages)
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Get all invites created by this provider
    const { data: invites, error: invErr } = await supabase
      .from("invites")
      .select(`
        id, patient_first_name, patient_last_name, patient_email, status,
        consent_modules ( name )
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (invErr) {
      console.error("Error fetching invites:", invErr);
      setIsLoading(false);
      return;
    }

    // Get message counts per invite
    const { data: counts } = await supabase.rpc("get_invite_unread_message_counts");
    const countMap: Record<string, number> = {};
    for (const row of counts || []) {
      countMap[row.invite_id] = row.patient_message_count;
    }

    // Get last message per invite — fetch all consent_messages for this provider's invites
    const inviteIds = (invites || []).map((i) => i.id);
    const lastMsgMap: Record<string, { message: string; created_at: string }> = {};

    if (inviteIds.length > 0) {
      const { data: msgs } = await supabase
        .from("consent_messages")
        .select("invite_id, message, created_at")
        .in("invite_id", inviteIds)
        .order("created_at", { ascending: false });

      // Keep only the latest message per invite
      for (const msg of msgs || []) {
        if (!lastMsgMap[msg.invite_id]) {
          lastMsgMap[msg.invite_id] = { message: msg.message, created_at: msg.created_at };
        }
      }
    }

    // Build conversation list — only include invites that have at least one message
    const convos: Conversation[] = [];
    for (const inv of invites || []) {
      const lastMsg = lastMsgMap[inv.id];
      if (!lastMsg) continue; // skip invites with no messages

      const firstName = inv.patient_first_name || "";
      const lastName = inv.patient_last_name || "";
      const fullName = firstName && lastName
        ? `${firstName} ${lastName}`
        : inv.patient_email;
      const initials = firstName && lastName
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : inv.patient_email.slice(0, 2).toUpperCase();

      const moduleName = (inv.consent_modules as { name: string } | null)?.name || "Consent Form";

      convos.push({
        inviteId: inv.id,
        patientName: fullName,
        patientEmail: inv.patient_email,
        patientInitials: initials,
        moduleName,
        inviteStatus: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
        lastMessage: lastMsg.message,
        lastMessageTime: shortTimeAgo(lastMsg.created_at),
        unreadCount: countMap[inv.id] || 0,
      });
    }

    // Sort by most recent message
    convos.sort((a, b) => {
      const aTime = lastMsgMap[a.inviteId]?.created_at || "";
      const bTime = lastMsgMap[b.inviteId]?.created_at || "";
      return bTime.localeCompare(aTime);
    });

    setConversations(convos);
    setIsLoading(false);

    // Auto-select first conversation if none selected
    if (!activeInviteId && convos.length > 0) {
      setActiveInviteId(convos[0].inviteId);
    }
  }, [user, activeInviteId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const activeConversation = conversations.find((c) => c.inviteId === activeInviteId) || null;

  const handleSelectConversation = (id: string) => {
    setActiveInviteId(id);
    setShowMobileSidebar(false);
  };

  const handleBack = () => {
    setShowMobileSidebar(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Navigation Rail */}
      <NavigationRail />

      {/* Conversation Sidebar */}
      <div
        className={cn(
          "md:flex",
          showMobileSidebar ? "flex w-full md:w-auto" : "hidden"
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          activeInviteId={activeInviteId}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBackToDashboard={() => navigate("/dashboard")}
        />
      </div>

      {/* Main Chat Window */}
      <div
        className={cn(
          "flex-1 md:flex min-w-0",
          showMobileSidebar ? "hidden" : "flex"
        )}
      >
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.inviteId}
            conversation={activeConversation}
            onBack={handleBack}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
