"use client";

import {
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSidebarStore } from "@/store/sidebar";
import { useDashboardStore } from "@/store/dashboard";
import {
  deleteFileAction,
  createFileAction,
  reorderFilesAction,
  editFileAction,
} from "@/app/(main)/dashboard/actions";
import DeleteConfirmationDialog from "@/components/dashboardSidebar/deleteConfirmationDialog";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import EditConfirmationDialog from "@/components/dashboardSidebar/editConfirmationDialog";

export default function CurrentFolder() {
  const { currentFolder, currentFiles, setCurrentFiles } = useSidebarStore();
  const { currentFile, setCurrentFile } = useDashboardStore();
  const { isMobile, setOpenMobile } = useSidebar();
  const dragIndexRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editDialogOpenRef = useRef(false);
  const deleteDialogOpenRef = useRef(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (dropIndex: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIndex === null || fromIndex === dropIndex) return;
    await reorderItems(fromIndex, dropIndex);
  };

  const reorderItems = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newOrder = [...currentFiles];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    const renumbered = newOrder.map((f, i) => ({ ...f, page: i }));
    const orderedIds = renumbered.map((f) => f.id);

    setCurrentFiles(renumbered);
    if (currentFile) {
      const updated = renumbered.find((f) => f.id === currentFile.id);
      if (updated) setCurrentFile(updated);
    }
    if (currentFolder) {
      await reorderFilesAction(currentFolder.id, orderedIds);
    }
  };

  const handleTouchStart = (index: number) => (e: React.TouchEvent) => {
    if (!isTouchDevice) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    longPressTimerRef.current = setTimeout(() => {
      setIsDragging(true);
      setDraggedIndex(index);
      dragIndexRef.current = index;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchDevice || !isDragging) return;

    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const fileItem = element?.closest("[data-file-index]");

    if (fileItem) {
      const targetIndex = parseInt(
        fileItem.getAttribute("data-file-index") || "0",
      );
      if (targetIndex !== draggedIndex && dragIndexRef.current !== null) {
        setDraggedIndex(targetIndex);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isTouchDevice) return;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDragging && dragIndexRef.current !== null && draggedIndex !== null) {
      await reorderItems(dragIndexRef.current, draggedIndex);
    }

    setIsDragging(false);
    setDraggedIndex(null);
    dragIndexRef.current = null;
    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsDragging(false);
    setDraggedIndex(null);
    dragIndexRef.current = null;
    touchStartRef.current = null;
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!currentFolder || !currentFolder.id) return;

    const fileToDelete = currentFiles.find((file) => file.id === fileId);
    if (!fileToDelete) return;

    await deleteFileAction(fileId, currentFolder.id, fileToDelete.page);

    const filteredFiles = currentFiles
      .filter((file) => file.id !== fileId)
      .map((file) => ({
        ...file,
        page: file.page > fileToDelete.page ? file.page - 1 : file.page,
      }))
      .sort((a, b) => a.page - b.page);

    setCurrentFiles(filteredFiles);

    if (filteredFiles.length === 0 && currentFolder && currentFolder.id) {
      const file = await createFileAction(currentFolder.id, 0);
      setCurrentFiles([file]);
      setCurrentFile(file);
    } else {
      const updatedCurrent =
        currentFile?.id === fileId
          ? filteredFiles[0]
          : filteredFiles.find((file) => file.id === currentFile?.id);
      if (updatedCurrent) setCurrentFile(updatedCurrent);
    }
  };

  const handleEditFile = async (fileId: number, newTitle: string) => {
    if (!currentFolder || !currentFolder.id) return;
    const fileToEdit = currentFiles.find((file) => file.id === fileId);
    if (!fileToEdit) return;
    await editFileAction(fileId, newTitle, fileToEdit.content || "");

    const updatedFiles = currentFiles.map((file) =>
      file.id === fileId ? { ...file, title: newTitle } : file,
    );
    setCurrentFiles(updatedFiles);

    if (currentFile?.id === fileId) {
      setCurrentFile({ ...currentFile, title: newTitle });
    }
  };

  if (!currentFolder || !currentFolder.id)
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Current Folder</SidebarGroupLabel>
        <SidebarGroupContent>
          <p className="text-sm text-muted-foreground">
            Select a folder below to get started.
          </p>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Files :{" "}
        <span className="max-w-24 truncate">{currentFolder.name || ""}</span>
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-1">
        {currentFiles.map((file, index) => (
          <SidebarMenuButton
            key={file.id}
            onClick={() => {
              if (!isDragging) {
                setCurrentFile(file);
              }
            }}
            className={cn(
              currentFile?.id === file.id && "bg-accent",
              "transition-all duration-150 active:bg-accent",
            )}
            asChild
          >
            <div
              className={`flex items-center justify-between w-full transition-all duration-200 ${
                isDragging && draggedIndex === index
                  ? "bg-primary/10 shadow-sm"
                  : isDragging && index === dragIndexRef.current
                    ? "opacity-50"
                    : ""
              }`}
              data-file-index={index}
              draggable={!isTouchDevice}
              onDragStart={!isTouchDevice ? handleDragStart(index) : undefined}
              onDragOver={!isTouchDevice ? handleDragOver : undefined}
              onDrop={!isTouchDevice ? handleDrop(index) : undefined}
              onTouchStart={isTouchDevice ? handleTouchStart(index) : undefined}
              onTouchMove={isTouchDevice ? handleTouchMove : undefined}
              onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
              onTouchCancel={isTouchDevice ? handleTouchCancel : undefined}
              style={{ touchAction: isDragging ? "none" : "auto" }}
            >
              <span className="max-w-24 truncate">{file.title}</span>
              {file.id === currentFile?.id && (
                <div>
                  <SidebarMenuAction
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    asChild
                    showOnHover
                  >
                    <EditConfirmationDialog
                      editFunction={(newTitle) =>
                        handleEditFile(file.id, newTitle)
                      }
                      target={file.title || "None"}
                      onBeforeOpen={() => {
                        editDialogOpenRef.current = true;
                        if (isMobile) {
                          setOpenMobile(true);
                        }
                      }}
                      onOpenChange={(open) => {
                        editDialogOpenRef.current = open;
                        if (isMobile && open) {
                          setOpenMobile(true);
                        }
                      }}
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
                      deleteFunction={() => handleDeleteFile(file.id)}
                      target={file.title || "None"}
                      onBeforeOpen={() => {
                        deleteDialogOpenRef.current = true;
                        if (isMobile) {
                          setOpenMobile(true);
                        }
                      }}
                      onOpenChange={(open) => {
                        deleteDialogOpenRef.current = open;
                        if (isMobile && open) {
                          setOpenMobile(true);
                        }
                        if (!open) {
                          deleteDialogOpenRef.current = false;
                        }
                      }}
                    />
                  </SidebarMenuAction>
                </div>
              )}
            </div>
          </SidebarMenuButton>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
