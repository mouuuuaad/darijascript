'use client';

import type * as React from 'react';
import { createElement as h } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, BrainCircuit, Triangle, Search, Gamepad2, Star, PenToolIcon, Binary, Paintbrush, Puzzle } from 'lucide-react'; // Added more icons
import { cn } from '@/lib/utils';
import { DialogTitle } from '@/components/ui/dialog'; // Import DialogTitle

// Helper function to add personalized comments
const addPersonalComments = (originalCode: string, algoTitle: string): string => {
  const comments = `

/*
============================================================================================
Algorithm: ${algoTitle}

███╗░░░███╗░█████╗░██╗░░░██╗░█████╗░░█████╗░██████╗░    ██╗██████╗░
████╗░████║██╔══██╗██║░░░██║██╔══██╗██╔══██╗██╔══██╗    ██║██╔══██╗
██╔████╔██║██║░░██║██║░░░██║███████║███████║██║░░██║    ██║██║░░██║
██║╚██╔╝██║██║░░██║██║░░░██║██╔══██║██╔══██║██║░░██║    ██║██║░░██║
██║░╚═╝░██║╚█████╔╝╚██████╔╝██║░░██║██║░░██║██████╔╝    ██║██████╔╝
╚═╝░░░░░╚═╝░╚════╝░░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═════╝░░░░░╚═╝╚═════╝░
       
===================
𝒜𝓁𝓁𝒶𝒽 𝓎𝓌𝒶𝒻9𝓀ℴ𝓂!
============================================================================================
*/


`;
  // Append comments at the end of the original code
  return originalCode.trim() + "\n" + comments;
};

// Define algorithm types/structure
interface Algorithm {
  id: string;
  title: string;
  description: string;
  code: string;
  category: string; // e.g., Sorting, Searching, Math, Patterns, Games, Utilities
  icon: React.ElementType; // Added icon per algorithm category
}

// Sample Algorithms Data (Replace with your actual algorithms)
const algorithms: Algorithm[] = [
  // --- Math ---
  {
      id: 'fibonacci',
      title: 'Fibonacci Sequence (Motataliat Fibonacci)',
      description: 'Kat generer motataliat Fibonacci 7tal wa7d l 3adad n.',
      category: 'Math (7sab)',
      icon: Star,
      code: addPersonalComments(`// Motataliat Fibonacci b isti3mal recursion
dala fib(n) {
ila (n <= 1) {
  rj3 n;
}
rj3 fib(n - 1) + fib(n - 2);
}

bdl terms = 10;
ila (terms <= 0) {
tbe3("Khass tdkhel raqam moujab.");
} ella {
tbe3("Motataliat Fibonacci (" + terms + " lawlin):");
douz (bdl i = 0; i < terms; i = i + 1) {
  tbe3(fib(i));
}
}
`, 'Fibonacci Sequence')
  },
  {
      id: 'factorial',
      title: 'Factorial Calculation (7sab l Factoriel)',
      description: 'Kay7seb l factoriel dyal raqam machi salib.',
      category: 'Math (7sab)',
      icon: Star,
      code: addPersonalComments(`// 7sab l Factoriel b isti3mal loop
dala factorial(n) {
ila (n < 0) {
  rmmi("Factoriel ma kayench l raqam salib.");
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
  tbe3("Factoriel dyal " + num + " houwa: " + fact); // Natija: 120
} msk(e) {
  ghlat(e);
}
`, 'Factorial Calculation')
  },
   {
      id: 'isPrime',
      title: 'Prime Number Check (Wash Awalî?)',
      description: 'Kay verify wach raqam awalî wella la.',
      category: 'Math (7sab)',
      icon: Star,
      code: addPersonalComments(`// Check dial l3adad wash awali
dala isPrime(num) {
ila (num <= 1) {
  rj3 ghalat; // 0 o 1 machi a3dad awaliya
}
ila (num <= 3) {
  rj3 s7i7; // 2 o 3 a3dad awaliya
}
// Check wach kayt9sem 7tal ljdr dyalo
bdl limit = t7t(jdr(num));
douz (bdl i = 2; i <= limit; i = i + 1) {
  ila (num % i === 0) {
    rj3 ghalat; // L9ina chi 9asem, machi awali
  }
}
rj3 s7i7; // Mal9inach 7ta chi 9asem, houwa awali
}

bdl numberToCheck = 17;
ila (isPrime(numberToCheck)) {
tbe3(numberToCheck + " houwa raqam awalî.");
} ella {
tbe3(numberToCheck + " ماشي raqam awalî.");
}

bdl numberToCheck2 = 10;
ila (isPrime(numberToCheck2)) {
tbe3(numberToCheck2 + " houwa raqam awalî.");
} ella {
tbe3(numberToCheck2 + " ماشي raqam awalî.");
}
`, 'Prime Number Check')
  },
  // --- Sorting ---
   {
      id: 'bubble-sort',
      title: 'Bubble Sort (Tertib l Foqa3i)',
      description: 'Tertib algorithm basit b tabdil l 3anassir.',
      category: 'Sorting (Tertib)',
      icon: PenToolIcon, // Example different icon
      code: addPersonalComments(`// Algorithm dial Tertib l Foqa3i
dala bubbleSort(arr) {
bdl n = arr.twil;
bdl swapped;
dir {
  swapped = ghalat;
  douz (bdl i = 0; i < n - 1; i = i + 1) {
    ila (arr[i] > arr[i + 1]) {
      // Bdel lblayes
      bdl temp = arr[i];
      arr[i] = arr[i + 1];
      arr[i + 1] = temp;
      swapped = s7i7;
    }
  }
  // T7sen: Ila ma tbdel walo, ra tertbat
} madamt (swapped);
rj3 arr;
}

bdl data = [64, 34, 25, 12, 22, 11, 90];
tbe3("Tableau l asli: " + ns(data));
bdl sortedData = bubbleSort(data);
tbe3("Tableau mertb: " + ns(sortedData));
`, 'Bubble Sort')
  },
  // --- Searching ---
  {
      id: 'linear-search',
      title: 'Linear Search (Lbe7t l Kheti)',
      description: 'Kayl9a l index dyal wa7d l 9ima f tableau.',
      category: 'Searching (Lbe7t)',
      icon: Search,
      code: addPersonalComments(`// Algorithm dial Lbe7t l Kheti
dala linearSearch(arr, target) {
douz (bdl i = 0; i < arr.twil; i = i + 1) {
  ila (arr[i] === target) {
    rj3 i; // Rje3 l index ila l9aha
  }
}
rj3 -1; // Rje3 -1 ila mal9ahach
}

bdl elements = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
bdl targetValue = 23;

bdl index = linearSearch(elements, targetValue);

ila (index !== -1) {
tbe3("L9ina l element " + targetValue + " f l index: " + index);
} ella {
tbe3("Mal9inach l element " + targetValue + " f tableau.");
}

bdl targetNotFound = 40;
bdl indexNotFound = linearSearch(elements, targetNotFound);
ila (indexNotFound === -1) {
tbe3("Mal9inach l element " + targetNotFound + ", dakchi li bghina.");
}
`, 'Linear Search')
  },
   {
      id: 'binary-search',
      title: 'Binary Search (Lbe7t Tona2i)',
      description: 'Kayl9a 9ima f tableau MERTB b tari9a asre3.',
      category: 'Searching (Lbe7t)',
      icon: Search,
      code: addPersonalComments(`// Algorithm dial Lbe7t Tona2i (Khasso tableau mertb)
dala binarySearch(sortedArr, target) {
bdl low = 0;
bdl high = sortedArr.twil - 1;

madamt (low <= high) {
  bdl midIndex = t7t((low + high) / 2);
  bdl midValue = sortedArr[midIndex];

  ila (midValue === target) {
    rj3 midIndex; // L9inah!
  } ella ila (midValue < target) {
    low = midIndex + 1; // Qeleb f ness limen
  } ella {
    high = midIndex - 1; // Qeleb f ness lisser
  }
}

rj3 -1; // Mal9inahch
}

// Tableau khasso ykoun mertb!
bdl sortedElements = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
bdl targetValueBs = 16;

bdl indexBs = binarySearch(sortedElements, targetValueBs);

ila (indexBs !== -1) {
tbe3("Binary Search: L9ina " + targetValueBs + " f index: " + indexBs);
} ella {
tbe3("Binary Search: Mal9inach " + targetValueBs + ".");
}

bdl targetNotFoundBs = 50;
bdl indexNotFoundBs = binarySearch(sortedElements, targetNotFoundBs);
ila (indexNotFoundBs === -1) {
 tbe3("Binary Search: Mal9inach " + targetNotFoundBs + ", مزيان.");
}
`, 'Binary Search')
  },
  // --- Patterns ---
  {
      id: 'triangle-pattern',
      title: 'Triangle Pattern (Rsm Motallat)',
      description: 'Kayrsem motallat b nojoum (*) f l console.',
      category: 'Patterns (Rosomat)',
      icon: Triangle,
      code: addPersonalComments(`// Rsm dial Motallat
dala drawTriangle(height) {
ila(height <= 0) {
    tbe3("L irtifa3 khasso ykoun kber men zero!");
    rj3; // Khroj bekri ila l'irtifa3 machi s7i7
}
tbe3("Kanrsmo motallat b irtifa3 " + height + ":");
douz (bdl i = 1; i <= height; i = i + 1) {
  bdl stars = "";
  douz (bdl j = 1; j <= i; j = j + 1) {
    stars = stars + "* "; // Zid nejma o fragh
  }
  tbe3(stars);
}
}

bdl triangleHeight = 5;
drawTriangle(triangleHeight);

tbe3(""); // Zid ster khawi bash nfar9o
drawTriangle(3); // Rsem wa7d sgher
`, 'Triangle Pattern')
  },
   {
      id: 'square-pattern',
      title: 'Square Pattern (Rsm Morraba3)',
      description: 'Kayrsem morraba3 b nojoum (*) f l console.',
      category: 'Patterns (Rosomat)',
      icon: Paintbrush, // Changed icon
      code: addPersonalComments(`// Rsm dial Morraba3
dala drawSquare(size) {
ila(size <= 0) {
    tbe3("Size khasso ykoun kber men zero!");
    rj3;
}
tbe3("Kanrsmo morraba3 b size " + size + ":");
douz (bdl i = 1; i <= size; i = i + 1) {
  bdl line = "";
  douz (bdl j = 1; j <= size; j = j + 1) {
    line = line + "* "; // Zid nejma o fragh
  }
  tbe3(line);
}
}

bdl squareSize = 4;
drawSquare(squareSize);
`, 'Square Pattern')
  },
  // --- Utilities ---
  {
      id: 'string-reverse',
      title: 'String Reverse (9leb Noss)',
      description: 'Kay9leb wa7d l chaine de caractères.',
      category: 'Utilities (Manfa3a)',
      icon: PenToolIcon,
      code: addPersonalComments(`// 9leb dial string
dala reverseString(str) {
bdl reversed = "";
// Dir loop men lor o rje3 l lor
douz (bdl i = str.twil - 1; i >= 0; i = i - 1) {
  reversed = reversed + str[i]; // Zid 7arf
}
rj3 reversed;
}

bdl originalString = "Salam DarijaScript";
bdl reversedString = reverseString(originalString);
tbe3("L'original: " + originalString);
tbe3("Ma9loub: " + reversedString);
`, 'String Reverse')
  },
    {
      id: 'palindrome-check',
      title: 'Palindrome Check (Wash kat9ra men jouj jihate?)',
      description: 'Kay verify wach string palindrome (katqra kifkif men limen w lisser).',
      category: 'Utilities (Manfa3a)',
      icon: PenToolIcon,
      code: addPersonalComments(`// Check dial Palindrome
dala isPalindrome(str) {
// 7iyed les espaces o 9eleb kolchi lowercase
bdl cleanStr = str.sghr7rf(); 
// Khasso regex support f l'interpreter
bdl reversedStr = "";
 douz (bdl i = cleanStr.twil - 1; i >= 0; i = i - 1) 
 {
  reversedStr = reversedStr + cleanStr[i];
}
rj3 cleanStr === reversedStr;
} 

bdl test1 = "madam";
bdl test2 = "Darija";
bdl test3 = "Race car"; // Test m3a les espaces o case

tbe3("'" + test1 + "' wash palindrome? " + isPalindrome(test1)); // s7i7
tbe3("'" + test2 + "' wash palindrome? " + isPalindrome(test2)); // ghalat
// Note: isPalindrome(test3) khasso string replace support
// tbe3("'" + test3 + "' wash palindrome? " + isPalindrome(test3));
`, 'Palindrome Check')
  },
  // --- Games ---
  {
      id: 'guessing-game',
      title: 'Guessing Game (Lo3bat Takhmin)',
      description: 'Lo3ba basita fin katkhmn raqam.',
      category: 'Games (Al3ab)',
      icon: Gamepad2,
      code: addPersonalComments(`// Lo3bat Takhmin Basita
dala startGame() {
// Generer raqam 3achwa2i bin 1 o 10
bdl secretNumber = t7t(tsarraf() * 10) + 1;
bdl attempts = 3;
bdl guess = farkha;

tbe3("Mer7ba f Lo3bat Takhmin!");
tbe3("3ndek " + attempts + " dial lmo7awalat bach tl9a raqam bin 1 w 10.");

madamt (attempts > 0) {
  guess = sowel("Dkhel takhmin dyalek (Mo7awala " + (4 - attempts) + "):");
  // Badel l guess l raqam
  bdl guessNum = ns(guess) * 1; // T7wil basit l raqam

  ila (no3 guessNum !== "number" || guessNum < 1 || guessNum > 10) {
    nadi("Khass tdkhel raqam bin 1 w 10!");
    kamml; // Tfez l loop o 3awd s2el
  }

  ila (guessNum === secretNumber) {
    nadi("Mabrouk! L9iti raqam s7i7: " + secretNumber);
    rj3; // Sali l lo3ba
  } ella ila (guessNum < secretNumber) {
    tbe3("Raqam dyali kber chwiya...");
  } ella {
    tbe3("Raqam dyali sgher chwiya...");
  }

  attempts = attempts - 1;
}

// Ila kmmel l loop, player khser
nadi("Salaw lmo7awalat! Raqam kan houwa: " + secretNumber);
}

// Bda l lo3ba
startGame();
`, 'Guessing Game')
  },
   {
      id: 'rock-paper-scissors',
      title: 'Rock Paper Scissors (7ajra War9a M9ess)',
      description: 'Lo3ba dial 7ajra War9a M9ess ded l\'ordinateur.',
      category: 'Games (Al3ab)',
      icon: Gamepad2,
      code: addPersonalComments(`// Lo3bat 7ajra War9a M9ess
  dala playGame() {
  bdl choices = ["7ajra", "war9a", "m9ess"];

  // L'ordinateur ikhtar choix 3achwa2i
  bdl computerIndex = t7t(tsarraf() * 3);
  bdl computerChoice = choices[computerIndex].sghr7rf(); 

  // Khod choix dyal l'utilisateur
  bdl playerInput = sowel("Dkhel choix dyalek: 7ajra, war9a, wla m9ess?");
  ila (playerInput === farkha) {
    tbe3("Lghiti lo3ba.");
    rj3;
  }

  bdl playerChoice = playerInput.sghr7rf();

  // Valider choix dyal l'utilisateur
  ila (playerChoice !== "7ajra" && playerChoice !== "war9a" && playerChoice !== "m9ess") {
    nadi("Choix machi s7i7! Khass tdkhel 7ajra, war9a, wla m9ess.");
    rj3;
  }

  tbe3("Nta khtariti: " + playerChoice);
  tbe3("Ordinateur khtar: " + computerChoice);

  // 7aded chkoun rbe7
  ila (playerChoice === computerChoice) {
    tbe3("Ta3adol! (Draw!)");
  } ella ila (
    (playerChoice === "7ajra" && computerChoice === "m9ess") ||
    (playerChoice === "war9a" && computerChoice === "7ajra") ||
    (playerChoice === "m9ess" && computerChoice === "war9a")
  ) {
    tbe3("Mabrouk! Rbe7ti!");
  } ella {
    tbe3("Khserti! :(");
  }
}

// Bda lo3ba
playGame();

`, 'Rock Paper Scissors')
  },

   // --- Puzzles/Challenges ---
   {
      id: 'fizzbuzz',
      title: 'FizzBuzz Challenge',
      description: 'Challenge klasik: tba3 Fizz, Buzz, wla FizzBuzz.',
      category: 'Puzzles & Challenges (Alghaz)',
      icon: Puzzle,
      code: addPersonalComments(`// Challenge dial FizzBuzz
tbe3("Bismillah, FizzBuzz 7tal 20:");

douz (bdl i = 1; i <= 20; i = i + 1) {
bdl output = "";
// Check wach kayt9sem 3la 3 o 5 f nafs lwe9t
ila (i % 3 === 0 && i % 5 === 0) {
  output = "FizzBuzz";
} wa9ila (i % 3 === 0) {
  output = "Fizz";
} wa9ila (i % 5 === 0) {
  output = "Buzz";
} ella {
  output = ns(i); // 7awel raqam l string
}
tbe3(output);
}
`, 'FizzBuzz Challenge')
  }
];

// Group algorithms by category
const groupedAlgorithms = algorithms.reduce<Record<string, Algorithm[]>>((acc, algo) => {
  (acc[algo.category] = acc[algo.category] || []).push(algo);
  return acc;
}, {});

interface AlgorithmsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlgorithm: (code: string) => void;
}

export function AlgorithmsSidebar({ onClose, onSelectAlgorithm }: AlgorithmsSidebarProps) {
  return h('div', {
    className: cn(
      "flex flex-col h-full w-full bg-sidebar text-sidebar-foreground"
    )
  }, [
    // Header with DialogTitle for accessibility
    h('div', {
      className: "flex my-4 items-center justify-between p-4 border-b border-sidebar-border flex-shrink-0"
    }, [
      h(DialogTitle, { // Add DialogTitle here
        className: "text-xl font-semibold flex items-center gap-2 text-sidebar-primary"
      }, [
        h(BrainCircuit, { className: "w-6 h-6" }),
        "Algorithms "
      ]),
      // Close button
      
    ]),

    // Content
    h(ScrollArea, {
      className: "flex-grow"
    }, [
      h('div', {
        className: "p-4 space-y-6"
      }, 
        // Added key prop to the parent div in the map function
        Object.entries(groupedAlgorithms).map(([category, algos]) => 
          h('div', { key: category }, [
            h('h3', {
              className: "text-lg underline font-semibold uppercase text-[#50E3C2] mb-3 px-2 tracking-wider flex items-center gap-2"
            }, [
              // Use default icon or category-specific icon
              algos[0]?.icon 
                ? h(algos[0].icon, { className: "w-4 h-4 opacity-80" }) 
                : h(BrainCircuit, { className: "w-4 h-4 opacity-80" }),
              category
            ]),
            h('ul', {
              className: "space-y-1"
            },
              // Added key prop to each list item using the algo.id
              algos.map(algo => 
                h('li', { key: algo.id }, [
                  h('button', {
                    onClick: () => onSelectAlgorithm(algo.code),
                    className: "w-full text-left px-3 py-2 rounded-md  text-md hover:bg-[#3BACFF]/15 hover:text-sidebar-accent-foreground transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group"
                  }, [
                    h('div', {
                      className: "flex items-center text-[#3BACFF] justify-between"
                    }, [
                      h('span', {
                        className: "font-medium text-#3BACFF] group-hover:text-sidebar-accent-foreground"
                      }, algo.title)
                    ]),
                    h('p', {
                      className: "text-xs hover:text-primary text-sidebar-foreground/60 mt-0.5 group-hover:text-sidebar-accent-foreground/80"
                    }, algo.description)
                  ])
                ])
              )
            )
          ])
        )
      )
    ]),

    // Footer
    h('div', {
      className: "p-4 border-t border-sidebar-border text-xs text-center text-sidebar-foreground/50 flex-shrink-0"
    }, "Khtar chi algorithm bach t'chargih f l'editor.")
  ]);
}