"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useSidebarStore } from "@/store/sidebar";
import { createFolderAction } from "@/app/(main)/dashboard/actions";
import ConfirmationDialog from "@/components/shared/confirmationDialog";

export default function NewFolderDialog() {
  const {
    newFolderName,
    setNewFolderName,
    isDialogOpen,
    setIsDialogOpen,
    isCreatingFolder,
    setIsCreatingFolder,
    refreshFolders,
  } = useSidebarStore();

  const handleCreateFolder = async () => {
    if (newFolderName === "") return;
    await createFolderAction(newFolderName);
    setNewFolderName("");
    await refreshFolders();
  };

  return (
    <ConfirmationDialog
      trigger={
        <Button size="sm" disabled={isCreatingFolder}>
          {isCreatingFolder ? <Spinner /> : <PlusIcon />}
          New Folder
        </Button>
      }
      title="New Folder"
      description="Please enter the name of the new folder."
      actionFunction={handleCreateFolder}
      actionLabel="Create"
      isLoading={isCreatingFolder}
      setIsLoading={setIsCreatingFolder}
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    >
      <Input
        type="text"
        placeholder="Folder name"
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
      />
    </ConfirmationDialog>
  );
}
