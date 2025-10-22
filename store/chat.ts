import { create } from "zustand";

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
}));
