"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

import NewFolderDialog from "@/components/dashboardSidebar/newFolderDialog";
import Folders from "@/components/dashboardSidebar/folders";
import CurrentFolder from "@/components/dashboardSidebar/currentFolder";
import { ModeToggle } from "@/components/modeToggle";
import CreateFileButton from "@/components/dashboardSidebar/createFileButton";
import { useEffect } from "react";
import { useSidebarStore } from "@/store/sidebar";

export function DashboardSidebar() {
  const { refreshFolders } = useSidebarStore();

  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <ModeToggle />
      </SidebarHeader>
      <SidebarContent>
        <Folders />
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex justify-end">
              <NewFolderDialog />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <CurrentFolder />
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex justify-end">
              <CreateFileButton />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
