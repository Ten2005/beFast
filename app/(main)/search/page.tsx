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
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "sonner";

export default function SearchPage() {
  const {
    currentConversationId,
    setCurrentConversationId,
    chatType,
    setChatType,
    input,
    setInput,
  } = useChatStore();
  const router = useRouter();
  const conversationIdRef = useRef<number | null>(currentConversationId);
  const chatTypeRef = useRef(chatType);
  const { isMobile, setOpenMobile } = useSidebar();
  const latestUserMessageRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const prevConversationIdRef = useRef<number | null>(currentConversationId);
  const errorHandledRef = useRef(false);
  const prevErrorRef = useRef<Error | null>(null);

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

  const { messages, setMessages, sendMessage, status, error, stop } = useChat({
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

  // エラーハンドリング: エラー発生時にトーストを表示し、状態をリセット
  useEffect(() => {
    const hadError = prevErrorRef.current !== null;
    const hasError = error !== null;

    if (hasError && !hadError) {
      // エラーが新しく発生した場合
      errorHandledRef.current = true;
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "会話の生成中にエラーが発生しました";
      toast.error(errorMessage, {
        description: "もう一度お試しください",
      });
      // エラー発生時にストリーミングを停止
      stop();
    }

    prevErrorRef.current = error;
  }, [error, stop]);

  // エラーが解消された後、statusが"ready"に戻らない場合にリセット
  useEffect(() => {
    if (!errorHandledRef.current || error !== null) return;

    // エラーが解消されたが、statusが"ready"に戻っていない場合
    if (status !== "ready") {
      // useChatを再初期化してstatusをリセット
      // メッセージは現在のmessagesから取得（再初期化時に保持）
      const currentId = stableChatId;
      const resetId = `${currentId}-reset-${Date.now()}`;
      setStableChatId(resetId);
      // 次のレンダリングサイクルで元のIDに戻す（メッセージはuseChatが自動的に保持）
      setTimeout(() => {
        setStableChatId(currentId);
        errorHandledRef.current = false;
      }, 0);
    } else {
      errorHandledRef.current = false;
    }
  }, [error, status, stableChatId]);

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
