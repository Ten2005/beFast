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

export async function DashboardSidebar() {
  const folders = await readFoldersAction();
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
