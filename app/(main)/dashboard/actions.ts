"use server";

import {
  createFolder,
  readFolders,
  updateFolder,
  deleteFolder,
  updateFolderPinned,
} from "@/lib/db/folder";
import {
  createFile,
  deleteFile,
  readFiles,
  readFilesByParentIds,
  updateFile,
  incrementFilePages,
  renumberFilePages,
  reorderFiles,
} from "@/lib/db/file";
import { revalidatePath, revalidateTag } from "next/cache";
export async function createFolderAction(name: string) {
  try {
    const folder = await createFolder(name);
    revalidatePath("/dashboard");
    revalidateTag("folders");
    return folder;
  } catch (error) {
    console.error("Error creating folder:", error);
    throw new Error("Failed to create folder");
  }
}

export async function readFoldersAction() {
  try {
    const folders = await readFolders();
    const folderIds = folders.map((folder) => folder.id);
    const filesByFolder = new Map<
      number,
      Awaited<ReturnType<typeof readFiles>>
    >();

    if (folderIds.length > 0) {
      const files = await readFilesByParentIds(folderIds);

      files.forEach((file) => {
        const parentFiles = filesByFolder.get(file.parent_id) ?? [];
        parentFiles.push({
          id: file.id,
          title: file.title,
          content: file.content,
          page: file.page,
        });
        filesByFolder.set(file.parent_id, parentFiles);
      });
    }

    const foldersWithFiles = folders.map((folder) => ({
      ...folder,
      files: (filesByFolder.get(folder.id) ?? []).sort(
        (a, b) => (a.page ?? 0) - (b.page ?? 0),
      ),
    }));
    // Sort: pinned first, then by name
    foldersWithFiles.sort((a, b) => {
      const ap = a.is_pinned ? 1 : 0;
      const bp = b.is_pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return a.name.localeCompare(b.name);
    });
    return foldersWithFiles;
  } catch (error) {
    console.error("Error getting folders:", error);
    throw new Error("Failed to get folders");
  }
}

export async function updateFolderAction(id: number, name: string) {
  try {
    const folder = await updateFolder(id, name);
    revalidatePath("/dashboard");
    revalidateTag("folders");
    return folder;
  } catch (error) {
    console.error("Error updating folder:", error);
    throw new Error("Failed to update folder");
  }
}

export async function toggleFolderPinnedAction(id: number, isPinned: boolean) {
  try {
    const folder = await updateFolderPinned(id, isPinned);
    revalidatePath("/dashboard");
    revalidateTag("folders");
    return folder;
  } catch (error) {
    console.error("Error toggling folder pinned:", error);
    throw new Error("Failed to toggle folder pinned state");
  }
}

export async function deleteFolderAction(id: number) {
  try {
    const folder = await deleteFolder(id);
    revalidatePath("/dashboard");
    revalidateTag("folders");
    revalidateTag("files");
    return folder;
  } catch (error) {
    console.error("Error deleting folder:", error);
    throw new Error("Failed to delete folder");
  }
}

export async function createFileAction(parent_id: number, page: number) {
  try {
    const file = await createFile(parent_id, page);
    revalidatePath("/dashboard");
    revalidateTag("files");
    return file;
  } catch (error) {
    console.error("Error creating file:", error);
    throw new Error("Failed to create file");
  }
}

export async function createFileAfterCurrentAction(
  parent_id: number,
  currentPage: number,
) {
  try {
    await incrementFilePages(parent_id, currentPage + 1);

    const file = await createFile(parent_id, currentPage + 1);
    revalidatePath("/dashboard");
    revalidateTag("files");
    return file;
  } catch (error) {
    console.error("Error in createFileAfterCurrentAction:", error);
    throw new Error("Failed to create file after current");
  }
}

export async function readFilesAction(parent_id: number) {
  try {
    const files = await readFiles(parent_id);
    return files;
  } catch (error) {
    console.error("Error getting files:", error);
    throw new Error("Failed to get files");
  }
}

export async function updateFileAction(
  id: number,
  title: string,
  content: string,
) {
  try {
    const file = await updateFile(id, title, content);
    revalidatePath("/dashboard");
    revalidateTag("files");
    return file;
  } catch (error) {
    console.error("Error updating file:", error);
    throw new Error("Failed to update file");
  }
}

export async function deleteFileAction(
  id: number,
  parent_id: number,
  page: number,
) {
  try {
    const file = await deleteFile(id);
    await renumberFilePages(parent_id, page);
    revalidatePath("/dashboard");
    revalidateTag("files");
    return file;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
}

export async function reorderFilesAction(
  parent_id: number,
  orderedIds: number[],
) {
  try {
    await reorderFiles(parent_id, orderedIds);
    revalidatePath("/dashboard");
    revalidateTag("files");
  } catch (error) {
    console.error("Error reordering files:", error);
    throw new Error("Failed to reorder files");
  }
}

export async function editFileAction(
  id: number,
  title: string,
  content: string,
) {
  try {
    const file = await updateFile(id, title, content);
    revalidatePath("/dashboard");
    revalidateTag("files");
    return file;
  } catch (error) {
    console.error("Error editing file:", error);
    throw new Error("Failed to edit file");
  }
}
