"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

import NewFolderDialog from "@/components/dashboardSidebar/newFolderDialog";
import { readFoldersAction } from "@/app/(main)/dashboard/actions";
import Folders from "@/components/dashboardSidebar/folders";
import CurrentFolder from "@/components/dashboardSidebar/currentFolder";
import { ModeToggle } from "@/components/modeToggle";
import CreateFileButton from "@/components/dashboardSidebar/createFileButton";
import { useEffect, useState } from "react";
import { UsedFolder, UsedFile } from "@/store/sidebar";

type FolderWithFiles = UsedFolder & { files: UsedFile[] };

export function DashboardSidebar() {
  const [folders, setFolders] = useState<FolderWithFiles[]>([]);

  useEffect(() => {
    const fetchFolders = async () => {
      const data = await readFoldersAction();
      setFolders(data);
    };
    fetchFolders();
  }, []);

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <ModeToggle />
      </SidebarHeader>
      <SidebarContent>
        <Folders folders={folders} />
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
