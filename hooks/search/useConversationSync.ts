import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { UIMessage } from "ai";
import { readMessagesAction } from "@/app/(main)/search/actions";
import { dbMessageToUIMessage } from "@/utils/message";

export function useConversationSync(
  setMessages: (messages: UIMessage[]) => void,
  setCurrentConversationId: (id: number | null) => void,
) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const conversationIdParam = searchParams.get("c");
    const conversationId = conversationIdParam
      ? Number(conversationIdParam)
      : null;

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

    loadMessages();
  }, [searchParams, setMessages, setCurrentConversationId]);
}
