import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConsentChatPanel } from "./ConsentChatPanel";
import { useConsentChat } from "@/hooks/useConsentChat";

interface ProviderChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteId: string;
  patientName: string;
  moduleName: string;
}

export function ProviderChatSheet({
  open,
  onOpenChange,
  inviteId,
  patientName,
  moduleName,
}: ProviderChatSheetProps) {
  const { messages, sendMessage, isLoading, isSending } = useConsentChat({
    inviteId,
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 pb-3 border-b flex-shrink-0">
          <SheetTitle className="text-lg">Chat with {patientName}</SheetTitle>
          <SheetDescription>
            Regarding: {moduleName}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <ConsentChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            isSending={isSending}
            currentRole="provider"
            emptyStateText="No messages yet. The patient hasn't asked any questions."
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
