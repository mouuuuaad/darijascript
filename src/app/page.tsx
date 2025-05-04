import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/docs/code-block';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import Editor from "@monaco-editor/react";
import { FunctionComponent, useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from "@/hooks/use-theme";
import { DarijaDocs } from '@/components/docs/darija-docs';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar';
import { SheetTrigger } from "@/components/ui/sheet";
import { gsap } from "gsap"; // Import GSAP

const LOCAL_STORAGE_CODE_KEY = 'darijascript_code';

const HomePage: FunctionComponent = () => {
  const { toast } = useToast()
  const editorRef = useRef(null);
  const [code, setCode] = useState('');
  const { theme } = useTheme();
  const [output, setOutput] = useState<string[]>([]);
    const [algorithmsSidebarOpen, setAlgorithmsSidebarOpen] = useState(false);
    const [showCreatorCredit, setShowCreatorCredit] = useState(true);


  useEffect(() => {
    const storedCode = localStorage.getItem(LOCAL_STORAGE_CODE_KEY);
    if (storedCode) {
      setCode(storedCode);
    }

        // GSAP fade-in animation
        gsap.fromTo(".fade-in-element",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.2 }
        );
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CODE_KEY, code);
  }, [code]);

  const handleEditorWillMount = (monaco) => {
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: 'console.log',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'console.log(${1})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          }
        ];
        return { suggestions: suggestions };
      }
    });
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  }

  const handleShowValue = () => {
    if (editorRef.current) {
      console.log("value: ", editorRef.current.getValue());
        toast({
          title: "Code Copied!",
          description: "Your code has been copied to the console.",
        })
    }
  }

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

    const handleSelectAlgorithm = (algorithmCode: string) => {
        setCode(algorithmCode); // Set the editor's code
        setAlgorithmsSidebarOpen(false); // Close the sidebar
    };

  const runCode = async () => {
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      setOutput(data.output);
        setShowCreatorCredit(false);
    } catch (error: any) {
      console.error("Error executing code:", error);
        toast({
          title: "Execution Failed",
          description: "There was an error executing your code.",
           variant: "destructive",
        });
      setOutput([`Error: ${error.message}`]);
    }
  };

  return (
    
      {/* IDE Layout - Resizable Panels */}
      
        
          {/* Editor Panel */}
          <div className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-3 border-b bg-card text-card-foreground">
              <h3 className="text-lg font-semibold">DarijaScript IDE</h3>
              <div className="space-x-2">
                 <Button size="sm" variant="secondary" onClick={runCode}>
                  Run Code
                </Button>
                <SheetTrigger asChild>
                    <Button size="sm" variant="outline">Docs</Button>
                 </SheetTrigger>
                 <Button size="sm" variant="ghost" onClick={handleShowValue}>
                    Get Code
                 </Button>
                                 <Button size="sm" variant="ghost" onClick={() => setAlgorithmsSidebarOpen(true)}>
                                    Algorithms
                                </Button>
              </div>
            </div>

            {/* Editor Component */}
            <div className="flex-grow overflow-auto rounded-md">
              <Editor
                height="calc(100% - 56px)" // Dynamic height calculation
                defaultLanguage="javascript"
                value={code}
                theme={theme === "dark" ? "vs-dark" : "light"}
                onChange={handleCodeChange}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
              />
            </div>
          </div>
        
        
          {/* Output Panel */}
          <div className="flex flex-col h-full">
            {/* Output Header */}
            <div className="flex items-center justify-between p-3 border-b bg-card text-card-foreground">
              <h3 className="text-lg font-semibold">Output (Natija)</h3>
            </div>

            {/* Output Display */}
            <div className="p-4 overflow-y-auto">
               {output.length > 0 ? (
                  output.map((line, index) => (
                     
                        {line}
                     
                  ))
               ) : (
                  
                     No output yet. Run your code to see the result.
                  
               )}
                 {showCreatorCredit && (
                    
                        Crafted with passion by MOUAAD IDOUFKIR
                    
                 )}
            </div>
          </div>
        
      

      {/* Documentation Sheet */}
      
         
            <DarijaDocs />
         
      

            {/* Algorithms Sidebar */}
             
                <AlgorithmsSidebar
                    isOpen={algorithmsSidebarOpen}
                    onClose={() => setAlgorithmsSidebarOpen(false)}
                    onSelectAlgorithm={handleSelectAlgorithm}
                />
             
    
  );
}

export default HomePage;
