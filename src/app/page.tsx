"use client";

import type * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Trash2, Info } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Placeholder for DarijaScript interpreter - replace with actual implementation
import { interpret } from '@/lib/darijascript/interpreter';
import { setupDarijaScriptLanguage } from '@/lib/darijascript/monaco-config';

export default function Home() {
  const [code, setCode] = useState('bdl x = 10;\nbdl y = 20;\n\ntba3(x + y);'); // Default code
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
   const monacoRef = useRef<Monaco | null>(null);

  function handleEditorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupDarijaScriptLanguage(monaco); // Setup language configuration
    // Set theme and other options
    monaco.editor.setTheme('vs-dark'); // Or your preferred theme
  }

  const runCode = () => {
    setError(null);
    setOutput([]); // Clear previous output
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      try {
        // Mock interpreter function - replace with actual call
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
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center justify-between p-4 border-b bg-card text-card-foreground shadow-sm">
          <h1 className="text-xl font-bold text-primary">DarijaScript IDE</h1>
          <div className="flex items-center space-x-2">
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" onClick={() => alert("DarijaScript Documentation:\n\n- tabit: Declare a constant variable (e.g., tabit PI = 3.14)\n- bdl: Declare a mutable variable (e.g., bdl counter = 0)\n- tba3(): Print to output (e.g., tba3('Salam'))\n- ila (condition): Conditional 'if' (e.g., ila (x > 5) { ... })\n- ella: Conditional 'else'\n- wa9ila (condition): Conditional 'else if'\n- douz (condition) { ... }: 'while' loop\n- mnin variable = start hta end { ... }: 'for' loop")}>
                  <Info className="w-5 h-5 text-accent" />
                 </Button>
               </TooltipTrigger>
               <TooltipContent>
                 <p>DarijaScript Docs</p>
               </TooltipContent>
             </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={clearOutput}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Output (Msse7)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={runCode} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Play className="w-5 h-5 mr-2" />
                  Run (Khddem)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Run DarijaScript Code</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          <ResizablePanel defaultSize={60}>
            <div className="h-full p-1">
             <Editor
                height="100%"
                language="darijascript"
                theme="vs-dark" // Use a dark theme suitable for code editors
                value={code}
                onMount={handleEditorDidMount}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true, // Ensure editor resizes correctly
                }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40}>
            <Card className="h-full flex flex-col m-1 shadow-lg rounded-lg">
              <CardHeader className="border-b">
                <CardTitle className="text-lg text-secondary">Output (Natija)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0">
                 <ScrollArea className="h-full p-4">
                  {error && (
                     <Alert variant="destructive" className="mb-4">
                       <AlertTitle className="font-semibold">Ghalat!</AlertTitle>
                       <AlertDescription className="font-mono">{error}</AlertDescription>
                     </Alert>
                  )}
                  {output.length > 0 && (
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                      {output.join('\n')}
                    </pre>
                  )}
                  {output.length === 0 && !error && (
                    <p className="text-sm text-muted-foreground italic">Tba3 chi 7aja hna...</p>
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
