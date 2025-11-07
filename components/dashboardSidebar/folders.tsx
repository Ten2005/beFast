"use client";

import { UsedFolder, UsedFile } from "@/store/sidebar";
import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { useSidebarStore } from "@/store/sidebar";
import { useDashboardStore } from "@/store/dashboard";
import {
  createFileAction,
  toggleFolderPinnedAction,
  deleteFolderAction,
  updateFolderAction,
} from "@/app/(main)/dashboard/actions";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import DeleteConfirmationDialog from "@/components/dashboardSidebar/deleteConfirmationDialog";
import EditConfirmationDialog from "@/components/dashboardSidebar/editConfirmationDialog";

type FolderWithFiles = UsedFolder & { files: UsedFile[] };

export default function Folders({
  folders: initialFolders,
}: {
  folders: FolderWithFiles[];
}) {
  const {
    currentFolder,
    setCurrentFolder,
    setCurrentFiles,
    getFilesByFolder,
    cacheFiles,
    pinningFolders,
    setPinningFolder,
    toggleFolderPin,
    revertFolderPin,
    setFolders,
    folders,
  } = useSidebarStore();
  const { setCurrentFile } = useDashboardStore();

  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    setFolders(initialFolders);

    initialFolders.forEach((folder) => {
      cacheFiles(folder.id, folder.files);
    });
  }, [initialFolders, cacheFiles, setFolders]);

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const handlePinToggle = useCallback(
    async (folderId: number, currentPinState: boolean) => {
      if (pinningFolders.has(folderId)) {
        return;
      }

      const existingTimer = debounceTimers.current.get(folderId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      setPinningFolder(folderId, true);

      toggleFolderPin(folderId);

      const timer = setTimeout(async () => {
        try {
          await toggleFolderPinnedAction(folderId, !currentPinState);
        } catch (error) {
          console.error("Failed to toggle pin state:", error);

          revertFolderPin(folderId);
        } finally {
          setPinningFolder(folderId, false);
          debounceTimers.current.delete(folderId);
        }
      }, 300);

      debounceTimers.current.set(folderId, timer);
    },
    [pinningFolders, setPinningFolder, toggleFolderPin, revertFolderPin],
  );

  const changeFolder = useCallback(
    async (folder: UsedFolder) => {
      setCurrentFolder(folder);

      const files = getFilesByFolder(folder.id);
      if (files.length > 0) {
        setCurrentFiles(files);
        setCurrentFile(files[0]);
      } else {
        setCurrentFiles([]);
        setCurrentFile(undefined);

        try {
          const file = await createFileAction(folder.id, 0);
          cacheFiles(folder.id, [file]);
          setCurrentFiles([file]);
          setCurrentFile(file);
        } catch (error) {
          console.error("Failed to create file:", error);
        }
      }
    },
    [
      setCurrentFolder,
      getFilesByFolder,
      setCurrentFiles,
      setCurrentFile,
      cacheFiles,
    ],
  );

  const handleDeleteFolder = async (folderId: number) => {
    await deleteFolderAction(folderId);

    const updatedFolders = folders.filter((folder) => folder.id !== folderId);
    setFolders(updatedFolders);

    if (currentFolder?.id === folderId) {
      if (updatedFolders.length > 0) {
        await changeFolder(updatedFolders[0]);
      } else {
        setCurrentFolder(undefined);
        setCurrentFiles([]);
        setCurrentFile(undefined);
      }
    }
  };

  const handleEditFolder = async (folderId: number, newName: string) => {
    await updateFolderAction(folderId, newName);

    const updatedFolders = folders.map((folder) =>
      folder.id === folderId ? { ...folder, name: newName } : folder,
    );
    setFolders(updatedFolders);

    if (currentFolder?.id === folderId) {
      setCurrentFolder({ ...currentFolder, name: newName });
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Folders</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-1">
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant="ghost"
            size="sm"
            className={cn(
              "p-0 justify-between w-full transition-all duration-150",
              currentFolder?.id === folder.id && "bg-accent",
              "active:bg-accent",
            )}
            onClick={() => changeFolder(folder)}
            asChild
          >
            <div
              id={folder.id.toString()}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center">
                <Button
                  size="icon"
                  variant="ghost"
                  className="p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinToggle(folder.id, folder.is_pinned);
                  }}
                  disabled={pinningFolders.has(folder.id)}
                  aria-label={folder.is_pinned ? "Unpin folder" : "Pin folder"}
                  title={folder.is_pinned ? "Unpin" : "Pin"}
                >
                  {pinningFolders.has(folder.id) ? (
                    <Spinner />
                  ) : folder.is_pinned ? (
                    <Pin className="text-primary" />
                  ) : (
                    <PinOff className="text-muted" />
                  )}
                </Button>
                <span className="max-w-24 truncate">{folder.name}</span>
              </div>
              {currentFolder?.id === folder.id && (
                <div>
                  <SidebarMenuAction
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    asChild
                    showOnHover
                  >
                    <EditConfirmationDialog
                      editFunction={(newName) =>
                        handleEditFolder(folder.id, newName)
                      }
                      target={folder.name}
                    />
                  </SidebarMenuAction>
                  <SidebarMenuAction
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    asChild
                    showOnHover
                  >
                    <DeleteConfirmationDialog
                      deleteFunction={() => handleDeleteFolder(folder.id)}
                      target={folder.name}
                    />
                  </SidebarMenuAction>
                </div>
              )}
            </div>
          </Button>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
