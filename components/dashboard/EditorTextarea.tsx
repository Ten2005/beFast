import { Textarea } from "@/components/ui/textarea";
import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "@/components/chat/markdownComponents";

type EditorTextareaProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
  isEditMode: boolean;
};

export const EditorTextarea = forwardRef<
  HTMLTextAreaElement,
  EditorTextareaProps
>(({ value, onChange, disabled, isEditMode }, ref) => {
  if (isEditMode) {
    return (
      <Textarea
        ref={ref}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="
          w-full flex-1 h-fit min-h-[calc(100vh-5rem)]
          border-none shadow-none focus:border-none focus-visible:ring-0"
      />
    );
  }

  return (
    <div className="w-full flex-1 h-fit min-h-[calc(100vh-5rem)] px-3 py-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {value || ""}
      </ReactMarkdown>
    </div>
  );
});

EditorTextarea.displayName = "EditorTextarea";
