"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { deleteAllConversationsAction } from "@/app/(main)/search/actions";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chat";

export default function DeleteAllButton() {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const {
    setCurrentConversationId,
    refreshConversations,
  } = useChatStore();

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    await deleteAllConversationsAction();
    setCurrentConversationId(null);
    router.replace("/search");
    await refreshConversations();
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner />
              Deleting...
            </>
          ) : (
            <>
              <Trash2Icon className="w-4 h-4 mr-2" />
              Delete All
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Conversations</AlertDialogTitle>
          <AlertDialogDescription>
            This action will delete all conversations. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteAll} disabled={isDeleting}>
            {isDeleting ? <Spinner /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
