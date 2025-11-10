import { create } from "zustand";
import { readConversationsAction } from "@/app/(main)/search/actions";

export interface Message {
  role: "user" | "assistant" | "developer";
  content: string;
}
export interface UIMessage {
  id: string;
  content: string;
  isUser: boolean;
}
export const chatOptions = ["search", "fast", "fast-code", "coding"] as const;
export type ChatType = (typeof chatOptions)[number];

export interface Conversation {
  id: number;
  title: string;
}

interface ChatStore {
  input: string;
  setInput: (input: string) => void;

  messages: UIMessage[];
  addMessage: (message: UIMessage) => void;
  clearMessages: () => void;

  isSending: boolean;
  setIsSending: (isSending: boolean) => void;

  isConfirmingMemo: boolean;
  setIsConfirmingMemo: (isConfirmingMemo: boolean) => void;

  isAdding: boolean;
  setIsAdding: (isAdding: boolean) => void;

  isIncludeContext: boolean;
  setIsIncludeContext: (isIncludeContext: boolean) => void;

  currentConversationId: number | null;
  setCurrentConversationId: (id: number | null) => void;

  chatType: ChatType;
  setChatType: (chatType: ChatType) => void;

  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  removeConversation: (id: number) => void;
  clearConversations: () => void;
  refreshConversations: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set) => ({
  input: "",
  setInput: (input) => set({ input }),

  messages: [],
  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },
  clearMessages: () => set({ messages: [] }),

  isSending: false,
  setIsSending: (isSending) => set({ isSending }),

  isConfirmingMemo: false,
  setIsConfirmingMemo: (isConfirmingMemo) => set({ isConfirmingMemo }),

  isAdding: false,
  setIsAdding: (isAdding) => set({ isAdding }),

  isIncludeContext: false,
  setIsIncludeContext: (isIncludeContext) => set({ isIncludeContext }),

  currentConversationId: null,
  setCurrentConversationId: (id: number | null) =>
    set({ currentConversationId: id }),

  chatType: chatOptions[0],
  setChatType: (chatType: ChatType) => set({ chatType }),

  conversations: [],
  setConversations: (conversations) => set({ conversations }),

  removeConversation: (id: number) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
    })),

  clearConversations: () => set({ conversations: [] }),

  refreshConversations: async () => {
    try {
      const conversations = await readConversationsAction();
      set({ conversations });
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    }
  },
}));
