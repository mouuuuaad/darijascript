
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
  BrainCircuit,
  Sparkles // Icon for creative feel
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
} from "@/components/ui/sheet";
import { DarijaDocs } from '@/components/docs/darija-docs';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar';
import { gsap } from "gsap"; // Import GSAP

const LOCAL_STORAGE_CODE_KEY = 'darijascript_code';
const LOCAL_STORAGE_AUTOSAVE_KEY = 'darijascript_autosave';

export default function Home() {
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isClient, setIsClient] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // --- GSAP Animation Refs ---
  const headerRef = useRef<HTMLElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const outputPanelRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);

  // --- GSAP Animations ---
  useEffect(() => {
    if (!isClient) return; // Only run animations on the client

    // Intro animation
    gsap.from([headerRef.current, editorPanelRef.current, outputPanelRef.current, footerRef.current], {
      duration: 0.8,
      opacity: 0,
      y: 30,
      stagger: 0.2,
      ease: "power3.out",
      delay: 0.3
    });

     // Button hover animation setup (could be done with CSS too)
     if (runButtonRef.current) {
        const runButton = runButtonRef.current;
        const tl = gsap.timeline({ paused: true });
        tl.to(runButton, { scale: 1.05, duration: 0.2, ease: "power1.inOut" })
          .to(runButton.querySelector('svg'), { rotate: 5, duration: 0.1 }, "-=0.1");

        runButton.addEventListener('mouseenter', () => tl.play());
        runButton.addEventListener('mouseleave', () => tl.reverse());

        return () => {
             // Clean up listeners if component unmounts
             if (runButton) {
                 runButton.removeEventListener('mouseenter', () => tl.play());
                 runButton.removeEventListener('mouseleave', () => tl.reverse());
             }
         };
     }

  }, [isClient]);

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
        `// Salam! Ktbo l code dyalkom hna f DarijaScript!\nbdl message = "Mrehba bikom f ";\nbdl language = "DarijaScript";\n\ntbe3(message + language + "!");\n\n// Example: Loop (Douz)\ndouz (bdl i = 0; i < 5; i = i + 1) {\n  tbe3("Iteration: " + i);\n}\n\n// Example: Function (Dala)\ndala greet(name) {\n  tbe3("Salam, " + name + "!");\n}\ngreet("Moha");\n\n// Try Catch Finally\njrb {\n    // bdl result = 10 / 0; // Uncomment to test error\n    tbe3("Trying...");\n} msk (e) {\n    ghlat("Ghalat happened: " + e);\n} fakhr {\n    tbe3("Calculation attempt finished.");\n}\n\n// --------\n// Created with passion by MOUAAD IDOUFKIR\n// --------\n`
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
        variant: "default",
        className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-emerald-700", // Success toast style
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
    return () => { // Cleanup timeout
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
    // Consider a custom Monaco theme matching the new design later
    monaco.editor.setTheme('vs-dark');
  }

  // Handle editor content change
  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    setHasUnsavedChanges(true);
  };


  const runCode = () => {
    setError(null);
    setOutput([]);
    setIsRunning(true);
    gsap.to(outputPanelRef.current, { opacity: 0.5, duration: 0.2, yoyo: true, repeat: 1 }); // Blink output panel

    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      try {
        setTimeout(() => {
           const result = interpret(currentCode);
            setOutput(result.output);
            if (result.error) {
                setError(result.error);
                 toast({
                    title: "Execution Error",
                    description: result.error,
                    variant: "destructive",
                    className: "bg-red-500 text-white border-red-700", // Error toast style
                 });
                 gsap.fromTo(outputPanelRef.current?.querySelector('.alert-destructive'), { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }); // Animate error alert
            } else {
                 toast({
                    title: "Execution Successful",
                    description: "Your DarijaScript code ran without errors.",
                    variant: "default",
                     className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-emerald-700", // Success toast style
                 });
                 gsap.fromTo(outputPanelRef.current?.querySelector('.output-area-pre'), { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }); // Animate output pre
            }
            setIsRunning(false);
        }, 50);
      } catch (err: any) {
        const errorMessage = `Kayn ghalat kbir f System: ${err.message || 'Machi mochkil, 3awed!'}`;
        setError(errorMessage);
         toast({
            title: "System Error",
            description: errorMessage,
            variant: "destructive",
            className: "bg-red-600 text-white border-red-800", // System error toast style
         });
        setIsRunning(false);
         gsap.fromTo(outputPanelRef.current?.querySelector('.alert-destructive'), { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
      }
    } else {
        setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
    setError(null);
    gsap.fromTo(outputPanelRef.current?.querySelector('.output-area-scroll'), { opacity: 0 }, { opacity: 1, duration: 0.3 }); // Fade in placeholder
     toast({
        title: "Output Cleared",
         description: "The output area is now empty.",
         className: "bg-muted text-muted-foreground border-border"
     });
  };

  const toggleAutoSave = (checked: boolean) => {
    setAutoSaveEnabled(checked);
    localStorage.setItem(LOCAL_STORAGE_AUTOSAVE_KEY, String(checked));
    toast({
      title: `Auto Save ${checked ? 'Enabled' : 'Disabled'}`,
      description: checked ? "Code automatically saved." : "Manual save required.",
       className: `bg-gradient-to-r ${checked ? 'from-accent to-secondary' : 'from-muted to-card'} text-accent-foreground border-border`
    });
     if (checked && hasUnsavedChanges) {
         saveCode();
     }
  };

   // Function to load algorithm code into the editor
  const loadAlgorithm = (algorithmCode: string) => {
     gsap.fromTo(editorPanelRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }); // Animate editor panel
    setCode(algorithmCode);
    setIsSidebarOpen(false);
    setHasUnsavedChanges(true);
     toast({
        title: "Algorithm Loaded!",
        description: "Code ready in the editor.",
        className: "bg-gradient-to-r from-primary to-blue-500 text-primary-foreground border-blue-600"
     });
  };


  return (
    <TooltipProvider>
      {/* Apply the base background color to the root */}
      <div className="flex h-screen bg-background overflow-hidden">

          {/* Algorithms Sidebar - Styling updated */}
          <AlgorithmsSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onSelectAlgorithm={loadAlgorithm}
          />


        {/* Main Content Area */}
        <div className="flex flex-col flex-grow transition-all duration-300 ease-in-out">
          {/* === Header - Updated Styling === */}
          <header ref={headerRef} className="flex items-center justify-between p-3 border-b border-border/30 bg-gradient-to-r from-background to-card/50 backdrop-blur-lg shadow-lg sticky top-0 z-30">
            {/* Left Side: Title & Creator */}
            <div className="flex items-center gap-4">
               {/* Sidebar Toggle Button */}
                 <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                             className="text-primary hover:bg-primary/10 rounded-full transition-colors duration-300 hover:text-secondary" // Brighter hover
                         >
                             {isSidebarOpen ? <SidebarClose className="w-6 h-6" /> : <SidebarOpen className="w-6 h-6" />}
                             <span className="sr-only">Toggle Algorithms Sidebar</span>
                         </Button>
                     </TooltipTrigger>
                     <TooltipContent className="bg-popover text-popover-foreground border-border">
                         <p>Show/Hide Algorithms</p>
                     </TooltipContent>
                 </Tooltip>

              {/* Logo/Icon - Enhanced */}
               <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-inner transform hover:scale-110 transition-transform duration-300">
                   <Sparkles className="w-7 h-7 text-background" />
               </div>
              {/* Title and Creator Badge */}
              <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent text-transparent bg-clip-text">
                  DarijaScript IDE
                </h1>
                 <a href="https://mouaadidoufkiredv.vercel.app/" target="_blank" rel="noopener noreferrer" className="w-fit group">
                     <Badge variant="secondary" className="text-xs font-mono tracking-wide cursor-pointer transition-all group-hover:bg-accent/80 group-hover:text-accent-foreground group-hover:shadow-md px-3 py-1 bg-accent text-accent-foreground">
                         By: MOUAAD IDOUFKIR <ExternalLink className="inline-block w-3 h-3 ml-1 opacity-70 group-hover:opacity-100"/>
                     </Badge>
                 </a>
              </div>
            </div>

             {/* Right Side: Actions */}
             <div className="flex items-center space-x-2">
                {/* Auto Save Toggle */}
                <div className="flex items-center space-x-2 mr-2 p-1 bg-card/50 rounded-full">
                  <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex items-center space-x-1.5 cursor-pointer">
                          <Switch
                            id="autosave-switch"
                            checked={autoSaveEnabled}
                            onCheckedChange={toggleAutoSave}
                            aria-label="Toggle auto save"
                             className="data-[state=checked]:bg-accent focus-visible:ring-accent data-[state=unchecked]:bg-muted/50"
                          />
                          <Label htmlFor="autosave-switch" className="text-xs font-medium text-muted-foreground cursor-pointer select-none pr-2">
                             Auto Save
                          </Label>
                       </div>
                     </TooltipTrigger>
                     <TooltipContent className="bg-popover text-popover-foreground border-border">
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
                         disabled={!hasUnsavedChanges || autoSaveEnabled}
                         className={cn(
                            "border-border/50 hover:bg-muted/80 relative rounded-full transition-all duration-300",
                             hasUnsavedChanges && !autoSaveEnabled && "border-accent text-accent ring-2 ring-accent/50 animate-pulse" // Indicate unsaved changes
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
                   <TooltipContent className="bg-popover text-popover-foreground border-border">
                     <p>{autoSaveEnabled ? 'Auto Save Enabled' : (hasUnsavedChanges ? 'Save Code (Ctrl+S)' : 'Code Saved')}</p>
                   </TooltipContent>
                 </Tooltip>

               {/* Docs Sheet */}
               <Sheet>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <SheetTrigger asChild>
                           <Button variant="outline" size="icon" className="border-border/50 hover:bg-muted/80 rounded-full transition-colors duration-300 hover:text-secondary hover:border-secondary/50">
                               <Info className="w-5 h-5 text-secondary" />
                           </Button>
                       </SheetTrigger>
                     </TooltipTrigger>
                     <TooltipContent className="bg-popover text-popover-foreground border-border">
                       <p>DarijaScript Docs (L9awa3id)</p>
                     </TooltipContent>
                   </Tooltip>
                   <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl overflow-y-auto !p-0 flex flex-col bg-background border-l-border/50" side="left">
                       <DarijaDocs />
                   </SheetContent>
               </Sheet>

               {/* Clear Output */}
               <Tooltip>
                   <TooltipTrigger asChild>
                       <Button variant="outline" size="icon" onClick={clearOutput} className="border-border/50 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors duration-300">
                           <Trash2 className="w-5 h-5" />
                       </Button>
                   </TooltipTrigger>
                   <TooltipContent className="bg-popover text-popover-foreground border-border">
                       <p>Clear Output (Msse7 Natija)</p>
                   </TooltipContent>
               </Tooltip>

               {/* Run Code Button - Enhanced */}
               <Tooltip>
                   <TooltipTrigger asChild>
                       {isClient && (
                           <Button
                                ref={runButtonRef} // Add ref for GSAP
                               onClick={runCode}
                               disabled={isRunning}
                               className="bg-button-primary-gradient text-background hover:opacity-90 shadow-lg active:scale-95 transition-all duration-150 px-6 py-2.5 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center gap-2"
                                // Apply gradient using Tailwind class defined in config
                           >
                               {isRunning ? (
                                   <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span>
                               ) : (
                                   <Play className="w-5 h-5 fill-current" />
                               )}
                               {isRunning ? 'Khddam...' : 'Run (Khddem)'}
                           </Button>
                       )}
                   </TooltipTrigger>
                   <TooltipContent className="bg-popover text-popover-foreground border-border">
                       <p>Run DarijaScript Code (Khddem l code)</p>
                   </TooltipContent>
               </Tooltip>
             </div>
          </header>

          {/* === Main IDE Area === */}
          <ResizablePanelGroup direction="horizontal" className="flex-grow p-3 gap-3 overflow-auto">
             {/* Editor Panel */}
            <ResizablePanel ref={editorPanelRef} defaultSize={60} minSize={30}>
              <Card className="h-full shadow-xl rounded-lg overflow-hidden border border-border/30 bg-card/80 backdrop-blur-sm flex flex-col">
                 <CardHeader className="p-3 border-b border-border/20 bg-muted/10 flex flex-row justify-between items-center">
                     <CardTitle className="text-base font-medium text-primary flex items-center gap-2">
                         <Code className="w-5 h-5"/>
                         Editor (Lmssowda)
                     </CardTitle>
                     {hasUnsavedChanges && !autoSaveEnabled && (
                         <Badge variant="destructive" className="text-xs animate-pulse bg-destructive/80 text-destructive-foreground rounded-full px-2 py-0.5">Unsaved</Badge>
                     )}
                 </CardHeader>
                <CardContent className="flex-grow p-0">
                   <div className="h-full w-full">
                     {isClient ? (
                         <Editor
                            height="100%"
                            language="darijascript"
                            theme="vs-dark" // Consider a custom theme later
                            value={code}
                            onMount={handleEditorDidMount}
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: true, scale: 0.8, renderCharacters: false },
                                fontSize: 14.5,
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                lineNumbers: 'on',
                                roundedSelection: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                renderLineHighlight: 'gutter',
                                fontLigatures: true,
                                padding: { top: 15, bottom: 15 }, // Increased padding
                                scrollbar: {
                                    verticalScrollbarSize: 10,
                                    horizontalScrollbarSize: 10,
                                    useShadows: false,
                                },
                                smoothScrolling: true,
                                // Experimental: Enable bracket pair colorization
                                // bracketPairColorization: { enabled: true },
                                // Consider adding 'editor.semanticHighlighting.enabled': true if LSP is ever added
                            }}
                          />
                     ) : (
                         <div className="p-4 text-muted-foreground flex items-center justify-center h-full">Loading Editor...</div>
                     )}
                   </div>
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border/30 hover:bg-primary/50 transition-colors w-2 rounded-full mx-1"/>

             {/* Output Panel - Enhanced Styling */}
            <ResizablePanel ref={outputPanelRef} defaultSize={40} minSize={20}>
               <Card className="h-full flex flex-col shadow-xl rounded-lg overflow-hidden output-area-card bg-card/80 backdrop-blur-sm"> {/* Use class */}
                 <CardHeader className="p-3 border-b card-header flex flex-row justify-between items-center"> {/* Use class */}
                     <CardTitle className="text-base font-medium text-secondary flex items-center gap-2">
                         {error ? <XCircle className="w-5 h-5 text-destructive"/> : <CheckCircle className="w-5 h-5 text-green-500"/>}
                         Output (Natija)
                     </CardTitle>
                 </CardHeader>
                <CardContent className="flex-grow p-0 card-content"> {/* Use class */}
                   <ScrollArea className="h-full">
                      <div className="output-area-scroll"> {/* Use class */}
                          {error && (
                              <Alert variant="destructive" className="mb-4 shadow-inner output-area-alert alert-destructive"> {/* Use class */}
                                  <AlertTitle className="alert-title">❌ Ghalat!</AlertTitle>
                                  <AlertDescription className="font-mono text-sm break-words whitespace-pre-wrap alert-description">
                                      {error}
                                  </AlertDescription>
                              </Alert>
                          )}
                           {/* Display success message explicitly if needed */}
                           {output.length > 0 && !error && (
                               <div className="output-area-success mb-3">
                                   ✅ Execution Successful!
                               </div>
                           )}
                          {output.length > 0 && (
                              <pre className="output-area-pre"> {/* Use class */}
                                  {output.join('\n')}
                              </pre>
                          )}
                          {output.length === 0 && !error && (
                              <p className="output-area-placeholder">Output will show here... Tbe3 chi 7aja!</p> /* Use class */
                          )}
                      </div>
                   </ScrollArea>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* === Footer - Enhanced Styling === */}
          <footer ref={footerRef} className="p-2 text-center text-xs text-muted-foreground/70 border-t border-border/20 bg-gradient-to-r from-background to-card/30 backdrop-blur-sm mt-auto">
             <a href="https://mouaadidoufkiredv.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors group inline-flex items-center gap-1.5">
                 <span>Made with</span>
                  {/* Animated Heart */}
                  <span className="inline-block relative mx-0.5">
                     <span className="text-red-500 text-sm">❤️</span>
                     <span className="absolute top-0 left-0 text-red-400 text-sm animate-ping opacity-75">❤️</span>
                  </span>
                 <span>by</span>
                 <span className="font-bold bg-gradient-to-r from-primary via-secondary to-accent text-transparent bg-clip-text">MOUAAD IDOUFKIR</span>
                 <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity"/>
             </a>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
