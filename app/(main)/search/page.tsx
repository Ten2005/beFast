"use client";

import { useChatStore } from "@/store/chat";
import { Message } from "@/components/chat/message";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useMemo, useRef, useEffect, useState } from "react";
import {
  saveMessageAction,
  readConversationsWithMessagesAction,
} from "./actions";
import { useRouter } from "next/navigation";
import { useConversationSync } from "@/hooks/search/useConversationSync";
import { ChatHeader } from "@/components/chat/chatHeader";
import { ChatInput } from "@/components/chat/chatInput";
import { useSidebar } from "@/components/ui/sidebar";
import { dbMessageToUIMessage } from "@/utils/message";

export default function SearchPage() {
  const {
    currentConversationId,
    setCurrentConversationId,
    chatType,
    setChatType,
    input,
    setInput,
    initializeMessageCache,
    messageCache,
    setMessageCache,
  } = useChatStore();
  const router = useRouter();
  const conversationIdRef = useRef<number | null>(currentConversationId);
  const chatTypeRef = useRef(chatType);
  const { isMobile, setOpenMobile } = useSidebar();
  const latestUserMessageRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const prevConversationIdRef = useRef<number | null>(currentConversationId);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期化時に一括で会話とメッセージを取得してキャッシュに保存
  useEffect(() => {
    if (isInitialized || messageCache.size > 0) {
      return;
    }

    const initializeCache = async () => {
      try {
        const conversationsWithMessages =
          await readConversationsWithMessagesAction();
        const cache = new Map<number, UIMessage[]>();
        for (const conv of conversationsWithMessages) {
          cache.set(conv.id, conv.messages.map(dbMessageToUIMessage));
        }
        initializeMessageCache(cache);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize message cache:", error);
        setIsInitialized(true); // エラーでも初期化済みとして扱う
      }
    };

    initializeCache();
  }, [isInitialized, messageCache.size, initializeMessageCache]);

  // null→IDへの遷移時は再初期化を避けるため、useChatのidを安定させる
  const [stableChatId, setStableChatId] = useState<string>(() =>
    currentConversationId ? `${currentConversationId}` : `new`,
  );

  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    const currentId = currentConversationId;

    // null→数値への遷移の場合は、idを更新しない（再初期化を避ける）
    if (prevId === null && currentId !== null) {
      // idを更新しない
    } else {
      // それ以外の場合は通常通り更新
      setStableChatId(currentId ? `${currentId}` : `new`);
    }

    prevConversationIdRef.current = currentId;
  }, [currentConversationId]);

  // chatTypeRefを常に最新のchatTypeと同期
  useEffect(() => {
    chatTypeRef.current = chatType;
  }, [chatType]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        fetch: async (url, options) => {
          // 最新のchatTypeを使用してAPIエンドポイントを動的に決定
          const apiUrl = `/api/chat/${chatTypeRef.current}`;
          const body = JSON.parse(options?.body as string);
          body.conversationId = conversationIdRef.current;
          return fetch(apiUrl, {
            ...options,
            body: JSON.stringify(body),
          });
        },
      }),
    [], // 依存配列を空にして、transportを固定
  );

  const { messages, setMessages, sendMessage, status } = useChat({
    id: stableChatId,
    transport,
  });

  useConversationSync(setMessages, setCurrentConversationId);

  // conversationIdRefを常に最新のcurrentConversationIdと同期
  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // currentConversationIdがnullになった時にメッセージをクリア
  useEffect(() => {
    if (currentConversationId === null) {
      setMessages([]);
    }
  }, [currentConversationId, setMessages]);

  // メッセージが更新されたときにキャッシュも更新
  useEffect(() => {
    if (currentConversationId !== null && messages.length > 0) {
      setMessageCache(currentConversationId, messages);
    }
  }, [messages, currentConversationId, setMessageCache]);

  useEffect(() => {
    if (isMobile && currentConversationId) {
      setOpenMobile(false);
    }
  }, [currentConversationId, isMobile, setOpenMobile]);

  // 最新のユーザーメッセージを画面上部にスクロール
  useEffect(() => {
    // 新しいメッセージが追加された場合のみチェック
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];
      // 最後に追加されたメッセージがユーザーメッセージの場合のみスクロール
      if (lastMessage?.role === "user" && latestUserMessageRef.current) {
        latestUserMessageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
    // 現在のメッセージ数を保存
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    router.push("/search");
  };

  const handleSubmit = async (inputText: string) => {
    // 送信中または既に処理中の場合は早期リターン
    if (status !== "ready") {
      return;
    }

    const savedId = await saveMessageAction(
      conversationIdRef.current,
      inputText,
      "user",
    );
    conversationIdRef.current = savedId;
    setCurrentConversationId(savedId);
    await sendMessage({ text: inputText });
  };

  // 最新のユーザーメッセージのインデックスを見つける
  const latestUserMessageIndex = messages.reduce(
    (latestIndex, message, index) => {
      return message.role === "user" ? index : latestIndex;
    },
    -1,
  );

  return (
    <div className="flex flex-col w-full h-full">
      <ChatHeader
        chatType={chatType}
        onChatTypeChange={setChatType}
        onNewChat={handleClearChat}
      />
      <div className="p-2 flex-1 flex sticky top-24 flex-col gap-6 mb-36">
        {messages.map((message, index) => (
          <div
            key={message.id}
            ref={index === latestUserMessageIndex ? latestUserMessageRef : null}
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
    </div>
  );
}
