import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { UIMessage } from "ai";
import { readMessagesAction } from "@/app/(main)/search/actions";
import { dbMessageToUIMessage } from "@/utils/message";

export function useConversationSync(
  setMessages: (messages: UIMessage[]) => void,
  setCurrentConversationId: (id: number | null) => void,
  status?: "ready" | "streaming" | "error" | "awaiting_message",
  stop?: () => void,
) {
  const searchParams = useSearchParams();
  const prevConversationIdRef = useRef<number | null>(null);
  const statusRef = useRef(status);
  const stopRef = useRef(stop);

  // statusとstopをrefで保持して、最新の値を常に参照できるようにする
  useEffect(() => {
    statusRef.current = status;
    stopRef.current = stop;
  }, [status, stop]);

  useEffect(() => {
    const conversationIdParam = searchParams.get("c");
    const conversationId = conversationIdParam
      ? Number(conversationIdParam)
      : null;

    // 会話IDが変更された場合のみ処理
    if (prevConversationIdRef.current === conversationId) {
      return;
    }

    const prevConversationId = prevConversationIdRef.current;
    prevConversationIdRef.current = conversationId;

    // ストリーミング中に会話を切り替える場合は、ストリーミングを停止
    if (statusRef.current === "streaming" && stopRef.current) {
      stopRef.current();
    }

    if (!conversationId || Number.isNaN(conversationId)) {
      setCurrentConversationId(null);
      setMessages([]);
      return;
    }

    setCurrentConversationId(conversationId);

    const loadMessages = async () => {
      try {
        const dbMessages = await readMessagesAction(conversationId);
        setMessages(dbMessages.map(dbMessageToUIMessage));
      } catch (error) {
        console.error("Failed to load messages:", error);
        // 会話が存在しない場合（削除された場合など）はメッセージをクリア
        setMessages([]);
        setCurrentConversationId(null);
      }
    };

    // ストリーミング中でない場合、またはストリーミングを停止した後にメッセージを読み込む
    // ストリーミング停止の処理が非同期の可能性があるため、少し遅延させる
    if (statusRef.current === "streaming" && stopRef.current) {
      // ストリーミング停止後にメッセージを読み込む
      setTimeout(() => {
        loadMessages();
      }, 100);
    } else {
      loadMessages();
    }
  }, [searchParams, setMessages, setCurrentConversationId]);
}
