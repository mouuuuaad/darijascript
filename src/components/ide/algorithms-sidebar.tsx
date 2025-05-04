
'use client';

import type * as React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define algorithm types/structure
interface Algorithm {
  id: string;
  title: string;
  description: string;
  code: string;
  category: string; // e.g., Sorting, Searching, Math
}

// Sample Algorithms Data (Replace with your actual algorithms)
const algorithms: Algorithm[] = [
    {
        id: 'fibonacci',
        title: 'Fibonacci Sequence',
        description: 'Generates the Fibonacci sequence up to n terms.',
        category: 'Math',
        code: `// Fibonacci Sequence using recursion
dala fib(n) {
  ila (n <= 1) {
    rj3 n;
  }
  rj3 fib(n - 1) + fib(n - 2);
}

bdl terms = 10;
ila (terms <= 0) {
  tbe3("Please enter a positive integer.");
} ella {
  tbe3("Fibonacci Sequence (first " + terms + " terms):");
  douz (bdl i = 0; i < terms; i = i + 1) {
    tbe3(fib(i));
  }
}
`
    },
    {
        id: 'factorial',
        title: 'Factorial Calculation',
        description: 'Calculates the factorial of a non-negative integer.',
        category: 'Math',
        code: `// Factorial Calculation using loop
dala factorial(n) {
  ila (n < 0) {
    rmmi "Factorial is not defined for negative numbers.";
  }
  ila (n === 0 || n === 1) {
    rj3 1;
  }
  bdl result = 1;
  douz (bdl i = 2; i <= n; i = i + 1) {
    result = result * i;
  }
  rj3 result;
}

bdl num = 5;
jrb {
    bdl fact = factorial(num);
    tbe3("Factorial of " + num + " is: " + fact); // Output: 120
} msk(e) {
    ghlat(e);
}
`
    },
     {
        id: 'bubble-sort',
        title: 'Bubble Sort',
        description: 'Simple sorting algorithm.',
        category: 'Sorting',
        code: `// Bubble Sort Algorithm
dala bubbleSort(arr) {
  bdl n = arr.twil;
  bdl swapped;
  dir {
    swapped = ghalat;
    douz (bdl i = 0; i < n - 1; i = i + 1) {
      ila (arr[i] > arr[i + 1]) {
        // Swap elements
        bdl temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
        swapped = s7i7;
      }
    }
    // Optimization: If no elements were swapped, array is sorted
  } madamt (swapped);
  rj3 arr;
}

bdl data = [64, 34, 25, 12, 22, 11, 90];
tbe3("Original Array: " + ns(data));
bdl sortedData = bubbleSort(data);
tbe3("Sorted Array: " + ns(sortedData));
`
    },
    {
        id: 'linear-search',
        title: 'Linear Search',
        description: 'Finds the index of a target value in an array.',
        category: 'Searching',
        code: `// Linear Search Algorithm
dala linearSearch(arr, target) {
  douz (bdl i = 0; i < arr.twil; i = i + 1) {
    ila (arr[i] === target) {
      rj3 i; // Return index if found
    }
  }
  rj3 -1; // Return -1 if not found
}

bdl elements = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
bdl targetValue = 23;

bdl index = linearSearch(elements, targetValue);

ila (index !== -1) {
  tbe3("Element " + targetValue + " found at index: " + index);
} ella {
  tbe3("Element " + targetValue + " not found in the array.");
}

bdl targetNotFound = 40;
bdl indexNotFound = linearSearch(elements, targetNotFound);
ila (indexNotFound === -1) {
  tbe3("Element " + targetNotFound + " not found, as expected.");
}
`
    }
];

// Group algorithms by category
const groupedAlgorithms = algorithms.reduce((acc, algo) => {
  (acc[algo.category] = acc[algo.category] || []).push(algo);
  return acc;
}, {} as Record<string, Algorithm[]>);


interface AlgorithmsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlgorithm: (code: string) => void;
}

export function AlgorithmsSidebar({ isOpen, onClose, onSelectAlgorithm }: AlgorithmsSidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 ease-in-out transform",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-sidebar-primary">
            <BrainCircuit className="w-6 h-6" />
            Algorithms
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <X className="w-5 h-5" />
            <span className="sr-only">Close Algorithms Sidebar</span>
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-6">
            {Object.entries(groupedAlgorithms).map(([category, algos]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold uppercase text-sidebar-foreground/70 mb-3 px-2 tracking-wider">
                  {category}
                </h3>
                <ul className="space-y-1">
                  {algos.map((algo) => (
                    <li key={algo.id}>
                      <button
                        onClick={() => onSelectAlgorithm(algo.code)}
                        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      >
                        <p className="font-medium text-sidebar-foreground">{algo.title}</p>
                        <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                          {algo.description}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer (Optional) */}
        <div className="p-4 border-t border-sidebar-border text-xs text-center text-sidebar-foreground/50">
          Select an algorithm to load its code.
        </div>
      </div>
    </div>
  );
}
