import { create } from "zustand";
import { readFoldersAction } from "@/app/(main)/dashboard/actions";

export interface UsedFolder {
  id: number;
  name: string;
  is_pinned: boolean;
}

export interface UsedFile {
  id: number;
  title: string;
  content: string;
  page: number;
}

type FolderWithFiles = UsedFolder & { files: UsedFile[] };

interface SidebarState {
  newFolderName: string;
  setNewFolderName: (newFolderName: string) => void;

  currentFolder: UsedFolder | undefined;
  setCurrentFolder: (currentFolder: UsedFolder | undefined) => void;

  folders: UsedFolder[];
  setFolders: (folders: UsedFolder[]) => void;

  currentFiles: UsedFile[];
  setCurrentFiles: (currentFiles: UsedFile[]) => void;
  updateFileContent: (fileId: number, content: string) => void;
  updateFileTitle: (fileId: number, title: string) => void;

  insertFileAfterCurrent: (newFile: UsedFile, currentPage: number) => void;

  filesCache: Record<number, UsedFile[]>;
  cacheFiles: (folderId: number, files: UsedFile[]) => void;

  isEditingFolder: boolean;
  setIsEditingFolder: (isEditingFolder: boolean) => void;

  isDialogOpen: boolean;
  setIsDialogOpen: (isDialogOpen: boolean) => void;

  isCreatingFolder: boolean;
  setIsCreatingFolder: (isCreatingFolder: boolean) => void;
  getFilesByFolder: (folderId: number) => UsedFile[];

  // Pin state management
  pinningFolders: Set<number>;
  setPinningFolder: (folderId: number, isPinning: boolean) => void;
  toggleFolderPin: (folderId: number) => void;
  revertFolderPin: (folderId: number) => void;

  // Refresh folders from server
  refreshFolders: () => Promise<void>;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  newFolderName: "",
  setNewFolderName: (newFolderName) => set({ newFolderName }),

  currentFolder: undefined,
  setCurrentFolder: (currentFolder) => set({ currentFolder }),

  folders: [],
  setFolders: (folders) => set({ folders }),

  currentFiles: [],
  setCurrentFiles: (currentFiles) =>
    set((state) => ({
      currentFiles,
      filesCache: state.currentFolder
        ? { ...state.filesCache, [state.currentFolder.id]: currentFiles }
        : state.filesCache,
    })),

  updateFileContent: (fileId: number, content: string) =>
    set((state) => {
      const updatedFiles = state.currentFiles.map((file) =>
        file.id === fileId ? { ...file, content } : file,
      );
      return {
        currentFiles: updatedFiles,
        filesCache: state.currentFolder
          ? { ...state.filesCache, [state.currentFolder.id]: updatedFiles }
          : state.filesCache,
      };
    }),

  updateFileTitle: (fileId: number, title: string) =>
    set((state) => {
      const updatedFiles = state.currentFiles.map((file) =>
        file.id === fileId ? { ...file, title } : file,
      );
      return {
        currentFiles: updatedFiles,
        filesCache: state.currentFolder
          ? { ...state.filesCache, [state.currentFolder.id]: updatedFiles }
          : state.filesCache,
      };
    }),

  insertFileAfterCurrent: (newFile, currentPage) =>
    set((state) => {
      const updatedFiles = state.currentFiles.map((file) =>
        file.page > currentPage ? { ...file, page: file.page + 1 } : file,
      );

      updatedFiles.push(newFile);
      const sortedFiles = updatedFiles.sort((a, b) => a.page - b.page);

      return {
        currentFiles: sortedFiles,
        filesCache: state.currentFolder
          ? { ...state.filesCache, [state.currentFolder.id]: sortedFiles }
          : state.filesCache,
      };
    }),

  isEditingFolder: false,
  setIsEditingFolder: (isEditingFolder) => set({ isEditingFolder }),

  isDialogOpen: false,
  setIsDialogOpen: (isDialogOpen) => set({ isDialogOpen }),

  isCreatingFolder: false,
  setIsCreatingFolder: (isCreatingFolder) => set({ isCreatingFolder }),

  filesCache: {},
  cacheFiles: (folderId, files) =>
    set((state) => ({
      filesCache: { ...state.filesCache, [folderId]: files },
    })),

  getFilesByFolder: (folderId: number) => {
    const { filesCache } = get();
    return filesCache[folderId] || [];
  },

  pinningFolders: new Set<number>(),

  setPinningFolder: (folderId: number, isPinning: boolean) =>
    set((state) => {
      const newPinningFolders = new Set(state.pinningFolders);
      if (isPinning) {
        newPinningFolders.add(folderId);
      } else {
        newPinningFolders.delete(folderId);
      }
      return { pinningFolders: newPinningFolders };
    }),

  toggleFolderPin: (folderId: number) =>
    set((state) => {
      const updatedFolders = state.folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, is_pinned: !folder.is_pinned }
          : folder,
      );

      const sortedFolders = updatedFolders.sort((a, b) => {
        const ap = a.is_pinned ? 1 : 0;
        const bp = b.is_pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return a.name.localeCompare(b.name);
      });

      const updatedCurrentFolder =
        state.currentFolder?.id === folderId
          ? {
              ...state.currentFolder,
              is_pinned: !state.currentFolder.is_pinned,
            }
          : state.currentFolder;

      return {
        folders: sortedFolders,
        currentFolder: updatedCurrentFolder,
      };
    }),

  revertFolderPin: (folderId: number) =>
    set((state) => {
      const updatedFolders = state.folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, is_pinned: !folder.is_pinned }
          : folder,
      );

      const sortedFolders = updatedFolders.sort((a, b) => {
        const ap = a.is_pinned ? 1 : 0;
        const bp = b.is_pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return a.name.localeCompare(b.name);
      });

      const updatedCurrentFolder =
        state.currentFolder?.id === folderId
          ? {
              ...state.currentFolder,
              is_pinned: !state.currentFolder.is_pinned,
            }
          : state.currentFolder;

      return {
        folders: sortedFolders,
        currentFolder: updatedCurrentFolder,
      };
    }),

  refreshFolders: async () => {
    try {
      const foldersWithFiles: FolderWithFiles[] = await readFoldersAction();
      const folders: UsedFolder[] = foldersWithFiles.map(
        ({ files, ...folder }) => folder,
      );

      set((state) => {
        // Update folders
        const updatedFolders = folders;

        // Update files cache
        const updatedFilesCache = { ...state.filesCache };
        foldersWithFiles.forEach((folder) => {
          updatedFilesCache[folder.id] = folder.files;
        });

        // Update current folder if it still exists
        const updatedCurrentFolder =
          updatedFolders.find((f) => f.id === state.currentFolder?.id) ||
          state.currentFolder;

        // Update current files if current folder still exists
        const updatedCurrentFiles = updatedCurrentFolder
          ? updatedFilesCache[updatedCurrentFolder.id] || []
          : [];

        return {
          folders: updatedFolders,
          filesCache: updatedFilesCache,
          currentFolder: updatedCurrentFolder,
          currentFiles: updatedCurrentFiles,
        };
      });
    } catch (error) {
      console.error("Failed to refresh folders:", error);
    }
  },
}));
