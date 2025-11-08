import { type Components } from "react-markdown";
import { Checkbox } from "@/components/ui/checkbox";

export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance break-words">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 break-words">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight break-words">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight break-words">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="leading-7 break-words [&:not(:first-child)]:mt-6">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic break-words">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto w-full my-4">
      <table className="border-collapse border border-border w-full min-w-full">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tfoot: ({ children }) => <tfoot>{children}</tfoot>,
  tr: ({ children }) => (
    <tr className="even:bg-muted m-0 border-t p-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="border px-4 py-2 text-left font-bold break-words [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border px-4 py-2 text-left break-words [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </td>
  ),
  ul: ({ children, className }) => {
    const isTaskList = className?.includes("contains-task-list");
    return (
      <ul
        className={
          isTaskList
            ? "my-6 ml-6 overflow-x-hidden [&>li]:mt-2"
            : "my-6 ml-6 list-disc overflow-x-hidden [&>li]:mt-2"
        }
      >
        {children}
      </ul>
    );
  },
  ol: ({ children }) => {
    return (
      <ol className="my-6 ml-6 list-decimal overflow-x-hidden [&>li]:mt-2">
        {children}
      </ol>
    );
  },
  li: ({ children }) => {
    return <li className="flex items-center min-w-0 break-words">{children}</li>;
  },
  input: ({ type, checked, disabled, ...props }) => {
    if (type === "checkbox") {
      return (
        <Checkbox checked={checked} disabled={disabled} className="mr-2" />
      );
    }
    // Return a plain input for other types to avoid type error
    return <input type={type} {...props} />;
  },
  pre: ({ children }) => (
    <pre className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm overflow-x-auto whitespace-pre w-full min-w-0">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm break-words">
      {children}
    </code>
  ),
  small: ({ children }) => (
    <small className="text-sm leading-none font-medium break-words">{children}</small>
  ),
};
