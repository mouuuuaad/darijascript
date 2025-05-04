
"use client";

import type * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Play,
  Trash2,
  Info,
  Code,
  ExternalLink,
  Save,
  SidebarOpen,
  SidebarClose,
  CheckCircle,
  XCircle,
  BrainCircuit // Icon for Algorithms
} from 'lucide-react';
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar'; // New component

const LOCAL_STORAGE_CODE_KEY = 'darijascript_code';
const LOCAL_STORAGE_AUTOSAVE_KEY = 'darijascript_autosave';

export default function Home() {
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for algorithm sidebar
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track unsaved changes
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isClient, setIsClient] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load code and autosave preference from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const savedCode = localStorage.getItem(LOCAL_STORAGE_CODE_KEY);
    const savedAutoSave = localStorage.getItem(LOCAL_STORAGE_AUTOSAVE_KEY);

    if (savedCode) {
      setCode(savedCode);
    } else {
      // Set default code if nothing saved
      setCode(
        `// Salam! Ktbo l code dyalkom hna f DarijaScript!\nbdl message = "Mrehba bikom f ";\nbdl language = "DarijaScript";\n\ntbe3(message + language + "!");\n\n// Example: Loop (Douz)\ndouz (bdl i = 0; i < 5; i = i + 1) {\n  tbe3("Iteration: " + i);\n}\n\n// Example: Function (Dala)\ndala greet(name) {\n  tbe3("Salam, " + name + "!");\n}\ngreet("Moha");\n\n// Try Catch Finally\njrb {\n    bdl result = 10 / 0;\n    tbe3(result);\n} msk (e) {\n    ghlat("Ghalat happened: " + e);\n} fakhr {\n    tbe3("Fin de la tentative.");\n}\n\n// --------\n// Created with passion by MOUAAD IDOUFKIR\n// --------\n`
      );
    }

    setAutoSaveEnabled(savedAutoSave === 'true');

  }, []); // Run only once on mount

  // Save code to localStorage
  const saveCode = useCallback(() => {
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      localStorage.setItem(LOCAL_STORAGE_CODE_KEY, currentCode);
      setHasUnsavedChanges(false);
      toast({
        title: "Code Saved!",
        description: "Your code has been saved locally.",
        variant: "default", // Use default variant for success
        className: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200",
      });
    }
  }, [toast]);

  // Auto-save logic
  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        saveCode();
      }, 1500); // Auto-save after 1.5 seconds of inactivity
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [code, autoSaveEnabled, hasUnsavedChanges, saveCode]);

  // Handle editor mount
  function handleEditorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupDarijaScriptLanguage(monaco);
    monaco.editor.setTheme('vs-dark');
  }

  // Handle editor content change
  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    setHasUnsavedChanges(true); // Mark changes as unsaved
  };


  const runCode = () => {
    setError(null);
    setOutput([]);
    setIsRunning(true);
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      try {
        // Use setTimeout to allow UI to update before potentially long interpretation
        setTimeout(() => {
           const result = interpret(currentCode);
            setOutput(result.output);
            if (result.error) {
                setError(result.error);
                 toast({
                    title: "Execution Error",
                    description: result.error,
                    variant: "destructive",
                 });
            } else {
                 toast({
                    title: "Execution Successful",
                    description: "Your DarijaScript code ran without errors.",
                    variant: "default", // Use default variant for success
                     className: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200",
                 });
            }
            setIsRunning(false);
        }, 50); // Short delay
      } catch (err: any) {
        const errorMessage = `Kayn ghalat kbir f System: ${err.message || 'Machi mochkil, 3awed!'}`;
        setError(errorMessage);
         toast({
            title: "System Error",
            description: errorMessage,
            variant: "destructive",
         });
        setIsRunning(false);
      }
    } else {
        setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
    setError(null);
     toast({
        title: "Output Cleared",
         description: "The output area is now empty.",
     });
  };

  const toggleAutoSave = (checked: boolean) => {
    setAutoSaveEnabled(checked);
    localStorage.setItem(LOCAL_STORAGE_AUTOSAVE_KEY, String(checked));
    toast({
      title: `Auto Save ${checked ? 'Enabled' : 'Disabled'}`,
      description: checked ? "Your code will be saved automatically." : "Remember to save manually.",
    });
     // Immediately save if enabling autosave and there are unsaved changes
     if (checked && hasUnsavedChanges) {
         saveCode();
     }
  };

   // Function to load algorithm code into the editor
  const loadAlgorithm = (algorithmCode: string) => {
    setCode(algorithmCode);
    setIsSidebarOpen(false); // Close sidebar after selection
    setHasUnsavedChanges(true); // Mark as unsaved when loading new code
     toast({
        title: "Algorithm Loaded",
        description: "The selected algorithm code is ready in the editor.",
     });
  };


  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gradient-to-br from-background via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 overflow-hidden">

         {/* Algorithms Sidebar */}
          <AlgorithmsSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onSelectAlgorithm={loadAlgorithm}
          />


        {/* Main Content Area */}
        <div className="flex flex-col flex-grow transition-all duration-300 ease-in-out">
          {/* === Header === */}
          <header className="flex items-center justify-between p-3 border-b bg-card/80 backdrop-blur-md shadow-md sticky top-0 z-30">
            {/* Left Side: Title & Creator */}
            <div className="flex items-center gap-4">
               {/* Sidebar Toggle Button */}
                 <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                             className="text-primary hover:bg-primary/10"
                         >
                             {isSidebarOpen ? <SidebarClose className="w-6 h-6" /> : <SidebarOpen className="w-6 h-6" />}
                             <span className="sr-only">Toggle Algorithms Sidebar</span>
                         </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                         <p>Show/Hide Algorithms</p>
                     </TooltipContent>
                 </Tooltip>

              {/* Logo/Icon */}
               <div className="p-2 bg-gradient-to-tr from-primary to-accent rounded-lg shadow-inner">
                   <Code className="w-7 h-7 text-primary-foreground" />
               </div>
              {/* Title and Creator Badge */}
              <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
                  DarijaScript IDE
                </h1>
                 <a href="https://mouaadidoufkiredv.vercel.app/" target="_blank" rel="noopener noreferrer" className="w-fit group">
                     <Badge variant="secondary" className="text-xs font-mono tracking-wide cursor-pointer transition-all group-hover:bg-primary/20 group-hover:text-primary group-hover:shadow-sm">
                         By: MOUAAD IDOUFKIR <ExternalLink className="inline-block w-3 h-3 ml-1 opacity-70 group-hover:opacity-100"/>
                     </Badge>
                 </a>
              </div>
            </div>

             {/* Right Side: Actions */}
             <div className="flex items-center space-x-2">
                {/* Auto Save Toggle */}
                <div className="flex items-center space-x-2 mr-2">
                  <Tooltip>
                     <TooltipTrigger asChild>
                       {/* Wrap Switch for tooltip */}
                       <div className="flex items-center space-x-1.5">
                          <Switch
                            id="autosave-switch"
                            checked={autoSaveEnabled}
                            onCheckedChange={toggleAutoSave}
                            aria-label="Toggle auto save"
                             className="data-[state=checked]:bg-accent focus-visible:ring-accent"
                          />
                          <Label htmlFor="autosave-switch" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                             Auto Save
                          </Label>
                       </div>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>{autoSaveEnabled ? 'Disable' : 'Enable'} Auto Save (Locally)</p>
                     </TooltipContent>
                  </Tooltip>
                </div>

                 {/* Manual Save Button */}
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button
                         variant="outline"
                         size="icon"
                         onClick={saveCode}
                         disabled={!hasUnsavedChanges || autoSaveEnabled} // Disable if no changes or autosave is on
                         className={cn(
                            "border-muted-foreground/30 hover:bg-muted/80 relative",
                             hasUnsavedChanges && !autoSaveEnabled && "border-accent text-accent animate-pulse" // Indicate unsaved changes
                         )}
                     >
                       <Save className="w-5 h-5" />
                        {hasUnsavedChanges && !autoSaveEnabled && (
                             <span className="absolute -top-1 -right-1 flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                             </span>
                         )}
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent>
                     <p>{autoSaveEnabled ? 'Auto Save Enabled' : (hasUnsavedChanges ? 'Save Code (Ctrl+S)' : 'Code Saved')}</p>
                   </TooltipContent>
                 </Tooltip>

               {/* Docs Sheet */}
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
                   <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl overflow-y-auto !p-0 flex flex-col" side="left">
                       <DarijaDocs /> {/* Content takes full height now */}
                   </SheetContent>
               </Sheet>

               {/* Clear Output */}
               <Tooltip>
                   <TooltipTrigger asChild>
                       <Button variant="outline" size="icon" onClick={clearOutput} className="border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive">
                           <Trash2 className="w-5 h-5" />
                       </Button>
                   </TooltipTrigger>
                   <TooltipContent>
                       <p>Clear Output (Msse7 Natija)</p>
                   </TooltipContent>
               </Tooltip>

               {/* Run Code Button */}
               <Tooltip>
                   <TooltipTrigger asChild>
                       {isClient && (
                           <Button
                               onClick={runCode}
                               disabled={isRunning}
                               className="bg-gradient-to-r from-accent to-orange-500 text-accent-foreground hover:from-accent/90 hover:to-orange-500/90 shadow-lg active:scale-95 transition-transform duration-150 px-6 py-2.5 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                           >
                               {isRunning ? (
                                   <span className="animate-spin h-5 w-5 mr-2 border-2 border-current border-t-transparent rounded-full"></span>
                               ) : (
                                   <Play className="w-5 h-5 mr-2 fill-current" />
                               )}
                               {isRunning ? 'Running...' : 'Run (Khddem)'}
                           </Button>
                       )}
                   </TooltipTrigger>
                   <TooltipContent>
                       <p>Run DarijaScript Code (Khddem l code)</p>
                   </TooltipContent>
               </Tooltip>
             </div>
          </header>

          {/* === Main IDE Area === */}
          <ResizablePanelGroup direction="horizontal" className="flex-grow p-3 gap-3 overflow-auto">
             {/* Editor Panel */}
            <ResizablePanel defaultSize={60} minSize={30}>
              <Card className="h-full shadow-xl rounded-lg overflow-hidden border border-input/80 flex flex-col">
                 <CardHeader className="p-3 border-b bg-muted/20 dark:bg-muted/10 flex flex-row justify-between items-center">
                     <CardTitle className="text-base font-medium text-secondary flex items-center gap-2">
                         <Code className="w-4 h-4"/>
                         Editor (Lmssowda)
                     </CardTitle>
                     {hasUnsavedChanges && !autoSaveEnabled && (
                         <Badge variant="destructive" className="text-xs animate-pulse">Unsaved</Badge>
                     )}
                 </CardHeader>
                <CardContent className="flex-grow p-0">
                   <div className="h-full w-full">
                     {isClient ? (
                         <Editor
                            height="100%"
                            language="darijascript"
                            theme="vs-dark"
                            value={code}
                            onMount={handleEditorDidMount}
                            onChange={handleEditorChange} // Use updated handler
                            options={{
                                minimap: { enabled: true, scale: 0.8, renderCharacters: false },
                                fontSize: 14.5, // Slightly larger font
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true, // Ensures editor resizes correctly
                                lineNumbers: 'on',
                                roundedSelection: true, // Rounded selection looks nicer
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                renderLineHighlight: 'gutter', // Highlight line number gutter
                                fontLigatures: true,
                                padding: { top: 12, bottom: 12 },
                                scrollbar: {
                                    verticalScrollbarSize: 10,
                                    horizontalScrollbarSize: 10,
                                    useShadows: false, // Cleaner scrollbar look
                                },
                                // Additional suggestions for better feel:
                                smoothScrolling: true,
                                // renderWhitespace: "boundary", // Show subtle whitespace markers
                                // rulers: [80, 120], // Example rulers
                            }}
                          />
                     ) : (
                         <div className="p-4 text-muted-foreground flex items-center justify-center h-full">Loading Editor...</div>
                     )}
                   </div>
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border/70 hover:bg-primary/50 transition-colors w-2 rounded-full mx-1"/>

             {/* Output Panel */}
            <ResizablePanel defaultSize={40} minSize={20}>
               <Card className="h-full flex flex-col shadow-xl rounded-lg overflow-hidden output-area-card"> {/* Added class */}
                 <CardHeader className="p-3 border-b card-header flex flex-row justify-between items-center"> {/* Use class */}
                     <CardTitle className="text-base font-medium text-secondary flex items-center gap-2">
                         {error ? <XCircle className="w-4 h-4 text-destructive"/> : <CheckCircle className="w-4 h-4 text-green-600"/>}
                         Output (Natija)
                     </CardTitle>
                 </CardHeader>
                <CardContent className="flex-grow p-0 card-content"> {/* Use class */}
                   <ScrollArea className="h-full">
                      <div className="output-area-scroll"> {/* Use class */}
                          {error && (
                              <Alert variant="destructive" className="mb-4 shadow-inner output-area-alert alert-destructive"> {/* Added classes */}
                                  <AlertTitle className="font-bold alert-title">❌ Ghalat!</AlertTitle>
                                  <AlertDescription className="font-mono text-sm break-words whitespace-pre-wrap alert-description">
                                      {error}
                                  </AlertDescription>
                              </Alert>
                          )}
                          {output.length > 0 && (
                              <pre className="output-area-pre"> {/* Use class */}
                                  {output.join('\n')}
                              </pre>
                          )}
                          {output.length === 0 && !error && (
                              <p className="output-area-placeholder">Output will appear here... Tbe3 chi 7aja!</p> /* Use class */
                          )}
                      </div>
                   </ScrollArea>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* === Footer === */}
          <footer className="p-2 text-center text-xs text-muted-foreground border-t bg-card/80 backdrop-blur-sm mt-auto">
            {/* Consistent link styling with header badge */}
             <a href="https://mouaadidoufkiredv.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors group inline-flex items-center gap-1.5">
                 <span>Made with</span>
                 <span className="text-red-500 animate-pulse">❤️</span>
                 <span>by</span>
                 <span className="font-bold bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">MOUAAD IDOUFKIR</span>
                 <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100"/>
             </a>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
