"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";

import { ModeToggle } from "@/components/modeToggle";
import ConversationItem from "@/components/searchSidebar/conversationItem";
import DeleteAllButton from "@/components/searchSidebar/deleteAllButton";
import { useEffect } from "react";
import { useChatStore } from "@/store/chat";

export function SearchSidebar() {
  const { conversations, refreshConversations } = useChatStore();

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <ModeToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <DeleteAllButton />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  id={conversation.id}
                  title={conversation.title}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
