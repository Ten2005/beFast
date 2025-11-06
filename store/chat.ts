import { create } from "zustand";
import type { UIMessage as AIUIMessage } from "ai";

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

  // メッセージキャッシュ（会話ID -> AIUIMessage[]）
  messageCache: Map<number, AIUIMessage[]>;
  setMessageCache: (conversationId: number, messages: AIUIMessage[]) => void;
  getCachedMessages: (conversationId: number) => AIUIMessage[] | undefined;
  clearMessageCache: () => void;
  removeMessageCache: (conversationId: number) => void;
  initializeMessageCache: (cache: Map<number, AIUIMessage[]>) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
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

  messageCache: new Map<number, UIMessage[]>(),
  setMessageCache: (conversationId, messages) => {
    set((state) => {
      const newCache = new Map(state.messageCache);
      newCache.set(conversationId, messages);
      return { messageCache: newCache };
    });
  },
  getCachedMessages: (conversationId) => {
    return get().messageCache.get(conversationId);
  },
  clearMessageCache: () => {
    set({ messageCache: new Map() });
  },
  removeMessageCache: (conversationId) => {
    set((state) => {
      const newCache = new Map(state.messageCache);
      newCache.delete(conversationId);
      return { messageCache: newCache };
    });
  },
  initializeMessageCache: (cache) => {
    set({ messageCache: cache });
  },
}));
