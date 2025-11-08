"use client";

import { useDashboardStore } from "@/store/dashboard";
import { useCallback, useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCommandAgent } from "@/hooks/dashboard/useCommandAgent";
import { useSegmentParser } from "@/hooks/dashboard/useSegmentParser";
import { DashboardHeader } from "@/components/dashboard/header";
import { EditorTextarea } from "@/components/dashboard/EditorTextarea";
import { updateFileAction } from "@/app/(main)/dashboard/actions";
import { useSidebarStore } from "@/store/sidebar";
import {
  SEGMENT_START_FRAG,
  SEGMENT_END_FRAG,
  DELETE_START_FRAG,
  DELETE_END_FRAG,
} from "@/constants/dashboard";
import Navigation from "@/components/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboardSidebar/sidebar";
import { toast } from "sonner";

function DashboardContent() {
  const {
    currentFile,
    setCurrentFile,
    commandModel,
    isEditMode,
    setIsEditMode,
  } = useDashboardStore();
  const { isMobile, setOpenMobile } = useSidebar();
  const { updateFileContent } = useSidebarStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { processCommandAgent, pendingSegment, setPendingSegment } =
    useCommandAgent(currentFile?.content, commandModel);
  const { replacePendingSegment } = useSegmentParser(
    SEGMENT_START_FRAG,
    SEGMENT_END_FRAG,
  );
  const { removeSegments } = useSegmentParser(
    DELETE_START_FRAG,
    DELETE_END_FRAG,
  );

  useEffect(() => {
    if (isMobile) {
      if (!currentFile) {
        setOpenMobile(true);
      } else {
        setOpenMobile(false);
      }
    }
  }, [currentFile, isMobile, setOpenMobile]);

  useEffect(() => {
    if (currentFile && !currentFile.content) {
      setCurrentFile({ ...currentFile, content: "" });
    }
  }, [currentFile?.id, setCurrentFile]);

  useEffect(() => {
    if (!pendingSegment) return;
    if (!currentFile) {
      setPendingSegment(null);
      return;
    }

    const currentContent = currentFile.content || "";
    const updatedContent = replacePendingSegment(
      currentContent,
      pendingSegment,
    );

    if (updatedContent === null) {
      setPendingSegment(null);
      return;
    }

    if (updatedContent !== currentContent) {
      setCurrentFile({ ...currentFile, content: updatedContent });
    }
    setPendingSegment(null);
  }, [
    pendingSegment,
    currentFile,
    replacePendingSegment,
    setCurrentFile,
    setPendingSegment,
  ]);

  const handleTextAreaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (currentFile) {
        const content = e.target.value;
        const { newContent, cursorPosition } = removeSegments(content);

        const updatedFile = { ...currentFile, content: newContent };
        setCurrentFile(updatedFile);

        processCommandAgent();

        if (cursorPosition !== null && textareaRef.current) {
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(
                cursorPosition,
                cursorPosition,
              );
            }
          }, 0);
        }
      }
    },
    [currentFile, setCurrentFile, processCommandAgent, removeSegments],
  );

  const handleSave = useCallback(async () => {
    if (!currentFile) return;

    try {
      await processCommandAgent();

      await updateFileAction(
        currentFile.id,
        currentFile.title || "",
        currentFile.content || "",
      );

      updateFileContent(currentFile.id, currentFile.content || "");
      setIsEditMode(false);
      toast.success("Successfully saved", {
        description: "Your changes have been saved",
      });
    } catch (error) {
      toast.error("Failed to save", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [currentFile, processCommandAgent, updateFileContent, setIsEditMode]);

  return (
    <>
      <SidebarInset>
        <header className="flex h-10 shrink-0 items-center gap-2 border-b">
          <div className="flex justify-between w-full items-center gap-2 px-3">
            <Navigation />
            <SidebarTrigger />
          </div>
        </header>
        <DashboardHeader onSave={handleSave} />
        <EditorTextarea
          ref={textareaRef}
          value={currentFile?.content || ""}
          onChange={handleTextAreaChange}
          disabled={!currentFile}
          isEditMode={isEditMode}
        />
      </SidebarInset>
      <DashboardSidebar />
    </>
  );
}

export default function Dashboard() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}
