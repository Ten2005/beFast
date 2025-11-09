import { createClient } from "@/utils/supabase/server";
import { getUser } from "../auth/user";

export async function createFile(parent_id: number, page: number) {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("file")
    .insert({
      user_id: user.id,
      parent_id,
      page,
      title: "None",
    })
    .select()
    .single();
  if (error) {
    console.error(error);
    throw new Error("Failed to create file");
  }
  return data;
}

export async function createFileWithContent(
  parent_id: number,
  title: string,
  content: string,
) {
  const supabase = await createClient();
  const user = await getUser();

  const files = await readFiles(parent_id);
  const lastPage =
    files.length > 0 ? Math.max(...files.map((f) => f.page)) : -1;
  const newPage = lastPage + 1;

  const { data, error } = await supabase
    .from("file")
    .insert({
      user_id: user.id,
      parent_id,
      page: newPage,
      title,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to create file with content");
  }
  return data;
}

export async function readFiles(parent_id: number) {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("file")
    .select("id, title, content, page")
    .eq("user_id", user.id)
    .eq("parent_id", parent_id)
    .eq("is_deleted", false)
    .order("page", { ascending: true });
  if (error) {
    console.error(error);
    throw new Error("Failed to get files");
  }
  return data.map((file) => ({
    ...file,
    title: file.title || "None",
    content: file.content || "",
  }));
}

export async function updateFile(id: number, title: string, content: string) {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("file")
    .update({ title, content })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error(error);
    throw new Error("Failed to update file");
  }
  return data;
}

export async function deleteFile(id: number) {
  const supabase = await createClient();
  const user = await getUser();
  const { data, error } = await supabase
    .from("file")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error(error);
    throw new Error("Failed to delete file");
  }
  return data;
}

export async function incrementFilePages(parent_id: number, fromPage: number) {
  const supabase = await createClient();
  const user = await getUser();

  const { data: targetFiles, error: fetchError } = await supabase
    .from("file")
    .select("id, page")
    .eq("user_id", user.id)
    .eq("parent_id", parent_id)
    .eq("is_deleted", false)
    .gte("page", fromPage);

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    throw new Error("Failed to fetch files for page increment");
  }

  if (!targetFiles || targetFiles.length === 0) {
    console.log("No files to increment");
    return [];
  }

  targetFiles.map(async (file) => {
    const { data, error } = await supabase
      .from("file")
      .update({ page: file.page + 1 })
      .eq("id", file.id)
      .eq("user_id", user.id);

    if (error) {
      console.error(`Failed to update file ${file.id}:`, error);
      throw new Error(`Failed to update file ${file.id}`);
    }

    return data;
  });
}

export async function renumberFilePages(
  parent_id: number,
  deletedPage: number,
) {
  const supabase = await createClient();
  const user = await getUser();

  const { data: targetFiles, error: fetchError } = await supabase
    .from("file")
    .select("id, page")
    .eq("user_id", user.id)
    .eq("parent_id", parent_id)
    .eq("is_deleted", false)
    .gt("page", deletedPage)
    .order("page", { ascending: true });

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    throw new Error("Failed to fetch files for renumbering");
  }

  if (!targetFiles || targetFiles.length === 0) {
    return [];
  }

  await Promise.all(
    targetFiles.map(async (file) => {
      const { error } = await supabase
        .from("file")
        .update({ page: file.page - 1 })
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(`Failed to renumber file ${file.id}:`, error);
        throw new Error(`Failed to renumber file ${file.id}`);
      }
    }),
  );
}

export async function reorderFiles(parent_id: number, orderedIds: number[]) {
  const supabase = await createClient();
  const user = await getUser();

  const updates = await Promise.all(
    orderedIds.map(async (id, index) => {
      const { error } = await supabase
        .from("file")
        .update({ page: index })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("parent_id", parent_id);
      if (error) {
        console.error(`Failed to set page for file ${id}:`, error);
        throw new Error(`Failed to reorder files`);
      }
      return true;
    }),
  );

  return updates;
}
