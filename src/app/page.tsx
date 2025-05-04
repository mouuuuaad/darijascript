
"use client";

import type * as React from 'react';
import { useState, useRef } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Trash2, Info, Code } from 'lucide-react';
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

export default function Home() {
  const [code, setCode] = useState('// Salam! Ktbo l code dyalkom hna\nbdl x = 10;\nbdl y = 20;\n\ntbe3(x + y);\n\n// Created by MOUAAD IDOUFKIR'); // Default code
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  function handleEditorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupDarijaScriptLanguage(monaco); // Setup language configuration
    // Set theme and other options
    monaco.editor.setTheme('vs-dark'); // Or your preferred theme ('light', 'hc-black')
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
        setError(`Kayn ghalat: ${err.message || 'Machi mochkil, 3awed!'}`);
      }
    }
  };

  const clearOutput = () => {
    setOutput([]);
    setError(null);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-background to-blue-100 dark:to-blue-900/30">
        <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm text-card-foreground shadow-md sticky top-0 z-10">
         <div className="flex items-center gap-3">
            <Code className="w-7 h-7 text-primary" />
            <div>
                <h1 className="text-xl font-bold text-primary tracking-tight">DarijaScript IDE</h1>
                <p className="text-xs text-muted-foreground">Created by MOUAAD IDOUFKIR</p>
            </div>
         </div>
          <div className="flex items-center space-x-2">
            <Sheet>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="w-5 h-5 text-secondary" />
                      </Button>
                   </SheetTrigger>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>DarijaScript Docs (L9awa3id)</p>
                 </TooltipContent>
               </Tooltip>
               <SheetContent className="w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:max-w-xl overflow-y-auto">
                 <SheetHeader>
                   <SheetTitle className="text-primary">DarijaScript Documentation</SheetTitle>
                   <SheetDescription>
                     Your guide to coding in DarijaScript. Click sections below to learn more.
                   </SheetDescription>
                 </SheetHeader>
                 <ScrollArea className="h-[calc(100%-4rem)] pr-6"> {/* Adjust height and padding as needed */}
                   <DarijaDocs />
                 </ScrollArea>
               </SheetContent>
             </Sheet>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={clearOutput} className="border-muted-foreground/50 hover:bg-muted">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Output (Msse7 Natija)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={runCode} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm active:scale-95 transition-transform duration-100">
                  <Play className="w-5 h-5 mr-2" />
                  Run (Khddem)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Run DarijaScript Code (Khddem l code)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-grow p-2 gap-2">
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full shadow-lg rounded-lg overflow-hidden border border-input">
             <Editor
                height="100%"
                language="darijascript"
                theme="vs-dark" // Use a dark theme suitable for code editors
                value={code}
                onMount={handleEditorDidMount}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: true, scale: 0.8 },
                  fontSize: 14,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true, // Ensure editor resizes correctly
                  lineNumbers: 'on',
                  roundedSelection: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'gutter',
                }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/50 hover:bg-border transition-colors"/>
          <ResizablePanel defaultSize={40} minSize={20}>
            <Card className="h-full flex flex-col shadow-lg rounded-lg overflow-hidden border border-input">
              <CardHeader className="border-b bg-card/50">
                <CardTitle className="text-lg text-secondary tracking-tight">Output (Natija)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0 bg-muted/20 dark:bg-card/30">
                 <ScrollArea className="h-full p-4">
                  {error && (
                     <Alert variant="destructive" className="mb-4 shadow-md border-destructive/70">
                       <AlertTitle className="font-semibold">Ghalat!</AlertTitle>
                       <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
                     </Alert>
                  )}
                  {output.length > 0 && (
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground/80 dark:text-foreground/70">
                      {output.join('\n')}
                    </pre>
                  )}
                  {output.length === 0 && !error && (
                    <p className="text-sm text-muted-foreground italic">Tbe3 chi 7aja hna...</p>
                  )}
                 </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
