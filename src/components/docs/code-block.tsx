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
        // Use custom variable for background, inherit border from container
        "max-h-[400px] overflow-x-auto rounded-md p-3 font-mono text-xs shadow-inner",
        "bg-[hsl(var(--docs-code-bg))]", // Use CSS variable for background
        "text-foreground/90 dark:text-foreground/80", // Slightly adjust text color
        `language-${language}`, // Class for potential syntax highlighters
        className // Allow overrides
      )}
      {...props}
    >
      <code>{code}</code>
    </pre>
  );
}
