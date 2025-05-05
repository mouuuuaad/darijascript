

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
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable'; // Use ShadCN UI components directly
import { DarijaDocs } from '@/components/docs/darija-docs';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { interpret } from '@/lib/darijascript/interpreter';
import { setupDarijaScriptLanguage } from '@/lib/darijascript/monaco-config';
import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar';
import { WelcomeOverlay } from '@/components/welcome/welcome-overlay'; // Import the WelcomeOverlay
import { gsap } from 'gsap';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Brain, BookOpen, Play, Save, Check, Loader } from 'lucide-react';

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
  const [showWelcome, setShowWelcome] = useState(false); // State for welcome overlay
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const monacoRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // GSAP Animation Refs
  const titleRef = useRef(null);
  const editorSectionRef = useRef(null); // Ref for the entire editor/output section

  useEffect(() => {
     // Check localStorage for first visit
     const hasVisited = localStorage.getItem('hasSeenWelcomeOverlay');
     if (!hasVisited) {
       setShowWelcome(true);
     }

     // Simple GSAP fade-in animations on mount
     gsap.fromTo(titleRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 });
     gsap.fromTo(editorSectionRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 });
    }, []);


  const handleWelcomeClose = () => {
    localStorage.setItem('hasSeenWelcomeOverlay', 'true');
    setShowWelcome(false);
  };


   const handleEditorWillMount = useCallback((monaco: Monaco) => {
     setupDarijaScriptLanguage(monaco);
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

    // Animate Run button
    gsap.to(buttonRef.current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });

    runCode(currentCode, outputLines => {
      setOutput(outputLines);
      setIsRunning(false);
      // Animate output panel appearance (e.g., fade in lines)
      gsap.fromTo(".output-line", // Target individual lines if possible or the container
          { opacity: 0, y: 5 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
      );
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
     gsap.fromTo(editorContainerRef.current, { scale: 1.02 }, { scale: 1, duration: 0.3, ease: "power2.inOut" });
  };

  // Ref for the Run Code button to apply GSAP animation
  const buttonRef = useRef(null);


  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-[hsl(244,80%,6%)]">
       {/* Render Welcome Overlay conditionally */}
       {showWelcome && <WelcomeOverlay onClose={handleWelcomeClose} />}

      {/* Top Header - Title */}
       <header ref={titleRef} className="p-3 text-center border-b border-border/20 shadow-sm flex-shrink-0">
        <h1 className="text-2xl font-bold text-primary tracking-wide">
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">DarijaScript IDE</span> ✨
        </h1>
       </header>


      {/* Main Content Area - Uses Flexbox for layout */}
      {/* On medium screens and up (md:), use flex-row. On smaller screens, default is flex-col */}
      <main ref={editorSectionRef} className="flex-grow overflow-hidden p-2 md:p-4">
         {/* Resizable Panel Group for Desktop Layout */}
        <ResizablePanelGroup direction="horizontal" className="h-full hidden md:flex">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex flex-col h-full bg-card rounded-lg shadow-lg border border-border/20 overflow-hidden">
              {/* Editor Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/30 bg-[hsl(var(--card)-foreground)/5] text-card-foreground flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    ref={buttonRef} // Add ref here
                    onClick={handleRunClick}
                    disabled={isRunning}
                    className="bg-button-primary-gradient text-primary-foreground hover:opacity-90 transition-opacity shadow-sm hover:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    size="sm"
                  >
                    {isRunning ? <Loader size={16} className="mr-1 animate-spin"/> : <Play size={16} className={cn("mr-1", isRunning ? "animate-spin-slow" : "")}/>} {/* Slow spin when running */}
                    {isRunning ? 'Running...' : 'Run Code'}
                  </Button>
                  {/* Docs Button inside Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-secondary/50 text-secondary hover:bg-secondary/10 hover:text-secondary focus:ring-secondary/50">
                        <BookOpen size={16} className="mr-1" /> Docs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0"> {/* Remove padding */}
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
                          <Loader size={14} className="animate-spin text-primary"/> Saving...
                      </>
                  )}
                  {isSaved && !isSaving && (
                      <>
                          <Check size={14} className="text-secondary"/> Saved
                      </>
                  )}
                   {!isSaving && !isSaved && (
                      <span className="opacity-50">Auto-save active</span>
                   )}
                </div>
              </div>
              {/* Content Column: Monaco Editor */}
              <div ref={editorContainerRef} className="h-full w-full overflow-hidden flex-grow">
                 <Editor
                    height="100%" // Use 100% height
                    language="darijascript"
                    theme="darijaDark" // Use custom theme
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount} // Use the new handler
                    beforeMount={handleEditorWillMount} // Pass the pre-mount setup
                    options={{
                      minimap: { enabled: true, scale: 0.8 },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      automaticLayout: true, // Ensure editor resizes
                      wordWrap: 'on', // Enable word wrap
                      padding: { top: 10, bottom: 10 }, // Add some padding
                       renderLineHighlight: "gutter",
                      scrollbar: {
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                        arrowSize: 12
                       }
                    }}
                  />
               </div>
            </div>
          </ResizablePanel>

           <ResizableHandle withHandle className="hidden md:flex" />

           {/* Output Panel */}
           <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full flex flex-col bg-[hsl(var(--docs-code-bg))] text-sm font-mono border border-border/20 rounded-lg shadow-lg overflow-hidden">
                <div className="p-3 border-b border-border/50 text-foreground/80 font-semibold bg-card/50 flex-shrink-0">
                  Output (Natija)
                </div>
                <div className="flex-grow p-4 overflow-auto">
                  {output.map((line, index) => (
                    <pre
                      key={index}
                      className={cn(
                        "output-line whitespace-pre-wrap mb-1", // Ensure wrapping, add class for animation
                        line.toLowerCase().startsWith("ghalat!") ? "text-destructive" : "text-output-success-text" // Conditional styling
                      )}
                    >
                      {line.toLowerCase().startsWith("ghalat!:") ? line.substring(7).trim() : line}
                    </pre>
                  ))}
                </div>
              </div>
           </ResizablePanel>
        </ResizablePanelGroup>

        {/* Mobile Layout (Stacked Editor and Output) */}
        <div className="flex flex-col h-full md:hidden space-y-4">
            {/* Editor Section (Mobile) */}
           <div className="flex flex-col h-[60vh] bg-card rounded-lg shadow-lg border border-border/20 overflow-hidden">
              {/* Editor Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/30 bg-[hsl(var(--card)-foreground)/5] text-card-foreground flex-shrink-0">
                 <div className="flex items-center gap-2">
                   <Button
                     ref={buttonRef}
                     onClick={handleRunClick}
                     disabled={isRunning}
                     className="bg-button-primary-gradient text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
                     size="sm"
                   >
                     {isRunning ? <Loader size={16} className="mr-1 animate-spin"/> : <Play size={16} className="mr-1"/>}
                     {isRunning ? '...' : 'Run'} {/* Shorter label for mobile */}
                   </Button>
                    {/* Docs Dialog Trigger */}
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button variant="outline" size="icon" className="border-secondary/50 text-secondary hover:bg-secondary/10 w-9 h-9">
                         <BookOpen size={16} />
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                       <div className="flex-grow overflow-hidden">
                           <DarijaDocs />
                       </div>
                    </DialogContent>
                   </Dialog>
                    {/* Algorithms Sheet Trigger */}
                    <Sheet open={algorithmsSidebarOpen} onOpenChange={setAlgorithmsSidebarOpen}>
                     <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="border-accent/50 text-accent hover:bg-accent/10 w-9 h-9">
                           <Brain size={16} />
                         </Button>
                     </SheetTrigger>
                     <SheetContent side="left" className="w-72 p-0 border-r border-border/30 bg-sidebar">
                         <AlgorithmsSidebar
                             isOpen={algorithmsSidebarOpen}
                             onClose={() => setAlgorithmsSidebarOpen(false)}
                             onSelectAlgorithm={loadAlgorithmCode}
                         />
                     </SheetContent>
                  </Sheet>
                 </div>
                  {/* Autosave Indicator (Mobile) */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isSaving && <Loader size={14} className="animate-spin text-primary"/>}
                  {isSaved && !isSaving && <Check size={14} className="text-secondary"/>}
                  </div>
              </div>
              {/* Editor (Mobile) */}
               <div ref={editorContainerRef} className="h-full w-full overflow-hidden flex-grow">
                 <Editor
                    height="100%"
                    language="darijascript"
                    theme="darijaDark"
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount}
                    beforeMount={handleEditorWillMount}
                     options={{
                       minimap: { enabled: false }, // Disable minimap on mobile
                       fontSize: 13, // Slightly smaller font for mobile
                       scrollBeyondLastLine: false,
                       automaticLayout: true,
                       wordWrap: 'on',
                       padding: { top: 8, bottom: 8 }, // Reduced padding
                        lineNumbers: 'off', // Hide line numbers on mobile
                       scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
                     }}
                  />
               </div>
            </div>

             {/* Output Section (Mobile) */}
             <div className="flex flex-col h-[35vh] bg-[hsl(var(--docs-code-bg))] text-sm font-mono border border-border/20 rounded-lg shadow-lg overflow-hidden">
               <div className="p-3 border-b border-border/50 text-foreground/80 font-semibold bg-card/50 flex-shrink-0">
                 Output (Natija)
               </div>
               <div className="flex-grow p-3 overflow-auto"> {/* Reduced padding */}
                 {output.map((line, index) => (
                   <pre
                     key={index}
                     className={cn(
                        "output-line whitespace-pre-wrap mb-1 text-xs", // Smaller text on mobile
                        line.toLowerCase().startsWith("ghalat!") ? "text-destructive" : "text-output-success-text"
                      )}
                   >
                     {line.toLowerCase().startsWith("ghalat!:") ? line.substring(7).trim() : line}
                   </pre>
                 ))}
               </div>
             </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-2 text-center text-xs text-muted-foreground border-t border-border/20 bg-background flex-shrink-0">
        Crafted with passion by <a href="https://github.com/MOUAADIDO" target="_blank" rel="noopener noreferrer" className="creator-name font-bold text-primary hover:text-secondary transition-colors">MOUAAD IDOUFKIR</a>
      </footer>
    </div>
  );
};

export default HomePage;
