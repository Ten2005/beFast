import { create } from "zustand";
import { UsedFile } from "@/store/sidebar";
import { COMMAND_MODEL_OPTIONS } from "@/constants/dashboard";

interface DashboardState {
  currentFile: UsedFile | undefined;
  setCurrentFile: (currentFile: UsedFile | undefined) => void;

  isEditingTitle: boolean;
  setIsEditingTitle: (isEditingTitle: boolean) => void;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  autoSaveTimeout: NodeJS.Timeout | null;
  setAutoSaveTimeout: (timeout: NodeJS.Timeout | null) => void;

  getAutoSaveState: () => {
    currentFile: UsedFile | undefined;
    autoSaveTimeout: NodeJS.Timeout | null;
  };

  commandModel: (typeof COMMAND_MODEL_OPTIONS)[number];
  setCommandModel: (
    commandModel: (typeof COMMAND_MODEL_OPTIONS)[number],
  ) => void;

  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  currentFile: undefined,
  setCurrentFile: (currentFile) => set({ currentFile }),

  isEditingTitle: false,
  setIsEditingTitle: (isEditingTitle) => set({ isEditingTitle }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  autoSaveTimeout: null,
  setAutoSaveTimeout: (timeout) => set({ autoSaveTimeout: timeout }),

  getAutoSaveState: () => {
    const { currentFile, autoSaveTimeout } = get();
    return { currentFile, autoSaveTimeout };
  },

  commandModel: "fast",
  setCommandModel: (commandModel) => set({ commandModel }),

  isEditMode: false,
  setIsEditMode: (isEditMode) => set({ isEditMode }),
}));
