"use client";

import { useDashboardStore } from "@/store/dashboard";
import { useCallback, useEffect, useRef } from "react";
import { useCommandAgent } from "@/hooks/dashboard/useCommandAgent";
import { useSegmentParser } from "@/hooks/dashboard/useSegmentParser";
import { DashboardHeader } from "@/components/dashboard/header";
import { EditorTextarea } from "@/components/dashboard/EditorTextarea";
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

function DashboardContent() {
  const { currentFile, setCurrentFile, commandModel, isEditMode } =
    useDashboardStore();
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

  return (
    <>
      <SidebarInset>
        <header className="flex h-10 shrink-0 items-center gap-2 border-b sticky top-0 z-50 bg-background">
          <div className="flex justify-between w-full items-center gap-2 px-3">
            <Navigation />
            <SidebarTrigger />
          </div>
        </header>
        <DashboardHeader />
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
