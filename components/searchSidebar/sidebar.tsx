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
import { readConversationsAction } from "@/app/(main)/search/actions";
import ConversationItem from "@/components/searchSidebar/conversationItem";
import DeleteAllButton from "@/components/searchSidebar/deleteAllButton";
import { useEffect, useState } from "react";

type Conversation = {
  id: number;
  title: string;
};

export function SearchSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const data = await readConversationsAction();
      setConversations(data);
    };
    fetchConversations();
  }, []);

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
