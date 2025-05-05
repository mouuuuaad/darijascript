'use client';

import Editor, { Monaco, loader } from "@monaco-editor/react";
import type * as monacoEditor from 'monaco-editor';
import {
  FunctionComponent,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { DarijaDocs } from '@/components/docs/darija-docs';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { interpret } from '@/lib/darijascript/interpreter';
import { setupDarijaScriptLanguage } from '@/lib/darijascript/monaco-config';
import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar';
import { WelcomeOverlay } from '@/components/welcome/welcome-overlay';
import { gsap } from 'gsap';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  BookOpen, 
  Play, 
  Save, 
  Check, 
  Loader,
  Code,
  Settings,
  Sun,
  Moon,
  RefreshCw,
  Clipboard,
  Share2,
  Download,
  Upload,
  Bookmark,
  Plus,
  Trash,
  KeyRound,
  Zap,
  X,
  Menu,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';

const initialCode = `
// Salam! Ktbo l code dyalkom hna

tbe3("DarijaScript is running!");
`;

// Sample snippets for the snippets library
const initialSnippets = [
  {
    id: 'snippet-1',
    name: 'Hello World',
    description: 'Basic hello world example',
    code: 'tbe3("Salam Labas!");'
  },
  {
    id: 'snippet-2',
    name: 'For Loop',
    description: 'Simple for loop example',
    code: 'l7ad(i = 1; i <= 5; i++) {\n  tbe3("Number: " + i);\n}'
  },
  {
    id: 'snippet-3',
    name: 'Function',
    description: 'Basic function example',
    code: 'dalla slm(smiya) {\n  tbe3("Salam " + smiya + "!");\n}\n\nslm("Mouad");'
  }
];

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function runCode(code, outputCallback, options = {}) {
  const { showRunningIndicator = true } = options;
  
  if (showRunningIndicator) {
    outputCallback(['Running code...']);
  }
  
  // Use setTimeout to ensure UI updates before execution
  setTimeout(() => {
    const result = interpret(code);
    if (result.output) {
      outputCallback(result.output);
    } else if (result.error) {
      outputCallback([`Ghalat!: ${result.error}`]);
    } else {
      outputCallback(['No output.']);
    }
  }, 10);
}

// Generate unique ID for snippets
const generateId = () => `snippet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const HomePage = () => {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [algorithmsSidebarOpen, setAlgorithmsSidebarOpen] = useState(false);
  const [snippetsSidebarOpen, setSnippetsSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [autoRun, setAutoRun] = useState(false);
  const [autoRunDelay, setAutoRunDelay] = useState(1000);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [snippets, setSnippets] = useState(initialSnippets);
  const [newSnippetName, setNewSnippetName] = useState('');
  const [newSnippetDesc, setNewSnippetDesc] = useState('');
  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false);
  const [mobileView, setMobileView] = useState('editor'); // 'editor' or 'output'
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRunTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const monacoRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // GSAP Animation Refs
  const titleRef = useRef(null);
  const editorSectionRef = useRef(null);
  const buttonRef = useRef(null);
  const outputRef = useRef(null);

  // Effect to handle the welcome screen
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasSeenWelcomeOverlay');
    if (!hasVisited) {
      setShowWelcome(true);
    }

    // Load saved settings from local storage
    const savedSettings = localStorage.getItem('darijaIdeSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setTheme(settings.theme || 'dark');
      setAutoRun(settings.autoRun || false);
      setAutoRunDelay(settings.autoRunDelay || 1000);
      setFontSize(settings.fontSize || 14);
      setWordWrap(settings.wordWrap !== undefined ? settings.wordWrap : true);
      setMinimap(settings.minimap !== undefined ? settings.minimap : true);
      setLineNumbers(settings.lineNumbers !== undefined ? settings.lineNumbers : true);
    }

    // Load saved snippets
    const savedSnippets = localStorage.getItem('darijaIdeSnippets');
    if (savedSnippets) {
      setSnippets(JSON.parse(savedSnippets));
    }

    // Load saved code
    const savedCode = localStorage.getItem('darijaIdeCode');
    if (savedCode) {
      setCode(savedCode);
    }

    // GSAP animations
    gsap.fromTo(titleRef.current, 
      { opacity: 0, y: -20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
    );
    gsap.fromTo(editorSectionRef.current, 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 }
    );
  }, []);

  // Save settings to local storage
  useEffect(() => {
    localStorage.setItem('darijaIdeSettings', JSON.stringify({
      theme,
      autoRun,
      autoRunDelay,
      fontSize,
      wordWrap,
      minimap,
      lineNumbers
    }));

    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme, autoRun, autoRunDelay, fontSize, wordWrap, minimap, lineNumbers]);

  // Save snippets to local storage
  useEffect(() => {
    localStorage.setItem('darijaIdeSnippets', JSON.stringify(snippets));
  }, [snippets]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (autoRunTimeoutRef.current) clearTimeout(autoRunTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
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
    editorContainerRef.current = editor.getDomNode();
    
    // Set the custom theme
    monaco.editor.setTheme('darijaDark');
    
    // Set up keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunClick();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, (e) => {
      e.preventDefault();
      triggerManualSave();
    });

    // Auto-resize editor on container resize
    const observer = new ResizeObserver(() => {
      editor.layout();
    });
    
    if (editorContainerRef.current?.parentElement) {
      observer.observe(editorContainerRef.current.parentElement);
    }
    
    return () => observer.disconnect();
  }, []);

  const handleRunClick = () => {
    if (!monacoRef.current) return;
    setIsRunning(true);
    setOutput([]); // Clear output
    
    const currentCode = monacoRef.current.getValue();
    
    // Animate Run button
    gsap.to(buttonRef.current, { 
      scale: 0.95, 
      duration: 0.1, 
      yoyo: true, 
      repeat: 1 
    });
    
    // Save the code to localStorage
    localStorage.setItem('darijaIdeCode', currentCode);
    
    runCode(currentCode, (outputLines) => {
      setOutput(outputLines);
      setIsRunning(false);
      
      // Animate output panel
      gsap.fromTo(
        ".output-line", 
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
      );
    });
  };

  const triggerAutoSave = useCallback(() => {
    setIsSaving(true);
    setIsSaved(false);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Simulate saving delay
    saveTimeoutRef.current = setTimeout(() => {
      // Save code to localStorage
      if (monacoRef.current) {
        const currentCode = monacoRef.current.getValue();
        localStorage.setItem('darijaIdeCode', currentCode);
      }
      
      setIsSaving(false);
      setIsSaved(true);

      toast({
        title: "Code Saved!",
        description: "Your progress has been automatically saved.",
        className: "toast-autosave"
      });

      // Hide the "Saved" indicator after 2 seconds
      setTimeout(() => setIsSaved(false), 2000);
    }, 1500);
  }, [toast]);

  const triggerManualSave = () => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    setIsSaved(false);
    
    // Save immediately
    if (monacoRef.current) {
      const currentCode = monacoRef.current.getValue();
      localStorage.setItem('darijaIdeCode', currentCode);
    }
    
    setIsSaving(false);
    setIsSaved(true);
    
    toast({
      title: "Code Saved!",
      description: "Your code has been saved.",
      className: "toast-save"
    });
    
    // Hide the "Saved" indicator after 2 seconds
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    setIsSaved(false);
    
    // Handle autorun functionality
    if (autoRun) {
      if (autoRunTimeoutRef.current) {
        clearTimeout(autoRunTimeoutRef.current);
      }
      
      autoRunTimeoutRef.current = setTimeout(() => {
        if (monacoRef.current) {
          setIsRunning(true);
          setOutput(['Running code automatically...']);
          
          const currentCode = monacoRef.current.getValue();
          runCode(currentCode, (outputLines) => {
            setOutput(outputLines);
            setIsRunning(false);
            
            // Animate output panel
            gsap.fromTo(
              ".output-line", 
              { opacity: 0, y: 5 },
              { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
            );
          }, { showRunningIndicator: false });
        }
      }, autoRunDelay);
    }
    
    // Handle autosave
    if (isSaving && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      setIsSaving(false);
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(triggerAutoSave, 2000);
  };

  const loadAlgorithmCode = (algorithmCode: string) => {
    if (monacoRef.current) {
      monacoRef.current.setValue(algorithmCode);
      setCode(algorithmCode);
      setOutput([]);
    }
    setAlgorithmsSidebarOpen(false);
    
    toast({
      title: "Algorithm Loaded",
      description: "The example code is ready in the editor.",
    });
    
    gsap.fromTo(
      editorContainerRef.current, 
      { scale: 1.02 }, 
      { scale: 1, duration: 0.3, ease: "power2.inOut" }
    );
  };

  const loadSnippet = (snippetCode: string) => {
    if (monacoRef.current) {
      // Insert at cursor position
      const selection = monacoRef.current.getSelection();
      if (selection) {
        const op = {
          range: selection,
          text: snippetCode,
          forceMoveMarkers: true
        };
        monacoRef.current.executeEdits("snippet-insertion", [op]);
        monacoRef.current.focus();
      }
    }
    
    setSnippetsSidebarOpen(false);
    
    toast({
      title: "Snippet Inserted",
      description: "Code snippet added to editor.",
    });
  };

  const addSnippet = () => {
    if (!newSnippetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your snippet.",
        variant: "destructive"
      });
      return;
    }
    
    if (!monacoRef.current) return;
    
    // Get selection or full code
    let snippetCode = '';
    const selection = monacoRef.current.getSelection();
    if (selection && !selection.isEmpty()) {
      snippetCode = monacoRef.current.getModel().getValueInRange(selection);
    } else {
      snippetCode = monacoRef.current.getValue();
    }
    
    const newSnippet = {
      id: generateId(),
      name: newSnippetName,
      description: newSnippetDesc || 'No description',
      code: snippetCode
    };
    
    setSnippets(prev => [...prev, newSnippet]);
    setNewSnippetName('');
    setNewSnippetDesc('');
    setIsCreatingSnippet(false);
    
    toast({
      title: "Snippet Created",
      description: `Snippet "${newSnippetName}" has been created.`
    });
  };

  const deleteSnippet = (id) => {
    setSnippets(prev => prev.filter(snippet => snippet.id !== id));
    
    toast({
      title: "Snippet Deleted",
      description: "The snippet has been removed."
    });
  };

  const copySnippet = (code) => {
    navigator.clipboard.writeText(code);
    
    // Reset the previous timeout if it exists
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    
    // Show toast
    toast({
      title: "Copied to Clipboard",
      description: "Code snippet copied."
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const downloadCode = () => {
    if (!monacoRef.current) return;
    
    const currentCode = monacoRef.current.getValue();
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'darijaScript_code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Code Downloaded",
      description: "Your code has been downloaded as a text file."
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string' && monacoRef.current) {
        monacoRef.current.setValue(content);
        setCode(content);
        
        toast({
          title: "File Uploaded",
          description: `${file.name} has been loaded into the editor.`
        });
      }
    };
    reader.readAsText(file);
  };

  const toggleMobileView = () => {
    setMobileView(prev => prev === 'editor' ? 'output' : 'editor');
  };

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-background to-[hsl(244,80%,6%)]' : 'bg-gradient-to-br from-white to-[hsl(210,40%,96%)]'}`}>
      {/* Welcome Overlay */}
      {showWelcome && <WelcomeOverlay onClose={handleWelcomeClose} />}

      {/* Top Header */}
      <header ref={titleRef} className="p-3 border-b border-border/20 shadow-sm flex-shrink-0 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-wide">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">DarijaScript IDE</span> ✨
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Settings size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="end">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">IDE Settings</h3>
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autorun">Auto Run</Label>
                    <Switch 
                      id="autorun" 
                      checked={autoRun} 
                      onCheckedChange={setAutoRun} 
                    />
                  </div>
                  
                  {autoRun && (
                    <div className="space-y-2">
                      <Label>Auto Run Delay: {autoRunDelay}ms</Label>
                      <Slider
                        value={[autoRunDelay]}
                        min={500}
                        max={3000}
                        step={100}
                        onValueChange={(value) => setAutoRunDelay(value[0])}
                      />
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Font Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    min={10}
                    max={24}
                    step={1}
                    onValueChange={(value) => setFontSize(value[0])}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="wordwrap">Word Wrap</Label>
                  <Switch 
                    id="wordwrap" 
                    checked={wordWrap} 
                    onCheckedChange={setWordWrap} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="minimap">Show Minimap</Label>
                  <Switch 
                    id="minimap" 
                    checked={minimap} 
                    onCheckedChange={setMinimap} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="linenumbers">Show Line Numbers</Label>
                  <Switch 
                    id="linenumbers" 
                    checked={lineNumbers} 
                    onCheckedChange={setLineNumbers} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={downloadCode}
                  >
                    <Download size={14} className="mr-1" /> Download Code
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <label>
                      <Upload size={14} className="mr-1" /> Upload Code
                      <input
                        type="file"
                        accept=".txt,.js,.ds"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground w-full"
                    onClick={() => {
                      toast({
                        title: "Keyboard Shortcuts",
                        description: "Ctrl+Enter: Run Code, Ctrl+S: Save Code"
                      });
                    }}
                  >
                    <KeyRound size={12} className="mr-1" /> View Keyboard Shortcuts
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Main Content */}
      <main ref={editorSectionRef} className="flex-grow overflow-hidden p-2 md:p-4">
        {/* Desktop Layout (md and up) */}
        <ResizablePanelGroup direction="horizontal" className="h-full hidden md:flex">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex flex-col h-full bg-card rounded-lg shadow-lg border border-border/20 overflow-hidden">
              {/* Editor Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/30 bg-[hsl(var(--card)-foreground)/5] text-card-foreground flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    ref={buttonRef}
                    onClick={handleRunClick}
                    disabled={isRunning}
                    className="bg-button-primary-gradient text-primary-foreground hover:opacity-90 transition-opacity shadow-sm hover:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    size="sm"
                  >
                    {isRunning ? 
                      <Loader size={16} className="mr-1 animate-spin"/> : 
                      <Play size={16} className={cn("mr-1", isRunning ? "animate-spin-slow" : "")}/>
                    }
                    {isRunning ? 'Running...' : 'Run Code'}
                  </Button>
                  
                  {/* Docs Button */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-secondary/50 text-secondary hover:bg-secondary/10 hover:text-secondary focus:ring-secondary/50"
                      >
                        <BookOpen size={16} className="mr-1" /> Docs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                      <div className="flex-grow overflow-hidden">
                        <DarijaDocs />
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Algorithms Button */}
                  <Sheet open={algorithmsSidebarOpen} onOpenChange={setAlgorithmsSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent focus:ring-accent/50"
                      >
                        <Brain size={16} className="mr-1" /> Algorithms
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0 border-r border-border/30 bg-sidebar">
                      <AlgorithmsSidebar
                        isOpen={algorithmsSidebarOpen}
                        onClose={() => setAlgorithmsSidebarOpen(false)}
                        onSelectAlgorithm={loadAlgorithmCode}
                      />
                    </SheetContent>
                  </Sheet>
                  
                  {/* Code Snippets Button */}
                  <Sheet open={snippetsSidebarOpen} onOpenChange={setSnippetsSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary focus:ring-primary/50"
                      >
                        <Code size={16} className="mr-1" /> Snippets
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0 border-r border-border/30 bg-sidebar">
                      <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-border/30 flex justify-between items-center">
                          <h2 className="text-lg font-semibold">Code Snippets</h2>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setIsCreatingSnippet(!isCreatingSnippet)}
                          >
                            {isCreatingSnippet ? <X size={18} /> : <Plus size={18} />}
                          </Button>
                        </div>
                        
                        {isCreatingSnippet && (
                          <div className="p-4 border-b border-border/30 bg-card/50">
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="snippetName">Snippet Name</Label>
                                <Input 
                                  id="snippetName" 
                                  value={newSnippetName} 
                                  onChange={(e) => setNewSnippetName(e.target.value)}
                                  placeholder="Enter snippet name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="snippetDesc">Description (Optional)</Label>
                                <Input 
                                  id="snippetDesc" 
                                  value={newSnippetDesc} 
                                  onChange={(e) => setNewSnippetDesc(e.target.value)}
                                  placeholder="Brief description"
                                  className="mt-1"
                                />
                              </div>
                              <Button 
                                onClick={addSnippet} 
                                className="w-full"
                                disabled={!newSnippetName.trim()}
                              >
                                <Bookmark size={14} className="mr-1" /> Save Snippet
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex-grow overflow-y-auto p-2">
                          {snippets.length === 0 ? (
                            <div className="text-center p-6 text-muted-foreground">
                              No snippets saved yet. Create your first snippet!
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {snippets.map((snippet) => (
                                <div 
                                  key={snippet.id}
                                  className="border border-border/40 rounded-md p-3 bg-card/40 hover:bg-card/70 transition-colors"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-medium">{snippet.name}</h3>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7" 
                                        onClick={() => copySnippet(snippet.code)}
                                      >
                                        <Clipboard size={14} />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                                        onClick={() => deleteSnippet(snippet.id)}
                                      >
                                        <Trash size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{snippet.description}</p>
                                  <pre className="text-xs bg-background/50 p-2 rounded-sm overflow-x-auto max-h-24">
                                    {snippet.code.length > 100 
                                      ? snippet.code.substring(0, 100) + '...' 
                                      : snippet.code}
                                  </pre>
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="w-full mt-2" 
                                    onClick={() => loadSnippet(snippet.code)}
                                  >
                                    <Plus size={14} className="mr-1" /> Insert Code
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                
                {/* Status Indicators */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {autoRun && (
                    <span className="flex items-center text-secondary">
                      <Zap size={12} className="mr-1" /> Auto-run
                    </span>
                  )}
                  {isSaving && (
                    <span className="flex items-center">
                      <Loader size={14} className="animate-spin text-primary mr-1"/> Saving...
                    </span>
                  )}
                  {isSaved && !isSaving && (
                    <span className="flex items-center">
                      <Check size={14} className="text-secondary mr-1"/> Saved
                    </span>
                  )}
                  {!isSaving && !isSaved && (
                    <span className="opacity-50">Auto-save active</span>
                  )}
                </div>
              </div>
              {/* Editor area */}
              <div className="flex-grow relative overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="darijascript"
                  theme={theme === 'dark' ? 'darijaDark' : 'darijaLight'}
                  value={code}
                  onChange={handleCodeChange}
                  beforeMount={handleEditorWillMount}
                  onMount={handleEditorDidMount}
                  options={{
                    fontSize: fontSize,
                    wordWrap: wordWrap ? 'on' : 'off',
                    minimap: { enabled: minimap },
                    lineNumbers: lineNumbers ? 'on' : 'off',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    formatOnType: true,
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    dragAndDrop: true,
                    contextmenu: true,
                  }}
                  loading={
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Loader className="animate-spin mr-2" size={20} />
                      Loading editor...
                    </div>
                  }
                />
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Output Panel */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <div ref={outputRef} className="flex flex-col h-full bg-card rounded-lg shadow-lg border border-border/20 overflow-hidden">
              <div className="p-3 border-b border-border/30 bg-[hsl(var(--card-foreground)/5)] flex items-center justify-between">
                <h2 className="font-semibold">Output Console</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setOutput([])}
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
              <div className="flex-grow p-4 overflow-auto bg-output font-mono text-sm">
                {output.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <Zap size={24} className="opacity-50" />
                      <p>Run your code to see output here!</p>
                      <p className="text-xs opacity-50">Press Ctrl+Enter to run</p>
                    </div>
                  </div>
                ) : (
                  output.map((line, index) => (
                    <div 
                      key={index} 
                      className={`output-line mb-1 ${
                        line.startsWith('Ghalat!:') ? 'text-destructive' : ''
                      }`}
                    >
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Mobile Layout (small screens) */}
        <div className="md:hidden flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAlgorithmsSidebarOpen(true)}
                className="text-xs"
              >
                <Brain size={14} className="mr-1" /> Algorithms
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSnippetsSidebarOpen(true)}
                className="text-xs"
              >
                <Code size={14} className="mr-1" /> Snippets
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    <BookOpen size={14} className="mr-1" /> Docs
                  </Button>
                </DialogTrigger>
                <DialogContent className="h-[95vh] flex flex-col p-0">
                  <div className="flex-grow overflow-hidden">
                    <DarijaDocs />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleMobileView}
              className="text-xs"
            >
              {mobileView === 'editor' ? 'Show Output' : 'Show Editor'}
            </Button>
          </div>
          
          <div className="flex-grow overflow-hidden">
            {/* Editor */}
            <div className={`h-full ${mobileView === 'editor' ? 'block' : 'hidden'}`}>
              <div className="flex flex-col h-full bg-card rounded-lg shadow-lg border border-border/20 overflow-hidden">
                <div className="p-2 border-b border-border/30 bg-[hsl(var(--card-foreground)/5)] flex items-center justify-between">
                  <Button
                    onClick={handleRunClick}
                    disabled={isRunning}
                    className="bg-button-primary-gradient text-primary-foreground hover:opacity-90 transition-opacity shadow-sm w-full"
                    size="sm"
                  >
                    {isRunning ? 
                      <Loader size={16} className="mr-1 animate-spin"/> : 
                      <Play size={16} className="mr-1"/>
                    }
                    {isRunning ? 'Running...' : 'Run Code'}
                  </Button>
                </div>
                <div className="flex-grow relative overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="darijascript"
                    theme={theme === 'dark' ? 'darijaDark' : 'darijaLight'}
                    value={code}
                    onChange={handleCodeChange}
                    beforeMount={handleEditorWillMount}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: fontSize,
                      wordWrap: 'on', // Always enable word wrap on mobile
                      minimap: { enabled: false }, // Disable minimap on mobile
                      lineNumbers: lineNumbers ? 'on' : 'off',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Output */}
            <div className={`h-full ${mobileView === 'output' ? 'block' : 'hidden'}`}>
              <div className="flex flex-col h-full bg-card rounded-lg shadow-lg border border-border/20 overflow-hidden">
                <div className="p-2 border-b border-border/30 bg-[hsl(var(--card-foreground)/5)] flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Output Console</h2>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setOutput([])}
                  >
                    <RefreshCw size={16} />
                  </Button>
                </div>
                <div className="flex-grow p-3 overflow-auto bg-output font-mono text-sm">
                  {output.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <Zap size={24} className="opacity-50" />
                        <p>Run your code to see output here!</p>
                      </div>
                    </div>
                  ) : (
                    output.map((line, index) => (
                      <div 
                        key={index} 
                        className={`output-line mb-1 ${
                          line.startsWith('Ghalat!:') ? 'text-destructive' : ''
                        }`}
                      >
                        {line}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;