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
    .select("id, title, created_at, updated_at")
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
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false });
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
    .select("id, conversation_id, content, role, created_at")
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
    .select("id, content, role")
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
