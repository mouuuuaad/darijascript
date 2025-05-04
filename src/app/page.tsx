--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -16,7 +16,7 @@
 import { FunctionComponent, useState, useRef, useEffect, useCallback } from 'react';
 import { useTheme } from "@/hooks/use-theme"; // Assuming this hook exists and works
 import { DarijaDocs } from '@/components/docs/darija-docs';
-import { useToast } from "@/hooks/use-toast";
+import { useToast } from "@/hooks/use-toast"; // Make sure this import is correct
 import { cn } from '@/lib/utils';
 import { AlgorithmsSidebar } from '@/components/ide/algorithms-sidebar';
 import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet components
@@ -274,11 +274,13 @@
                     {isRunning ? 'Running...' : 'Run Code'}
                   </Button>
                 {/* Docs Button */}
+                  <Dialog>
                  <SheetTrigger asChild>
                      <Button size="sm" variant="secondary" className="bg-[#50E3C2] text-secondary-foreground hover:bg-[#67F2D3]/90 transition-colors duration-200 shadow-sm hover:shadow-md transform hover:scale-105" aria-label="Open Documentation">
                         <BookOpen size={16} className="mr-1"/> Docs
                      </Button>
                   </SheetTrigger>
+                  </Dialog>
                  {/* Algorithms Button */}
                  <Button size="sm" variant="outline" onClick={() => setAlgorithmsSidebarOpen(true)} className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105" aria-label="Open Algorithms Sidebar">
                     <Brain size={16} className="mr-1"/> Algorithms
