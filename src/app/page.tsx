import { Button } from '@/components/ui/button';
// import { CodeBlock } from '@/components/docs/code-block'; // Not used directly? Keep commented if needed later
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Keep Dialog imports if needed for future features
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import Editor, { Monaco, loader } from "@monaco-editor/react"; // Ensure loader is imported if used
import type * as monacoEditor from 'monaco-editor'; // Import monaco types
import { FunctionComponent, useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from "@/hooks/use-theme"; // Assuming this hook exists and works
import { DarijaDocs } from '@/components/docs/darija-docs';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet components
import { Play, BookOpen, Brain, Code, Save, RotateCcw, TerminalSquare } from 'lucide-react'; // Import icons
import { setupDarijaScriptLanguage } from '@/lib/darijascript/monaco-config';
import { gsap } from "gsap"; // Import GSAP
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

const LOCAL_STORAGE_CODE_KEY = 'darijascript_code_v2'; // Use a new key if schema changes

const HomePage: FunctionComponent = () => {
  const { toast } = useToast();
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const outputPanelRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState('');
  const { theme } = useTheme(); // Assuming useTheme returns 'dark' or 'light'
  const [output, setOutput] = useState<string[]>([]);
  const [algorithmsSidebarOpen, setAlgorithmsSidebarOpen] = useState(false);
  const [showCreatorCredit, setShowCreatorCredit] = useState(true);
  const [isRunning, setIsRunning] = useState(false); // Track execution state
  const [isSaving, setIsSaving] = useState(false); // Track saving state

  // --- GSAP Animations ---
  useEffect(() => {
    // Fade in elements on load
    gsap.fromTo(".fade-in-element",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 }
    );

    // Maybe animate the logo or title on load?
    gsap.fromTo(".ide-title",
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.5)", delay: 0.3 }
    );

    // Animate output lines as they appear (more complex, see runCode)
  }, []);


  // --- Load and Save Code ---
  useEffect(() => {
    const storedCode = localStorage.getItem(LOCAL_STORAGE_CODE_KEY);
    if (storedCode) {
      setCode(storedCode);
    } else {
        // Default code if nothing is stored
        setCode(`// Salam! Ktbo l code dyalkom hna\ntbe3("Salam L3alam!");\n\n// Created by MOUAAD IDOUFKIR`);
    }
  }, []);

  const handleAutoSave = useCallback(() => {
    if (code) { // Only save if there's code
        localStorage.setItem(LOCAL_STORAGE_CODE_KEY, code);
        setIsSaving(true);
         toast({
             title: "Code Saved!",
             description: "Your code has been automatically saved.",
             className: "toast-autosave" // Optional: Add class for custom styling
         });
        // Optional: visual feedback for saving
        setTimeout(() => setIsSaving(false), 1500);
    }
  }, [code, toast]);

  // Auto-save trigger (e.g., on delay after code change)
  useEffect(() => {
    const handler = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save 2 seconds after the last change

    return () => {
      clearTimeout(handler);
    };
  }, [code, handleAutoSave]); // Depend on code and the save function


 // --- Monaco Editor Setup ---
  const handleEditorWillMount = (monaco: Monaco) => {
    setupDarijaScriptLanguage(monaco);
  }

  const handleEditorDidMount = (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
     // Apply custom theme based on app theme
     monaco.editor.defineTheme('darija-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '50E3C2' }, // Turquoise keywords (Accent/Dual)
            { token: 'identifier', foreground: 'FFFFFF' },
            { token: 'string', foreground: 'FFD700' }, // Gold-like strings
            { token: 'number', foreground: 'FFD700' }, // Gold-like numbers
            { token: 'comment', foreground: '888888', fontStyle: 'italic' },
            { token: 'operator', foreground: '3BACFF'}, // Bright blue operators (Primary)
            { token: 'delimiter', foreground: 'AAAAAA'},
            { token: 'support.function.builtin', foreground: '67F2D3'}, // Light Turquoise builtins (Dual Button)
            { token: 'keyword.constant', foreground: 'FF8C00'}, // Dark Orange constants
        ],
        colors: {
            'editor.background': '#020013', // Dark background
            'editor.foreground': '#E0E0E0', // Slightly off-white foreground
            'editorCursor.foreground': '#FFD700', // Gold cursor
            'editor.lineHighlightBackground': '#101028', // Slightly lighter line highlight
            'editorLineNumber.foreground': '#666688', // Muted line numbers
            'editor.selectionBackground': '#3BACFF33', // Primary color selection with alpha
             'editorWidget.background': '#0A081A', // Darker widgets
             'editorWidget.border': '#3BACFF80', // Primary border for widgets
        }
    });
     monaco.editor.defineTheme('darija-light', { // Basic light theme adaptation (less emphasis)
        base: 'vs',
        inherit: true,
         rules: [
            { token: 'keyword', foreground: '008080' }, // Teal
            { token: 'identifier', foreground: '333333' },
            { token: 'string', foreground: 'D2691E' }, // Chocolate
            { token: 'number', foreground: 'D2691E' },
            { token: 'comment', foreground: '808080', fontStyle: 'italic' },
            { token: 'operator', foreground: '4682B4'}, // Steel Blue
            { token: 'delimiter', foreground: '778899'}, // Light Slate Gray
            { token: 'support.function.builtin', foreground: '20B2AA'}, // Light Sea Green
             { token: 'keyword.constant', foreground: 'A0522D'}, // Sienna
        ],
        colors: {
             'editor.background': '#FAFAFA',
            'editor.foreground': '#333333',
            'editorCursor.foreground': '#D2691E',
            'editor.lineHighlightBackground': '#EEEEEE',
            'editorLineNumber.foreground': '#AAAAAA',
             'editor.selectionBackground': '#ADD8E6', // Light Blue
             'editorWidget.background': '#FFFFFF',
             'editorWidget.border': '#CCCCCC',
        }
    });

     monaco.editor.setTheme(theme === "dark" ? 'darija-dark' : 'darija-light');
  };

  // Update theme if it changes
  useEffect(() => {
      // Ensure Monaco instance is available (might be async loaded)
      loader.init().then(monaco => {
          if (editorRef.current) {
               monaco.editor.setTheme(theme === "dark" ? 'darija-dark' : 'darija-light');
          }
      });
  }, [theme]);

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
  };

  // --- Code Execution ---
  const runCode = async () => {
     if (isRunning) return; // Prevent multiple runs
     setIsRunning(true);
     setOutput([]); // Clear previous output immediately
     setShowCreatorCredit(false); // Hide credit on new run

    // Animate output panel clearing and indicate running
    if (outputPanelRef.current) {
       gsap.to(outputPanelRef.current, { opacity: 0.7, duration: 0.2 });
       // You could add a "Running..." placeholder here
    }

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

        // Restore output panel opacity regardless of result
         if (outputPanelRef.current) {
           gsap.to(outputPanelRef.current, { opacity: 1, duration: 0.3 });
         }

      if (data.error) {
          // Display error prominently with specific styling
           setOutput([`Ghalat!\n-------\n${data.error}`]);
            if (outputPanelRef.current?.children) {
                 gsap.fromTo(outputPanelRef.current.children,
                    { color: "#FF5555", x: -5, opacity: 0 }, // Start red, slightly left, invisible
                    { color:"hsl(var(--destructive))", x: 0, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)", stagger: 0.05 } // End themed destructive, centered, visible
                 );
            }
           toast({
              title: "Execution Failed",
              description: "Check the output panel for errors.",
              variant: "destructive",
              className: "toast-error" // Class for specific styling
          });
      } else {
           // Animate incoming success lines with themed color
           setOutput(data.output);
            if (outputPanelRef.current?.children) {
                 gsap.fromTo(outputPanelRef.current.children,
                    { opacity: 0, y: 10, color: "hsl(var(--output-success-text))" }, // Start invisible, below, themed success color
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" } // End visible, centered
                 );
            }
           toast({
              title: "Execution Successful!",
              description: "Code ran without errors.",
              className: "toast-success" // Class for specific styling
          });
      }

    } catch (error: any) {
        // Restore opacity on catch block too
         if (outputPanelRef.current) {
           gsap.to(outputPanelRef.current, { opacity: 1, duration: 0.3 });
         }
      console.error("Error executing code:", error);
      const errorMessage = `Error: ${error.message}`;
      setOutput([errorMessage]);
       if (outputPanelRef.current?.children) { // Error styling for network/fetch errors
            gsap.fromTo(outputPanelRef.current.children,
                { color: "#FF5555", x: -5, opacity: 0 },
                { color:"hsl(var(--destructive))", x: 0, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)", stagger: 0.05 }
            );
       }
      toast({
          title: "Execution Failed",
          description: "An unexpected error occurred.",
          variant: "destructive",
          className: "toast-error"
      });
    } finally {
        setIsRunning(false); // Re-enable run button
    }
  };

    // --- Algorithm Selection ---
    const handleSelectAlgorithm = (algorithmCode: string) => {
        setCode(algorithmCode);
        setAlgorithmsSidebarOpen(false); // Close sidebar on selection
         toast({
            title: "Algorithm Loaded",
            description: "The selected algorithm code is now in the editor.",
            className: "toast-info" // Optional class for info toasts
         });
         if (editorRef.current) {
             editorRef.current.focus(); // Focus editor after loading
         }
    };

     // --- Get Code ---
     const handleShowValue = () => {
        if (editorRef.current) {
             const currentCode = editorRef.current.getValue();
             console.log("Current Code:\n", currentCode);
             navigator.clipboard.writeText(currentCode)
                .then(() => {
                    toast({
                    title: "Code Copied!",
                    description: "Your code has been copied to the clipboard and logged to console.",
                    className: "toast-info"
                    });
                })
                .catch(err => {
                    console.error("Failed to copy code: ", err);
                     toast({
                        title: "Copy Failed",
                        description: "Could not copy code to clipboard.",
                        variant: "destructive",
                        className: "toast-error"
                    });
                });
        } else {
             toast({
                title: "Editor Not Ready",
                description: "The code editor isn't available yet.",
                variant: "destructive",
                className: "toast-error"
             });
        }
    }


  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-[#020013] to-[#0a081a] text-foreground overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between p-2 border-b border-border/20 bg-card/50 fade-in-element shadow-md">
        <h1 className="text-xl font-bold text-primary ide-title">
          <span className="text-[#50E3C2]">D</span>arija<span className="text-[#67F2D3]">S</span>cript IDE
        </h1>
        {/* Creator Credit in Header */}
        <div className="text-xs text-muted-foreground mr-4">
            Created by <a href="https://www.linkedin.com/in/mouaadidoufkir/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:text-[#50E3C2] transition-colors creator-link">MOUAAD IDOUFKIR</a>
        </div>
      </header>

      {/* Main IDE Layout */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow p-2 gap-2 fade-in-element" // Add gap between panels
        style={{ height: 'calc(100vh - 49px)'}} // Adjust height considering header
      >
        {/* Editor Panel */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="flex flex-col h-full bg-card rounded-lg shadow-lg overflow-hidden border border-border/30">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50 bg-card/80">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary-foreground/80"> <Code size={20} className="text-primary"/> Editor</h3>
              <div className="space-x-2 flex items-center">
                {/* Run Button with Gradient & Icon */}
                 <Button
                     size="sm"
                     onClick={runCode}
                     disabled={isRunning}
                     className={cn(
                        "bg-button-primary-gradient text-primary-foreground hover:opacity-90 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md", // Added shadow & transform
                        "relative overflow-hidden", // For potential pseudo-element effects
                         isRunning && "opacity-50 cursor-not-allowed animate-pulse", // Pulse animation when running
                        // Add a subtle glow effect on hover/focus (optional)
                         "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4CB7FF]"
                     )}
                     aria-label="Run Code"
                  >
                  <Play size={16} className={cn("mr-1", isRunning ? "animate-spin-slow" : "")}/> {/* Slow spin when running */}
                   {isRunning ? 'Running...' : 'Run Code'}
                 </Button>
                {/* Docs Button */}
                 <SheetTrigger asChild>
                    <Button size="sm" variant="secondary" className="bg-[#50E3C2] text-secondary-foreground hover:bg-[#67F2D3]/90 transition-colors duration-200 shadow-sm hover:shadow-md transform hover:scale-105" aria-label="Open Documentation">
                       <BookOpen size={16} className="mr-1"/> Docs
                    </Button>
                 </SheetTrigger>
                 {/* Algorithms Button */}
                 <Button size="sm" variant="outline" onClick={() => setAlgorithmsSidebarOpen(true)} className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105" aria-label="Open Algorithms Sidebar">
                    <Brain size={16} className="mr-1"/> Algorithms
                 </Button>
                 {/* Auto Save Button */}
                  <Button size="sm" variant="ghost" onClick={handleAutoSave} disabled={isSaving} title="Auto-saves on change" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Save Code (Auto)">
                    <Save size={16} className={cn("mr-1", isSaving ? "animate-pulse text-[#67F2D3]" : "")}/>
                     <span className={cn(isSaving ? "hidden" : "inline")}>Auto Save</span>
                     <span className={cn(isSaving ? "inline" : "hidden")}>Saved!</span>
                  </Button>
                  {/* Get Code Button (Removed as per previous request? Re-add if needed) */}
                 {/* <Button size="sm" variant="ghost" onClick={handleShowValue} title="Copy code to clipboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Code size={16} className="mr-1"/> Get Code
                  </Button> */}
              </div>
            </div>

            {/* Editor Component */}
            <div className="flex-grow relative"> {/* Added relative for potential overlays */}
               <Editor
                    height="100%" // Takes full height of its container
                    language="darijascript" // Use the registered language ID
                    value={code}
                    theme={theme === "dark" ? "darija-dark" : "darija-light"} // Use custom themes
                    onChange={handleCodeChange}
                    beforeMount={handleEditorWillMount}
                    onMount={handleEditorDidMount}
                    options={{
                        fontSize: 14,
                        minimap: { enabled: true, side: 'right', scale: 1, renderCharacters: false }, // Enable minimap
                        scrollBeyondLastLine: false,
                        wordWrap: 'on', // Enable word wrap
                        automaticLayout: true, // Ensure editor resizes correctly
                         roundedSelection: true,
                         cursorBlinking: 'smooth',
                         cursorSmoothCaretAnimation: 'on',
                         scrollbar: {
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10,
                            arrowSize: 12,
                            useShadows: true // Subtle shadows for scrollbars
                         },
                         renderLineHighlight: "gutter", // Highlight line number gutter too
                         selectOnLineNumbers: true,
                         lineNumbersMinChars: 3, // Adjust line number width
                    }}
                />
            </div>
          </div>
        </ResizablePanel>

        {/* Handle */}
        <ResizableHandle withHandle className="bg-border/50 w-2 hover:bg-primary transition-colors duration-200" />

         {/* Output Panel */}
         <ResizablePanel defaultSize={40} minSize={20}>
            <div className="flex flex-col h-full bg-card/90 rounded-lg shadow-lg overflow-hidden border border-border/30">
                {/* Output Header */}
                <div className="flex items-center justify-between p-3 border-b border-border/50 bg-card/80">
                 <h3 className="text-lg font-semibold flex items-center gap-2 text-primary-foreground/80"> <TerminalSquare size={20} className="text-secondary"/> Output (Natija)</h3>
                 <Button size="sm" variant="ghost" onClick={() => setOutput([])} title="Clear Output" className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Clear Output">
                    <RotateCcw size={16} className="mr-1"/> Clear
                 </Button>
                </div>

                {/* Output Display - Enhanced Styling */}
                <ScrollArea className="flex-grow p-4 font-mono text-sm bg-[#0A081A]/50">
                     <div ref={outputPanelRef}>
                         {output.length > 0 ? (
                             output.map((line, index) => (
                                 <div key={index} className={cn(
                                     "whitespace-pre-wrap break-words mb-1 leading-relaxed", // Allow wrapping, adjust line height
                                     line.toLowerCase().startsWith('ghalat') || line.toLowerCase().startsWith('error:') ? "text-destructive font-medium" : "text-foreground/90", // Use themed destructive color
                                     line.toLowerCase().startsWith('natija:') || line.toLowerCase().startsWith('output:') ? "text-primary font-medium" : "", // Themed primary for specific output lines
                                     "output-line" // Class for GSAP targeting
                                     )}>
                                     {line}
                                 </div>
                             ))
                         ) : (
                             <div className="text-muted-foreground italic output-line">
                                 {showCreatorCredit
                                    ? `Output will appear here. Click "Run Code"!\n\n{ DarijaScript IDE by MOUAAD IDOUFKIR }`
                                    : "No output yet. Run your code!"
                                 }
                             </div>
                         )}
                     </div>
                 </ScrollArea>
            </div>
         </ResizablePanel>
      </ResizablePanelGroup>

       {/* Documentation Sheet */}
      <Sheet>
         {/* SheetTrigger is in the Editor Header */}
         <SheetContent side="right" className="w-[650px] sm:w-[750px] bg-gradient-to-br from-[#050318] to-[#0f0d20] p-0 border-l border-border/40 shadow-2xl">
            <DarijaDocs />
         </SheetContent>
      </Sheet>

      {/* Algorithms Sidebar (uses its own internal Sheet mechanism) */}
      <AlgorithmsSidebar
          isOpen={algorithmsSidebarOpen}
          onClose={() => setAlgorithmsSidebarOpen(false)}
          onSelectAlgorithm={handleSelectAlgorithm}
      />

    </div>
  );
}

export default HomePage;

