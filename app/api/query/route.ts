import { xai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createFileWithContent } from "@/lib/db/file";

export async function POST(req: Request) {
  const { prompt, folderId }: { prompt: string; folderId?: number } =
    await req.json();

  // folderIdがない場合は早期リターンでエラー
  if (!folderId) {
    return NextResponse.json(
      { error: "folderId is required" },
      { status: 400 },
    );
  }

  try {
    const { text } = await generateText({
      model: xai.chat("grok-4-fast-reasoning"),
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      providerOptions: {
        xai: {
          searchParameters: {
            mode: "on", // 'auto', 'on', or 'off'
            returnCitations: true,
            maxSearchResults: 5,
          },
        },
      },
    });
    const content = `-> ${prompt} <-\n\n${text}`;

    const newFile = await createFileWithContent(
      folderId,
      `Query ${new Date().toLocaleString("ja-JP")}`,
      content,
    );

    return NextResponse.json({
      text,
      fileId: newFile.id,
      page: newFile.page,
    });
  } catch (error) {
    console.error("query route failed", error);
    return NextResponse.json(
      { error: "query processing failed" },
      { status: 500 },
    );
  }
}
