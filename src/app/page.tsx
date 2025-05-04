
'use client';

import Editor, { Monaco, loader } from "@monaco-editor/react"; // Ensure loader is imported if used
import type * as monacoEditor from 'monaco-editor'; // Import monaco types
import {
  FunctionComponent,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'; // Import from local UI component
import { ResizableHandle as ResizableHandleUi } from '@/components/ui/resizable'; // Keep this alias if you use the specific UI handle elsewhere
import { DarijaDocs } from '@/components/docs/darija-docs';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { interpret } from '@/lib/darijascript/interpreter';
import { setupDarijaScriptLanguage } from '@/lib/darijascript/monaco-config';
import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar';
import { gsap } from 'gsap';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'; // Import DialogContent
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Import SheetContent, SheetTrigger
import { Brain, BookOpen, Play, Save, Check } from 'lucide-react'; // Import icons

const initialCode = `
// Salam! Ktbo l code dyalkom hna

tbe3("DarijaScript is running!");

`;

function runCode(code: string, outputCallback: (output: string[]) => void) {
  const result = interpret(code);
  if (result.output) {
    outputCallback(result.output);
  } else if (result.error) {
    // Ensure error messages are styled or prefixed
    outputCallback([`Ghalat!: ${result.error}`]);
  } else {
    outputCallback(['No output.']);
  }
}

interface HomePageProps {}
const HomePage: FunctionComponent<HomePageProps> = ({}) => {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [algorithmsSidebarOpen, setAlgorithmsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const monacoRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null); // useRef for Monaco editor instance
  const editorContainerRef = useRef<HTMLDivElement | null>(null); // Ref for editor container

  // GSAP Animation Refs
   const titleRef = useRef(null);
   const buttonRef = useRef(null);
   const editorRef = useRef(null); // Ref for the editor panel
   const outputRef = useRef(null); // Ref for the output panel

   useEffect(() => {
     // Simple GSAP fade-in animations on mount
     gsap.fromTo(titleRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 });
     gsap.fromTo(buttonRef.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)", delay: 0.5 });
     gsap.fromTo(editorRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", delay: 0.7 });
     gsap.fromTo(outputRef.current, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", delay: 0.9 });
    }, []);

   const handleEditorWillMount = useCallback((monaco: Monaco) => {
     setupDarijaScriptLanguage(monaco);
      // Define a custom theme matching the app's dark theme
     monaco.editor.defineTheme('darijaDark', {
       base: 'vs-dark', // Start with the VS Dark theme
       inherit: true,
       rules: [
         { token: 'keyword', foreground: '3BACFF' }, // Primary color for keywords
         { token: 'support.function.builtin', foreground: '50E3C2' }, // Accent color for builtins
         { token: 'number', foreground: '67F2D3' }, // Dual button color for numbers
         { token: 'string', foreground: 'FFD700' }, // Gold for strings
         { token: 'comment', foreground: '888888', fontStyle: 'italic' },
         { token: 'identifier', foreground: 'FFFFFF' }, // White for identifiers
         { token: 'operator', foreground: '50E3C2' }, // Accent color for operators
         // Add more rules as needed
       ],
       colors: {
         'editor.background': '#020013', // Dark background
         'editor.foreground': '#FFFFFF', // White text
         'editorCursor.foreground': '#50E3C2', // Accent cursor
         'editor.lineHighlightBackground': '#0A0C2F', // Slightly lighter line highlight
         'editorLineNumber.foreground': '#6c757d', // Muted line numbers
         'editor.selectionBackground': '#3CACFF30', // Primary color selection (semi-transparent)
         'editorWidget.background': '#0A0C2F', // Background for widgets like find
         'editorWidget.border': '#3BACFF', // Primary border for widgets
       }
     });
   }, []);

   const handleEditorDidMount = useCallback((editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) => {
      monacoRef.current = editor;
      editorContainerRef.current = editor.getDomNode(); // Get the actual DOM node
      // Set the custom theme
      monaco.editor.setTheme('darijaDark');
      // Auto-resize layout logic could go here if needed
      // For example: editor.layout();
      // Ensure editor layout adjusts on container resize if using ResizablePanelGroup
      const observer = new ResizeObserver(() => {
        editor.layout();
      });
      if (editorContainerRef.current?.parentElement) {
        observer.observe(editorContainerRef.current.parentElement);
      }
      return () => observer.disconnect(); // Cleanup observer
    }, []);


  const handleRunClick = () => {
     if (!monacoRef.current) return;
    setIsRunning(true);
    setOutput([]); // Clear previous output
    const currentCode = monacoRef.current.getValue();
    runCode(currentCode, outputLines => {
      setOutput(outputLines);
      setIsRunning(false);
      // Animate output panel appearance
      gsap.fromTo(outputRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    });
  };

  const triggerAutoSave = useCallback(() => {
    setIsSaving(true);
    setIsSaved(false); // Reset saved status

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Simulate saving delay
    saveTimeoutRef.current = setTimeout(() => {
      // Actual save logic would go here (e.g., localStorage, API call)
      // localStorage.setItem('darijascript_code', code);
      setIsSaving(false);
      setIsSaved(true);

        toast({
         title: "Code Saved!",
         description: "Your progress has been automatically saved.",
         className: "toast-autosave" // Use custom class for styling
        });


      // Hide the "Saved" checkmark after a bit
      setTimeout(() => setIsSaved(false), 2000);
    }, 1500); // 1.5 second delay
  }, [toast]); // Add toast to dependency array


  const handleCodeChange = (value: string | undefined) => {
     const newCode = value || '';
    setCode(newCode);
    setIsSaved(false); // Reset saved status on change
     if (isSaving && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        setIsSaving(false); // Stop the previous save if typing continues
     }
    // Debounce the autosave trigger
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
     saveTimeoutRef.current = setTimeout(triggerAutoSave, 2000); // Trigger save 2s after last change
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);


  // Callback to load algorithm code into the editor
  const loadAlgorithmCode = (algorithmCode: string) => {
    if (monacoRef.current) {
      monacoRef.current.setValue(algorithmCode);
      setCode(algorithmCode); // Update the code state as well
      setOutput([]); // Clear output when loading new code
    }
    setAlgorithmsSidebarOpen(false); // Close the sidebar after loading
     toast({
         title: "Algorithm Loaded",
         description: "The example code is ready in the editor.",
      });
     // Optional: Animate editor focus or highlight
     gsap.fromTo(editorRef.current, { scale: 1.02 }, { scale: 1, duration: 0.3, ease: "power2.inOut" });
  };


  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-[hsl(244,80%,6%)]">
      {/* Top Header - Title */}
       <header ref={titleRef} className="p-3 text-center border-b border-border/20 shadow-sm">
        <h1 className="text-2xl font-bold text-primary tracking-wide">
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">DarijaScript IDE</span> ✨
        </h1>
       </header>


      {/* Main Content Area */}
      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Editor Header */}
              <div ref={buttonRef} className="flex items-center justify-between p-3 border-b bg-card text-card-foreground shadow-md">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRunClick}
                    disabled={isRunning}
                    className="bg-button-primary-gradient text-primary-foreground hover:opacity-90 transition-opacity shadow-sm hover:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    size="sm"
                  >
                    <Play size={16} className={cn('mr-1', isRunning ? 'animate-spin-slow' : '')}/> {/* Slow spin when running */}
                    {isRunning ? 'Running...' : 'Run Code'}
                  </Button>
                  {/* Docs Button inside Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-secondary/50 text-secondary hover:bg-secondary/10 hover:text-secondary focus:ring-secondary/50">
                        <BookOpen size={16} className="mr-1" /> Docs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col"> {/* Adjust size and add flex */}
                       {/* Ensure DarijaDocs takes full height */}
                       <div className="flex-grow overflow-hidden">
                           <DarijaDocs />
                       </div>
                    </DialogContent>
                  </Dialog>
                  {/* Algorithms Button inside Sheet */}
                   <Sheet open={algorithmsSidebarOpen} onOpenChange={setAlgorithmsSidebarOpen}>
                     <SheetTrigger asChild>
                        <Button
                           variant="outline"
                           size="sm"
                           className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent focus:ring-accent/50" // Dual color styling
                         >
                            <Brain size={16} className="mr-1" /> Algorithms
                         </Button>
                     </SheetTrigger>
                     <SheetContent side="left" className="w-80 p-0 border-r border-border/30 bg-sidebar"> {/* Adjust width, remove padding */}
                         <AlgorithmsSidebar
                             isOpen={algorithmsSidebarOpen} // Pass state if needed internally by sidebar
                             onClose={() => setAlgorithmsSidebarOpen(false)}
                             onSelectAlgorithm={loadAlgorithmCode}
                         />
                     </SheetContent>
                  </Sheet>
                </div>
                 {/* Autosave Indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isSaving && (
                      <>
                          <Save size={14} className="animate-pulse text-primary"/> Saving...
                      </>
                  )}
                  {isSaved && !isSaving && (
                      <>
                          <Check size={14} className="text-secondary"/> Saved
                      </>
                  )}
                </div>
              </div>
              {/* Content Column: Monaco Editor + Output */}
              <ResizablePanelGroup direction="vertical" className="flex-grow">
                <ResizablePanel defaultSize={75} minSize={25}>
                  {/* Editor ref applied here */}
                  <div ref={editorRef} className="h-full w-full overflow-hidden">
                     <Editor
                        height="100%" // Use 100% height
                        language="darijascript"
                        theme="darijaDark" // Use custom theme
                        value={code}
                        onChange={handleCodeChange}
                        onMount={handleEditorDidMount} // Use the new handler
                        beforeMount={handleEditorWillMount} // Pass the pre-mount setup
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          scrollBeyondLastLine: false,
                          automaticLayout: true, // Ensure editor resizes
                          wordWrap: 'on', // Enable word wrap
                          padding: { top: 10, bottom: 10 }, // Add some padding
                        }}
                      />
                   </div>
                </ResizablePanel>
                 <ResizableHandleUi withHandle />
                <ResizablePanel defaultSize={25} minSize={10}>
                  {/* Output Panel ref applied here */}
                  <div ref={outputRef} className="h-full flex flex-col bg-[hsl(var(--docs-code-bg))] text-sm font-mono border-t border-border">
                    <div className="p-3 border-b border-border/50 text-foreground/80 font-semibold bg-card/50">
                      Output (Natija)
                    </div>
                    <div className="flex-grow p-4 overflow-auto">
                      {output.map((line, index) => (
                        <pre
                          key={index}
                          className={cn(
                            "whitespace-pre-wrap mb-1", // Ensure wrapping
                            line.toLowerCase().startsWith("ghalat!") ? "text-destructive" : "text-output-success-text" // Conditional styling
                          )}
                        >
                          {/* Remove 'Ghalat!:' prefix for display if present */}
                          {line.toLowerCase().startsWith("ghalat!:") ? line.substring(7).trim() : line}
                        </pre>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>

          {/* Removed the fixed Docs Panel */}

        </ResizablePanelGroup>
      </main>

      {/* Algorithm Sidebar logic moved inside the header button Sheet */}

      {/* Footer */}
      <footer className="p-2 text-center text-xs text-muted-foreground border-t border-border/20 bg-background">
        Crafted with passion by <a href="https://github.com/MOUAADIDO" target="_blank" rel="noopener noreferrer" className="creator-name font-bold text-primary hover:text-secondary transition-colors">MOUAAD IDOUFKIR</a>
      </footer>
    </div>
  );
};

export default HomePage;

    