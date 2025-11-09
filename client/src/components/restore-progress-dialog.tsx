import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface RestoreProgressDialogProps {
  open: boolean;
  onRestore: () => void;
  onStartNew: () => void;
  lastSaved?: string;
  flowName?: string;
}

/**
 * Dialog to ask user if they want to restore saved progress or start fresh
 */
export function RestoreProgressDialog({
  open,
  onRestore,
  onStartNew,
  lastSaved,
  flowName = "this form",
}: RestoreProgressDialogProps) {
  const timeAgo = lastSaved 
    ? formatDistanceToNow(new Date(lastSaved), { addSuffix: true })
    : "recently";

  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-testid="dialog-restore-progress">
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="text-restore-title">
            Continue Where You Left Off?
          </AlertDialogTitle>
          <AlertDialogDescription data-testid="text-restore-description">
            We found your saved progress for {flowName} from {timeAgo}. 
            Would you like to continue where you left off, or start fresh?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onStartNew}
            data-testid="button-start-new"
          >
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onRestore}
            data-testid="button-restore-progress"
          >
            Continue Previous Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
