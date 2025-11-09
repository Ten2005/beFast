"use client";

import { useChatStore } from "@/store/chat";
import { Message } from "@/components/chat/message";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useEffect, useState } from "react";
import { saveMessageAction } from "./actions";
import { useRouter } from "next/navigation";
import { useConversationSync } from "@/hooks/search/useConversationSync";
import { ChatHeader } from "@/components/chat/chatHeader";
import { ChatInput } from "@/components/chat/chatInput";
import { toast } from "sonner";
import Navigation from "@/components/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SearchSidebar } from "@/components/searchSidebar/sidebar";

function SearchContent() {
  const {
    currentConversationId,
    setCurrentConversationId,
    chatType,
    setChatType,
    input,
    setInput,
    refreshConversations,
  } = useChatStore();
  const router = useRouter();
  const conversationIdRef = useRef<number | null>(currentConversationId);
  const chatTypeRef = useRef(chatType);
  const latestUserMessageRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const prevConversationIdRef = useRef<number | null>(currentConversationId);

  const [stableChatId, setStableChatId] = useState<string>(() =>
    currentConversationId ? `${currentConversationId}` : `new`,
  );

  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    const currentId = currentConversationId;

    if (prevId === null && currentId !== null) {
    } else {
      setStableChatId(currentId ? `${currentId}` : `new`);
    }

    prevConversationIdRef.current = currentId;
  }, [currentConversationId]);

  useEffect(() => {
    chatTypeRef.current = chatType;
  }, [chatType]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        fetch: async (url, options) => {
          const apiUrl = `/api/chat/${chatTypeRef.current}`;
          const body = JSON.parse(options?.body as string);
          body.conversationId = conversationIdRef.current;
          return fetch(apiUrl, {
            ...options,
            body: JSON.stringify(body),
          });
        },
      }),
    [],
  );

  const { messages, setMessages, sendMessage, status, error, stop } = useChat({
    id: stableChatId,
    transport,
  });

  useConversationSync(setMessages, setCurrentConversationId);

  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    if (currentConversationId === null) {
      setMessages([]);
    }
  }, [currentConversationId, setMessages]);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "user" && latestUserMessageRef.current) {
        latestUserMessageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "会話の生成中にエラーが発生しました";
      toast.error(errorMessage, {
        description: "もう一度お試しください",
      });
      stop();
    }
  }, [error, stop]);

  const handleClearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    router.push("/search");
  };

  const handleSubmit = async (inputText: string) => {
    if (status !== "ready") {
      return;
    }

    const wasNewConversation = conversationIdRef.current === null;
    const savedId = await saveMessageAction(
      conversationIdRef.current,
      inputText,
      "user",
    );
    conversationIdRef.current = savedId;
    setCurrentConversationId(savedId);

    if (wasNewConversation) {
      await refreshConversations();
    }

    await sendMessage({ text: inputText });
  };

  const latestUserMessageIndex = messages.reduce(
    (latestIndex, message, index) => {
      return message.role === "user" ? index : latestIndex;
    },
    -1,
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
        <ChatHeader
          chatType={chatType}
          onChatTypeChange={setChatType}
          onNewChat={handleClearChat}
        />
        <div className="p-2 flex-1 flex sticky top-24 flex-col gap-6 mb-36">
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={
                index === latestUserMessageIndex ? latestUserMessageRef : null
              }
            >
              <Message parts={message.parts} isUser={message.role === "user"} />
            </div>
          ))}
        </div>
        <ChatInput
          input={input}
          status={status}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
      </SidebarInset>
      <SearchSidebar />
    </>
  );
}

export default function SearchPage() {
  return (
    <SidebarProvider>
      <SearchContent />
    </SidebarProvider>
  );
}
