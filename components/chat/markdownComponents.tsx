import { type Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
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
    <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </td>
  ),
  ul: ({ children }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
  ),
  li: ({ children }) => <li>{children}</li>,
  pre: ({ children }) => (
    <pre className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm overflow-x-auto whitespace-pre w-full min-w-0">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
      {children}
    </code>
  ),
  small: ({ children }) => (
    <small className="text-sm leading-none font-medium">{children}</small>
  ),
};
