import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Home,
  Settings,
  User,
  Search,
  Smile,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  X,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  status: "online" | "offline" | "away" | "busy";
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  role: string;
}

interface Attachment {
  id: string;
  type: "file" | "image";
  name: string;
  size: string;
  url?: string;
  progress?: number; // 0-100, undefined means complete
}

interface Message {
  id: string;
  senderId: string;
  text?: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  attachments?: Attachment[];
}

// ─── Demo Data ───────────────────────────────────────────────────────
const CURRENT_USER_ID = "me";

const contacts: Contact[] = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    initials: "SC",
    status: "online",
    lastMessage: "The consent form looks great, let me review...",
    lastMessageTime: "2m",
    unread: 3,
    role: "Cardiologist",
  },
  {
    id: "2",
    name: "James Wilson",
    initials: "JW",
    status: "online",
    lastMessage: "I signed the consent form",
    lastMessageTime: "15m",
    unread: 0,
    role: "Patient",
  },
  {
    id: "3",
    name: "Dr. Emily Park",
    initials: "EP",
    status: "away",
    lastMessage: "Can you send the updated module?",
    lastMessageTime: "1h",
    unread: 1,
    role: "Orthopedic Surgeon",
  },
  {
    id: "4",
    name: "Maria Garcia",
    initials: "MG",
    status: "offline",
    lastMessage: "Thank you for explaining the procedure",
    lastMessageTime: "3h",
    unread: 0,
    role: "Patient",
  },
  {
    id: "5",
    name: "Dr. Robert Kim",
    initials: "RK",
    status: "busy",
    lastMessage: "Meeting at 3pm to discuss compliance",
    lastMessageTime: "5h",
    unread: 0,
    role: "Chief Medical Officer",
  },
  {
    id: "6",
    name: "Lisa Thompson",
    initials: "LT",
    status: "offline",
    lastMessage: "I have a question about the procedure",
    lastMessageTime: "1d",
    unread: 0,
    role: "Patient",
  },
  {
    id: "7",
    name: "Dr. Ahmed Patel",
    initials: "AP",
    status: "online",
    lastMessage: "New audit log entry flagged",
    lastMessageTime: "1d",
    unread: 0,
    role: "Compliance Officer",
  },
];

const demoMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      senderId: "1",
      text: "Hi! I wanted to discuss the new cardiac consent module before we publish it.",
      timestamp: "10:30 AM",
      status: "read",
    },
    {
      id: "m2",
      senderId: CURRENT_USER_ID,
      text: "Sure, I've been working on the risk disclosure section. Want me to share the draft?",
      timestamp: "10:32 AM",
      status: "read",
    },
    {
      id: "m3",
      senderId: "1",
      text: "Yes please! Also, make sure we include the new FDA guidelines from last month.",
      timestamp: "10:33 AM",
      status: "read",
    },
    {
      id: "m4",
      senderId: CURRENT_USER_ID,
      text: "Here's the latest draft with all the updates:",
      timestamp: "10:35 AM",
      status: "read",
      attachments: [
        {
          id: "a1",
          type: "file",
          name: "Cardiac_Consent_Module_v3.pdf",
          size: "2.4 MB",
        },
      ],
    },
    {
      id: "m5",
      senderId: "1",
      text: "This looks comprehensive. I especially like the visual diagram for the procedure steps.",
      timestamp: "10:40 AM",
      status: "read",
    },
    {
      id: "m6",
      senderId: CURRENT_USER_ID,
      text: "Thanks! I added those based on patient feedback. Here are the diagrams I used:",
      timestamp: "10:41 AM",
      status: "read",
      attachments: [
        {
          id: "a2",
          type: "image",
          name: "procedure_diagram_1.png",
          size: "850 KB",
          url: "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=300&h=200&fit=crop",
        },
        {
          id: "a3",
          type: "image",
          name: "procedure_diagram_2.png",
          size: "1.1 MB",
          url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=200&fit=crop",
        },
        {
          id: "a4",
          type: "image",
          name: "risk_chart.png",
          size: "620 KB",
          url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop",
        },
      ],
    },
    {
      id: "m7",
      senderId: "1",
      text: "The consent form looks great, let me review the final version and get back to you.",
      timestamp: "10:45 AM",
      status: "read",
    },
    {
      id: "m8",
      senderId: CURRENT_USER_ID,
      text: "Sounds good! I'm also uploading the Spanish translation now.",
      timestamp: "10:46 AM",
      status: "delivered",
      attachments: [
        {
          id: "a5",
          type: "file",
          name: "Cardiac_Consent_ES.pdf",
          size: "2.6 MB",
          progress: 67,
        },
      ],
    },
  ],
};

// ─── Status Color Helper ─────────────────────────────────────────────
function statusColor(status: Contact["status"]) {
  switch (status) {
    case "online":
      return "bg-emerald-500";
    case "away":
      return "bg-amber-500";
    case "busy":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

function statusLabel(status: Contact["status"]) {
  switch (status) {
    case "online":
      return "Online";
    case "away":
      return "Away";
    case "busy":
      return "Do not disturb";
    default:
      return "Offline";
  }
}

// ─── Navigation Rail ─────────────────────────────────────────────────
function NavigationRail({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const navItems = [
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "home", icon: Home, label: "Home" },
    { id: "profile", icon: User, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="hidden md:flex flex-col items-center w-[68px] bg-muted/30 border-r border-border py-4 gap-1">
      {/* Brand mark */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm mb-4">
        CC
      </div>

      <div className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Bottom avatar */}
      <div className="mt-auto">
        <Avatar className="h-9 w-9 ring-2 ring-primary/20">
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            ME
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

// ─── Sidebar Skeleton Loader ─────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {[...Array(6)].map((_, i) => (
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

// ─── Conversation Sidebar ────────────────────────────────────────────
function ConversationSidebar({
  contacts,
  activeContactId,
  onSelectContact,
  isLoading,
  searchQuery,
  onSearchChange,
}: {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full md:w-[320px] lg:w-[360px] border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-display text-lg font-bold">Messages</h2>
        <Badge variant="default" className="text-[10px] px-2 py-0.5">
          {contacts.reduce((acc, c) => acc + c.unread, 0)} new
        </Badge>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <SidebarSkeleton />
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          <div className="p-1.5">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left group",
                  activeContactId === contact.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/60 border border-transparent"
                )}
              >
                {/* Avatar with status */}
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11">
                    {contact.avatar && <AvatarImage src={contact.avatar} />}
                    <AvatarFallback
                      className={cn(
                        "text-xs font-semibold",
                        activeContactId === contact.id
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {contact.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                      statusColor(contact.status)
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        contact.unread > 0 && "font-semibold"
                      )}
                    >
                      {contact.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-xs truncate pr-2",
                        contact.unread > 0
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {contact.lastMessage}
                    </p>
                    {contact.unread > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shrink-0">
                        {contact.unread}
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
  showAvatar,
  contact,
}: {
  message: Message;
  isSent: boolean;
  showAvatar: boolean;
  contact: Contact;
}) {
  return (
    <div
      className={cn("flex gap-2 px-4 group", isSent ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar for received messages */}
      {!isSent ? (
        showAvatar ? (
          <Avatar className="h-8 w-8 mt-1 shrink-0">
            <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
              {contact.initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 shrink-0" />
        )
      ) : null}

      {/* Bubble */}
      <div
        className={cn("max-w-[75%] space-y-1.5", isSent ? "items-end" : "items-start")}
      >
        {/* Text */}
        {message.text && (
          <div
            className={cn(
              "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
              isSent
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            )}
          >
            {message.text}
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {/* Image Grid */}
            {message.attachments.some((a) => a.type === "image") && (
              <ImageGrid
                images={message.attachments.filter((a) => a.type === "image")}
              />
            )}
            {/* File Chips */}
            {message.attachments
              .filter((a) => a.type === "file")
              .map((file) => (
                <FileChip key={file.id} attachment={file} isSent={isSent} />
              ))}
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div
          className={cn(
            "flex items-center gap-1 px-1",
            isSent ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {message.timestamp}
          </span>
          {isSent && (
            <span className="text-muted-foreground">
              {message.status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── File Chip ───────────────────────────────────────────────────────
function FileChip({
  attachment,
  isSent,
}: {
  attachment: Attachment;
  isSent: boolean;
}) {
  const isUploading = attachment.progress !== undefined && attachment.progress < 100;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl border max-w-[260px] overflow-hidden transition-colors",
        isSent
          ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
          : "bg-muted/50 border-border hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
          isSent ? "bg-primary/10" : "bg-background"
        )}
      >
        <FileText className={cn("h-4.5 w-4.5", isSent ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{attachment.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {isUploading ? `Uploading... ${attachment.progress}%` : attachment.size}
        </p>
      </div>
      {isUploading && (
        <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <Progress value={attachment.progress} className="h-1 rounded-none" />
        </div>
      )}
    </div>
  );
}

// ─── Image Grid ──────────────────────────────────────────────────────
function ImageGrid({ images }: { images: Attachment[] }) {
  const count = images.length;

  return (
    <div
      className={cn(
        "grid gap-1 rounded-xl overflow-hidden max-w-[320px]",
        count === 1 && "grid-cols-1",
        count === 2 && "grid-cols-2",
        count >= 3 && "grid-cols-2"
      )}
    >
      {images.slice(0, 4).map((img, i) => (
        <div
          key={img.id}
          className={cn(
            "relative bg-muted overflow-hidden cursor-pointer group/img",
            count === 1 && "aspect-video",
            count === 2 && "aspect-square",
            count === 3 && i === 0 && "row-span-2 aspect-auto h-full",
            count === 3 && i > 0 && "aspect-square",
            count >= 4 && "aspect-square"
          )}
        >
          {img.url ? (
            <img
              src={img.url}
              alt={img.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          {/* Overlay for 4+ images */}
          {count > 4 && i === 3 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-bold">+{count - 4}</span>
            </div>
          )}
          {/* Upload progress overlay for images */}
          {img.progress !== undefined && img.progress < 100 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-sm font-medium">{img.progress}%</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────
function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-muted rounded-bl-md">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{name} is typing...</span>
    </div>
  );
}

// ─── Chat Input Area ─────────────────────────────────────────────────
function ChatInput({
  onSend,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  onSend: (text: string) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
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

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "border-t border-border bg-background p-3 transition-all",
        isDragOver && "bg-primary/5 border-primary/30 border-dashed border-2"
      )}
    >
      {isDragOver && (
        <div className="flex items-center justify-center py-4 mb-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5">
          <div className="text-center">
            <Paperclip className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-sm font-medium text-primary">Drop files here to attach</p>
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex gap-0.5 shrink-0 pb-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Smile className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Emoji</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full resize-none rounded-xl bg-muted/50 border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
        </div>
        <div className="shrink-0 pb-1">
          <Button
            size="icon"
            className={cn(
              "h-9 w-9 rounded-xl transition-all duration-150",
              text.trim()
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
            disabled={!text.trim()}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
        <h3 className="font-display text-xl font-bold mb-2">Your Messages</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select a conversation to start chatting with your team members and patients.
        </p>
      </div>
    </div>
  );
}

// ─── Main Chat Window ────────────────────────────────────────────────
function ChatWindow({
  contact,
  messages,
  onSend,
  onBack,
}: {
  contact: Contact;
  messages: Message[];
  onSend: (text: string) => void;
  onBack: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTyping, setShowTyping] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate typing indicator disappearing
  useEffect(() => {
    setShowTyping(true);
    const timer = setTimeout(() => setShowTyping(false), 4000);
    return () => clearTimeout(timer);
  }, [contact.id]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // In production, handle file upload here
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          {/* Back button on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {contact.initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                statusColor(contact.status)
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{contact.name}</h3>
            <p className="text-[11px] text-muted-foreground">{statusLabel(contact.status)} &middot; {contact.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice call</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {/* Date divider */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] font-medium text-muted-foreground bg-background px-2">
            Today
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {messages.map((msg, i) => {
          const isSent = msg.senderId === CURRENT_USER_ID;
          // Show avatar on first message or when sender changes
          const showAvatar =
            i === 0 || messages[i - 1].senderId !== msg.senderId;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSent={isSent}
              showAvatar={showAvatar}
              contact={contact}
            />
          );
        })}

        {/* Typing indicator */}
        {showTyping && <TypingIndicator name={contact.name.split(" ")[0]} />}
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    </div>
  );
}

// ─── Main Chat Page ──────────────────────────────────────────────────
export default function Chat() {
  const [activeTab, setActiveTab] = useState("chat");
  const [activeContactId, setActiveContactId] = useState<string | null>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allMessages, setAllMessages] = useState(demoMessages);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const activeContact = contacts.find((c) => c.id === activeContactId) || null;
  const currentMessages = activeContactId
    ? allMessages[activeContactId] || []
    : [];

  const handleSend = (text: string) => {
    if (!activeContactId) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
      status: "sent",
    };
    setAllMessages((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMsg],
    }));
  };

  // Mobile: show sidebar or chat window
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setShowMobileSidebar(false);
  };

  const handleBack = () => {
    setShowMobileSidebar(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Navigation Rail */}
      <NavigationRail activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Conversation Sidebar — hidden on mobile when viewing chat */}
      <div
        className={cn(
          "md:flex",
          showMobileSidebar ? "flex w-full md:w-auto" : "hidden"
        )}
      >
        <ConversationSidebar
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={handleSelectContact}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Chat Window — hidden on mobile when viewing sidebar */}
      <div
        className={cn(
          "flex-1 md:flex",
          showMobileSidebar ? "hidden" : "flex"
        )}
      >
        {activeContact ? (
          <ChatWindow
            contact={activeContact}
            messages={currentMessages}
            onSend={handleSend}
            onBack={handleBack}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
