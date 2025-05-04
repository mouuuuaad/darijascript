
'use client'; // Add 'use client' if using hooks like useState for copy functionality

import type * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Import Button if adding copy button
import { Check, Clipboard } from "lucide-react"; // Icons for copy button
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string;
  language?: string; // Optional language for future syntax highlighting libraries
}

export function CodeBlock({ code, language = 'plaintext', className, ...props }: CodeBlockProps) {
   const [hasCopied, setHasCopied] = useState(false);
   const { toast } = useToast();

   const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000); // Reset icon after 2 seconds
        toast({
          title: "Copied!",
          description: "Example code copied to clipboard.",
        });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
       toast({
          title: "Copy Failed",
          description: "Could not copy code to clipboard.",
           variant: "destructive",
        });
    });
  }, [code, toast]);


  return (
     <div className="relative group"> {/* Added relative positioning for button */}
        <pre
          className={cn(
            // Use custom variable for background, inherit border from container
            "max-h-[400px] overflow-x-auto rounded-lg p-4 font-mono text-sm shadow-inner", // Increased padding
            "bg-[hsl(var(--docs-code-bg))]", // Use NEW CSS variable for background
             "border", // Add border explicitly
             "border-[hsl(var(--docs-code-border))]", // Use NEW CSS variable for border
            "text-foreground/90 dark:text-foreground/80", // Slightly adjust text color
            `language-${language}`, // Class for potential syntax highlighters
            className // Allow overrides
          )}
          {...props}
        >
          <code>{code}</code>
        </pre>
        {/* Copy Button */}
        <Button
           size="icon"
           variant="ghost"
           className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground" // Adjust styling as needed
           onClick={copyToClipboard}
           aria-label="Copy code to clipboard"
         >
           {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
         </Button>
     </div>
  );
}
