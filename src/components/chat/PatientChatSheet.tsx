import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ConsentChatPanel } from "./ConsentChatPanel";
import { useConsentChat } from "@/hooks/useConsentChat";

interface PatientChatSheetProps {
  token: string;
  inviteId?: string;
  moduleName?: string;
  senderName: string;
}

export function PatientChatSheet({
  token,
  inviteId,
  moduleName,
  senderName,
}: PatientChatSheetProps) {
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, isLoading, isSending } = useConsentChat({
    token,
    inviteId,
    senderName,
    enabled: true,
  });

  const patientMessageCount = messages.filter((m) => m.sender_role === "provider").length;
  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 p-0"
      >
        <MessageCircle className="h-6 w-6" />
        {hasMessages && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
            {patientMessageCount > 0 ? patientMessageCount : "!"}
          </span>
        )}
      </Button>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-4 pb-3 border-b flex-shrink-0">
            <SheetTitle className="text-lg">Questions & Chat</SheetTitle>
            <SheetDescription>
              {moduleName
                ? `Chat about "${moduleName}" with your provider`
                : "Ask your provider a question about this consent"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <ConsentChatPanel
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              isSending={isSending}
              currentRole="patient"
              emptyStateText="No messages yet. Ask your provider a question about this consent."
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
