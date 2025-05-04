'use client';

import Editor, {Monaco, loader} from '@monaco-editor/react'; // Ensure loader is imported if used
import type * as monacoEditor from 'monaco-editor'; // Import monaco types
import {
  FunctionComponent,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {useRouter} from 'next/navigation';
import {ResizablePanel, ResizablePanelGroup, ResizableHandle} from 'react-resizable-panels';
import {ResizableHandle as ResizableHandleUi} from '@/components/ui/resizable';
import {panels} from 'react-resizable-panels';
import {Panel} from 'react-resizable-panels';

import {useTheme} from '@/hooks/use-theme'; // Assuming this hook exists and works
import {DarijaDocs} from '@/components/docs/darija-docs';
import {useToast} from '@/hooks/use-toast';
import {cn} from '@/lib/utils';
import {interpret} from '@/lib/darijascript/interpreter';
import {setupDarijaScriptLanguage} from '@/lib/darijascript/monaco-config';
import {AlgorithmsSidebar} from '@/components/ide/algorithms-sidebar';

import {Button} from '@/components/ui/button';
import {Brain, BookOpen, Play} from 'lucide-react';
import {Dialog, DialogTrigger} from '@/components/ui/dialog';
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet';

const initialCode = `
// Salam! Ktbo l code dyalkom hna

tbe3("DarijaScript is running!");

`;

function runCode(code: string, outputCallback: (output: string[]) => void) {
  const result = interpret(code);
  if (result.output) {
    outputCallback(result.output);
  } else if (result.error) {
    outputCallback([`Ghalat: ${result.error}`]);
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

  const monacoRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null); // useRef for Monaco editor instance
  const editorRef = useRef<HTMLDivElement | null>(null); // useRef for the editor div

  const router = useRouter();

  const {theme, toggleTheme} = useTheme(); // Destructure theme and toggleTheme

  const handleEditorWillMount = useCallback((monaco: Monaco) => {
    setupDarijaScriptLanguage(monaco);
  }, []);

  const handleEditorDidMount = useCallback((editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    monacoRef.current = editor; // Store the editor instance in the ref
  }, []);

  const handleRunClick = () => {
    setIsRunning(true);
    setOutput([]); // Clear previous output
    runCode(code, outputLines => {
      setOutput(outputLines);
      setIsRunning(false);
    });
  };

  // Callback to load algorithm code into the editor
  const loadAlgorithmCode = (algorithmCode: string) => {
    if (monacoRef.current) {
      monacoRef.current.setValue(algorithmCode);
      setCode(algorithmCode); // Update the code state as well
    }
    setAlgorithmsSidebarOpen(false); // Close the sidebar after loading
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  return (
    
      
        {/* Editor Panel */}
        
          {/* Editor Header */}
          
            
            
            
            
              <Play size={16} className={cn('mr-1', isRunning ? 'animate-spin-slow' : '')} />{' '}
              {/* Slow spin when running */}
              {isRunning ? 'Running...' : 'Run Code'}
            
            {/* Docs Button inside Dialog */}
            
              
                
                  
                    
                     Docs
                  
                
              
            
            {/* Algorithms Button */}
            
              
                
                  
                     Algorithms
                  
                
              
            
          
          {/* Content Column: Monaco Editor + Output */}
          
            
               monacoRef.current?.layout();
              }}
            />
             
            {/* Output Panel */}
            
              Output (Natija)
              {output.map((line, index) => (
                
                  {line}
                
              ))}
            
          
        
      
      {/* End IDE (ResizablePanelGroup) */}
      {/* Algorithm Sidebar (Off-Canvas) */}
      <AlgorithmsSidebar
        isOpen={algorithmsSidebarOpen}
        onClose={() => setAlgorithmsSidebarOpen(false)}
        onSelectAlgorithm={loadAlgorithmCode}
      />
       
        Crafted with passion by MOUAAD IDOUFKIR
      
    
  );
};

export default HomePage;
