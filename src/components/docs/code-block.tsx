import type * as React from 'react';
import { cn } from "@/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string;
  language?: string; // Optional language for future syntax highlighting libraries
}

export function CodeBlock({ code, language = 'plaintext', className, ...props }: CodeBlockProps) {
  return (
    <pre
      className={cn(
        "max-h-[400px] overflow-x-auto rounded-md border bg-background/50 p-3 font-mono text-xs text-foreground shadow-inner dark:bg-black/30",
        `language-${language}`, // Class for potential syntax highlighters
        className
      )}
      {...props}
    >
      <code>{code}</code>
    </pre>
  );
}
