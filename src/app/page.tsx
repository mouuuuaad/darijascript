
"use client";

import type * as React from 'react';
import { useState, useRef, useEffect } from 'react'; // Added useEffect
import Editor, { type Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Trash2, Info, Code, ExternalLink } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { interpret } from '@/lib/darijascript/interpreter';
import { setupDarijaScriptLanguage } from '@/lib/darijascript/monaco-config';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DarijaDocs } from '@/components/docs/darija-docs';
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [code, setCode] = useState(
`// Salam! Ktbo l code dyalkom hna f DarijaScript!
bdl message = "Mrehba bikom f ";
bdl language = "DarijaScript";

tbe3(message + language + "!");

// Loop Example (Douz)
bdl total = 0;
douz(bdl i = 1; i <= 5; i = i + 1) {
  total = total + i;
  tbe3("Iteration " + i + ", Total = " + total);
}
tbe3("Final Total: " + total);

// Function Example (Dala)
dala calculateArea(length, width) {
    ila (length <= 0 || width <= 0) {
        rmmi("Dimensions must be positive!"); // Throw error
    }
    rj3 length * width;
}

bdl area = calculateArea(10, 5);
tbe3("Area is: " + area);

// Trying invalid area calculation
jrb {
    bdl invalidArea = calculateArea(-5, 10);
    tbe3(invalidArea); // This won't run
} msk (errorMsg) {
    ghlat("Caught error: " + errorMsg); // Use ghlat for errors
} fakhr {
    tbe3("Calculation attempt finished.");
}

// --------
// Created with passion by MOUAAD IDOUFKIR
// --------
`); // Updated default code
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  // State to prevent hydration errors for browser-specific APIs
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Indicate component has mounted on client
  }, []);


  function handleEditorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupDarijaScriptLanguage(monaco); // Setup language configuration
    // Set theme and other options
    monaco.editor.setTheme('vs-dark'); // Keep dark theme for editor clarity
  }

  const runCode = () => {
    setError(null);
    setOutput([]); // Clear previous output
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      try {
        const result = interpret(currentCode);
        setOutput(result.output); // Assuming interpreter returns { output: string[] }
        if (result.error) {
          setError(result.error);
        }
      } catch (err: any) {
        // Catch errors thrown directly by the interpreter (less likely now)
        setError(`Kayn ghalat kbir: ${err.message || 'Machi mochkil, 3awed!'}`);
      }
    }
  };

  const clearOutput = () => {
    setOutput([]);
    setError(null);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-background to-blue-100/50 dark:from-background dark:to-blue-900/20">
        {/* Updated Header */}
        <header className="flex items-center justify-between p-3 border-b bg-card/90 backdrop-blur-sm text-card-foreground shadow-lg sticky top-0 z-20">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="w-7 h-7 text-primary" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold text-primary tracking-tight">
                    DarijaScript IDE
                </h1>
                 <Badge variant="secondary" className="text-xs w-fit font-mono tracking-wide">
                     By MOUAAD IDOUFKIR
                 </Badge>
            </div>
         </div>
          <div className="flex items-center space-x-2">
            {/* Docs Sheet - Keep Icon Simple */}
            <Sheet>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="border-muted-foreground/30 hover:bg-muted/80">
                        <Info className="w-5 h-5 text-secondary" />
                      </Button>
                   </SheetTrigger>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>DarijaScript Docs (L9awa3id)</p>
                 </TooltipContent>
               </Tooltip>
               <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl overflow-y-auto !p-0" side="left"> {/* Adjust width and padding */}
                 <SheetHeader className="p-6 border-b bg-muted/30">
                   <SheetTitle className="text-2xl font-bold text-primary">📖 DarijaScript Documentation</SheetTitle>
                   <SheetDescription className="text-base">
                     Your comprehensive guide to coding in DarijaScript. Explore the language features below.
                   </SheetDescription>
                 </SheetHeader>
                 {/* Make ScrollArea cover the remaining height */}
                 <ScrollArea className="h-[calc(100vh-110px)]"> {/* Adjust height dynamically */}
                   <DarijaDocs />
                 </ScrollArea>
               </SheetContent>
             </Sheet>

            {/* Clear Output Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={clearOutput} className="border-muted-foreground/30 hover:bg-muted/80">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Output (Msse7 Natija)</p>
              </TooltipContent>
            </Tooltip>

            {/* Run Code Button - More Prominent */}
            <Tooltip>
              <TooltipTrigger asChild>
                 {/* Only render button actions on client to avoid hydration mismatch */}
                 {isClient && (
                    <Button onClick={runCode} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md active:scale-95 transition-transform duration-150 px-6 py-2.5 text-base font-semibold">
                      <Play className="w-5 h-5 mr-2 fill-current" />
                      Run (Khddem)
                    </Button>
                 )}
              </TooltipTrigger>
              <TooltipContent>
                <p>Run DarijaScript Code (Khddem l code)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main Content Area */}
        <ResizablePanelGroup direction="horizontal" className="flex-grow p-3 gap-3"> {/* Increased gap */}
          {/* Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
             {/* Wrap Editor in Card for consistent styling */}
            <Card className="h-full shadow-xl rounded-lg overflow-hidden border border-input/80 flex flex-col">
              <CardHeader className="p-3 border-b bg-gray-50 dark:bg-gray-800/30">
                <CardTitle className="text-base font-medium text-secondary">Editor (Lmssowda)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0">
                 {/* Ensure Editor takes full height */}
                 <div className="h-full w-full">
                     {isClient ? (
                         <Editor
                            height="100%" // Let container control height
                            language="darijascript"
                            theme="vs-dark" // Monaco editor theme
                            value={code}
                            onMount={handleEditorDidMount}
                            onChange={(value) => setCode(value || '')}
                            options={{
                              minimap: { enabled: true, scale: 0.8, renderCharacters: false },
                              fontSize: 14,
                              wordWrap: 'on',
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              lineNumbers: 'on',
                              roundedSelection: false, // Use square selection
                              cursorBlinking: 'smooth',
                              cursorSmoothCaretAnimation: 'on',
                              renderLineHighlight: 'all', // Highlight full line
                              fontLigatures: true,
                              padding: { top: 10, bottom: 10 }, // Add padding
                              scrollbar: {
                                  verticalScrollbarSize: 10,
                                  horizontalScrollbarSize: 10,
                              }
                            }}
                          />
                     ) : (
                         <div className="p-4 text-muted-foreground">Loading Editor...</div>
                     )}
                 </div>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border/70 hover:bg-primary/50 transition-colors w-2 rounded-full"/>

          {/* Output Panel */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <Card className="h-full flex flex-col shadow-xl rounded-lg overflow-hidden border border-input/80">
              <CardHeader className="p-3 border-b bg-gray-50 dark:bg-gray-800/30">
                <CardTitle className="text-base font-medium text-secondary">Output (Natija)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0 bg-muted/10 dark:bg-black/20">
                 <ScrollArea className="h-full p-4">
                  {error && (
                     <Alert variant="destructive" className="mb-4 shadow-inner border-destructive/50 bg-destructive/10">
                       <AlertTitle className="font-bold text-destructive">❌ Ghalat!</AlertTitle>
                       <AlertDescription className="font-mono text-sm text-destructive/90 break-words whitespace-pre-wrap">
                           {error}
                       </AlertDescription>
                     </Alert>
                  )}
                  {output.length > 0 && (
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground/90 dark:text-foreground/80 p-2 bg-background/50 dark:bg-background/20 rounded-md border border-input/30">
                      {output.join('\n')}
                    </pre>
                  )}
                  {output.length === 0 && !error && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Output will appear here... Tbe3 chi 7aja!</p>
                  )}
                 </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>

         {/* Footer */}
        <footer className="p-2 text-center text-xs text-muted-foreground border-t bg-card/80 backdrop-blur-sm mt-auto">
            <a href="https://mouaadidoufkiredv.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors group inline-flex items-center gap-1">
                Made by <span className="font-bold">MOUAAD IDOUFKIR</span> <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100"/>
            </a>
        </footer>
      </div>
    </TooltipProvider>
  );
}

