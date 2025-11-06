import { createClient } from "@/utils/supabase/server";
import { getUser } from "../auth/user";

export interface DbMessage {
  id: number;
  content: string;
  role: "user" | "assistant" | "system";
}

export async function createConversation(title: string) {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ title, user_id: user.id })
    .select()
    .single();
  if (error) {
    console.error(error);
    throw new Error("Failed to create conversation");
  }
  return data;
}

export async function readConversations() {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("conversations")
    .select()
    .eq("user_id", user.id)
    .eq("is_deleted", false);
  if (error) {
    console.error(error);
    throw new Error("Failed to read conversations");
  }
  return data;
}

export async function addMessage(
  conversation_id: number | null,
  message: string,
  role: string,
) {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation_id || null,
      content: message,
      role,
      user_id: user.id,
    })
    .select()
    .single();
  if (error) {
    console.error(error);
    throw new Error("Failed to add message");
  }
  return data;
}

export async function readMessages(
  conversation_id: number,
): Promise<DbMessage[]> {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("conversation_id", conversation_id)
    .eq("user_id", user.id)
    .eq("is_deleted", false);
  if (error) {
    console.error(error);
    throw new Error("Failed to read messages");
  }
  const messages: DbMessage[] = data.map((message) => ({
    id: message.id,
    content: message.content,
    role: (message.role as "user" | "assistant" | "system") ?? "assistant",
  }));
  return messages;
}

export interface ConversationWithMessages {
  id: number;
  title: string;
  created_at: string;
  messages: DbMessage[];
}

export async function readConversationsWithMessages(): Promise<
  ConversationWithMessages[]
> {
  const supabase = await createClient();
  const user = await getUser();

  // 会話一覧を取得
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select()
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (conversationsError) {
    console.error(conversationsError);
    throw new Error("Failed to read conversations");
  }

  if (!conversations || conversations.length === 0) {
    return [];
  }

  // すべての会話IDを取得
  const conversationIds = conversations.map((conv) => conv.id);

  // すべてのメッセージを一括取得
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select()
    .in("conversation_id", conversationIds)
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error(messagesError);
    throw new Error("Failed to read messages");
  }

  // メッセージを会話IDごとにグループ化
  const messagesByConversation = new Map<number, DbMessage[]>();
  if (messages) {
    for (const message of messages) {
      const conversationId = message.conversation_id as number;
      if (!messagesByConversation.has(conversationId)) {
        messagesByConversation.set(conversationId, []);
      }
      messagesByConversation.get(conversationId)!.push({
        id: message.id,
        content: message.content,
        role: (message.role as "user" | "assistant" | "system") ?? "assistant",
      });
    }
  }

  // 会話とメッセージを結合
  return conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    created_at: conversation.created_at,
    messages: messagesByConversation.get(conversation.id) || [],
  }));
}

export async function updateConversation(
  title: string,
  conversation_id: number,
) {
  const supabase = await createClient();
  const user = await getUser();
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversation_id)
    .eq("user_id", user.id);
  if (error) {
    console.error(error);
    throw new Error("Failed to update conversation");
  }
}

export async function deleteConversation(conversation_id: number) {
  const supabase = await createClient();
  const user = await getUser();

  const { error: messagesError } = await supabase
    .from("messages")
    .update({ is_deleted: true })
    .eq("conversation_id", conversation_id)
    .eq("user_id", user.id)
    .eq("is_deleted", false);
  if (messagesError) {
    console.error(messagesError);
    throw new Error("Failed to delete messages");
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({ is_deleted: true })
    .eq("id", conversation_id)
    .eq("user_id", user.id)
    .eq("is_deleted", false);
  if (conversationError) {
    console.error(conversationError);
    throw new Error("Failed to delete conversation");
  }
}

export async function deleteAllConversations() {
  const supabase = await createClient();
  const user = await getUser();

  const { error: messagesError } = await supabase
    .from("messages")
    .update({ is_deleted: true })
    .eq("user_id", user.id)
    .eq("is_deleted", false);
  if (messagesError) {
    console.error(messagesError);
    throw new Error("Failed to delete all messages");
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({ is_deleted: true })
    .eq("user_id", user.id)
    .eq("is_deleted", false);
  if (conversationError) {
    console.error(conversationError);
    throw new Error("Failed to delete all conversations");
  }
}
