import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface IdleTimeoutDialogProps {
  open: boolean;
  secondsLeft: number;
  onStayLoggedIn: () => void;
}

export function IdleTimeoutDialog({
  open,
  secondsLeft,
  onStayLoggedIn,
}: IdleTimeoutDialogProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, "0")}`
    : `${seconds}s`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session Expiring
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You've been inactive for a while. For your security, you'll be
              automatically logged out in:
            </p>
            <p className="text-2xl font-bold text-foreground text-center py-2">
              {timeDisplay}
            </p>
            <p className="text-xs">
              Move your mouse or press any key to stay logged in, or click the
              button below.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onStayLoggedIn} className="w-full">
            Stay Logged In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
