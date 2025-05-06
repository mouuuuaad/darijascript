

'use client';

import type * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeBlock } from '@/components/docs/code-block'; // Assuming CodeBlock is updated or works with new classes
import { BookOpenText, Lightbulb, TerminalSquare, Workflow, Braces, ListChecks, Clock, AlertTriangle, KeySquare } from 'lucide-react'; // Icons for categories

interface DocEntry {
  darija: string;
  english: string;
  description: string;
  usageNotes?: string; // Optional field for extra details
  example?: string;
}

interface DocCategory {
    name: string;
    icon: React.ElementType; // Icon component
    entries: DocEntry[];
}

// Updated documentation structure with icons and new entries
const documentation: DocCategory[] = [
  {
    name: "Keywords & Declarations (Lkalimat Lmiftahia)",
    icon: KeySquare, // Changed icon
    entries: [
        { darija: 'tabit', english: 'const', description: 'Declare a constant variable (value cannot be reassigned). Immutable.', example: 'tabit PI = 3.14;\n// PI = 3.15; -> Ghalat!', usageNotes: 'Use for values that should never change after initialization.' },
        { darija: 'bdl', english: 'let / var', description: 'Declare a variable (value can be reassigned). Mutable.', example: 'bdl counter = 0;\ncounter = counter + 1; // counter becomes 1' },
        { darija: 'dala', english: 'function', description: 'Define a reusable block of code (a function).', example: 'dala greet(name) {\n  tbe3("Salam, " + name + "!");\n}\ngreet("Dunya"); // Output: Salam, Dunya!' },
        { darija: 'rj3', english: 'return', description: 'Return a value from within a function. Stops function execution.', example: 'dala add(a, b) {\n  rj3 a + b; // Returns the sum\n}\nbdl sum = add(5, 3); // sum becomes 8' },
        { darija: 'jdid', english: 'new', description: 'Create an instance of an object constructor (e.g., `wa9t`).', example: 'bdl today = jdid wa9t(); // Creates a new Date object' },
        { darija: 'hadi', english: 'this', description: 'Refers to the current execution context (object).', usageNotes: 'The value of `hadi` depends on how a function is called.' },
        { darija: 'no3', english: 'typeof', description: 'Returns a string indicating the data type of a variable or value.', example: 'tbe3(no3 123); // "number"\ntbe3(no3 "hello"); // "string"' },
    ],
  },
   {
    name: "Values & Literals (L9iyam)",
    icon: Lightbulb, // Example icon
    entries: [
        { darija: 's7i7', english: 'true', description: 'Boolean literal representing truth.', example: 'bdl isReady = s7i7;' },
        { darija: 'ghalat', english: 'false', description: 'Boolean literal representing falsehood.', example: 'bdl hasErrors = ghalat;' },
        { darija: 'farkha', english: 'null', description: 'Represents the intentional absence of any object value.', example: 'bdl user = farkha;' },
        { darija: 'mchmcha', english: 'undefined', description: 'Represents a variable that has been declared but not assigned a value.', example: 'bdl age;\ntbe3(age); // mchmcha' },
        { darija: 'Numbers', english: 'Numbers', description: 'Standard numeric literals (integers and decimals).', example: 'bdl price = 99.50;' },
        { darija: 'Strings', english: 'Strings', description: 'Sequence of characters enclosed in double (`"`) or single (`\'`) quotes.', example: 'bdl message = "Salam!";' },
        { darija: 'Arrays', english: 'Arrays', description: 'Ordered list of values enclosed in square brackets `[]`.', example: 'bdl colors = ["Mer7ba", "Bikhir", "Hamdulillah"];\ntbe3(colors[1]); // Bikhir' },
        { darija: 'Objects', english: 'Objects', description: 'Collection of key-value pairs enclosed in curly braces `{}`.', example: 'bdl person = { name: "Fatima", age: 30 };\ntbe3(person.name); // Fatima' },
    ],
  },
  {
    name: "Control Flow (Tahaqqom)",
    icon: Workflow, // Example icon
    entries: [
        { darija: 'ila', english: 'if', description: 'Execute a code block *only if* a condition evaluates to `s7i7`.', example: 'bdl age = 20;\nila (age >= 18) {\n  tbe3("Rak kberti.");\n}' },
        { darija: 'ella', english: 'else', description: 'Execute a code block if the preceding `ila` or `wa9ila` condition was `ghalat`.', example: 'bdl grade = 65;\nila (grade >= 70) {\n  tbe3("Naje7");\n} ella {\n  tbe3("Sa9et"); // This runs\n}' },
        { darija: 'wa9ila', english: 'else if', description: 'Check another condition if the previous `ila` was `ghalat`. Can be chained.', example: 'bdl score = 75;\nila (score >= 90) {\n  tbe3("A");\n} wa9ila (score >= 70) {\n  tbe3("C"); // This runs\n} ella {\n  tbe3("F");\n}' },
        { darija: 'douz', english: 'for', description: 'Create a loop with initialization, condition, and increment steps.', example: '// Kaykteb 0, 1, 2, 3, 4\ndouz (bdl i = 0; i < 5; i = i + 1) {\n  tbe3(i);\n}' },
        { darija: 'madamt', english: 'while', description: 'Execute a code block *repeatedly as long as* a condition remains `s7i7`.', example: 'bdl count = 0;\nmadamt (count < 3) {\n  tbe3(count);\n  count = count + 1;\n}' },
        { darija: 'dir...madamt', english: 'do...while', description: 'Execute a code block *once*, then repeat as long as a condition is `s7i7`.', example: 'bdl i = 5;\ndir {\n  tbe3("Kaytba3 واخا الشرط غالط: " + i);\n} madamt (i < 5); // Runs once, prints 5' },
        { darija: 'bdl3la', english: 'switch', description: 'Select one of many code blocks to execute based on a value.', example: 'bdl day = "Lundi";\nbdl3la (day) {\n  7ala "Sebt":\n  7ala "L7ed": tbe3("Weekend!"); wa9f;\n  3adi: tbe3("Weekday");\n}' },
        { darija: '7ala', english: 'case', description: 'Define a specific case (value) within a `bdl3la` (switch) statement.', example: '// Chof lmtal dyal bdl3la' },
        { darija: '3adi', english: 'default', description: 'Define the default code block in a `bdl3la` (switch) statement.', example: '// Chof lmtal dyal bdl3la' },
        { darija: 'wa9f', english: 'break', description: 'Immediately exit the current loop or `bdl3la` statement.', example: 'douz (bdl i=0; i<10; i=i+1) { ila (i==5) wa9f; tbe3(i); } // 0-4' },
        { darija: 'kamml', english: 'continue', description: 'Skip the rest of the current iteration of a loop and proceed to the next one.', example: 'douz (bdl i=0; i<5; i=i+1) { ila (i==2) kamml; tbe3(i); } // 0,1,3,4' },
    ],
  },
  {
    name: "Built-in Functions (Dawall)",
    icon: TerminalSquare,
    entries: [
        { darija: 'tbe3()', english: 'console.log()', description: 'Log arguments to the output console.', example: 'tbe3("Salam", 123, s7i7);' },
        { darija: 'nadi()', english: 'alert()', description: 'Display a modal alert box (browser).', example: 'nadi("Attention!");' },
        { darija: 'sowel()', english: 'prompt()', description: 'Display a prompt box for input (browser).', example: 'bdl name = sowel("Smitk?");' },
        { darija: 'tsawal()', english: 'confirm()', description: 'Display a confirmation box (browser).', example: 'bdl proceed = tsawal("Are you sure?");' },
        { darija: 'ghlat()', english: 'console.error()', description: 'Log arguments to the console as an error.', example: 'ghlat("Ghalat وقع!");' },
        { darija: 'nbehh()', english: 'console.warn()', description: 'Log arguments to the console as a warning.', example: 'nbehh("Had l function 9dima.");' },
        // Math
        { darija: 't7t()', english: 'Math.floor()', description: 'Return the largest integer less than or equal to a number.', example: 'tbe3(t7t(4.9)); // 4' },
        { darija: 'fo9()', english: 'Math.ceil()', description: 'Return the smallest integer greater than or equal to a number.', example: 'tbe3(fo9(4.1)); // 5' },
        { darija: 'dour()', english: 'Math.round()', description: 'Return the value rounded to the nearest integer.', example: 'tbe3(dour(4.5)); // 5' },
        { darija: 'tsarraf()', english: 'Math.random()', description: 'Return a pseudo-random number between 0 and 1.', example: 'tbe3(tsarraf());' },
        { darija: 'kbar()', english: 'Math.max()', description: 'Return the largest of zero or more numbers.', example: 'tbe3(kbar(1, 10, 5, 100)); // 100' },
        { darija: 'sghar()', english: 'Math.min()', description: 'Return the smallest of zero or more numbers.', example: 'tbe3(sghar(1, 10, -2, 0)); // -2' },
        { darija: 'mnfi()', english: 'Math.abs()', description: 'Return the absolute value.', example: 'tbe3(mnfi(-5)); // 5' },
        { darija: 'rf3()', english: 'Math.pow()', description: 'Return base to the exponent power.', example: 'tbe3(rf3(2, 3)); // 8' },
        { darija: 'jdr()', english: 'Math.sqrt()', description: 'Return the square root.', example: 'tbe3(jdr(9)); // 3' },
        // String Conversion
        { darija: 'ns()', english: 'String()', description: 'Convert a value to its string representation.', example: 'bdl strNum = ns(123); // "123"' },
        // Object Static Methods
        { darija: 'mfatih()', english: 'Object.keys()', description: 'Return an array of object keys.', example: 'bdl p = {a:1, b:2}; tbe3(mfatih(p)); // ["a", "b"]' },
        { darija: 'qiyam()', english: 'Object.values()', description: 'Return an array of object values.', example: 'bdl p = {a:1, b:2}; tbe3(qiyam(p)); // [1, 2]' },
        // Date Static Methods
        { darija: 'daba()', english: 'Date.now()', description: 'Return milliseconds since epoch.', example: 'tbe3(daba());' },
        // Date Constructor
        { darija: 'wa9t()', english: 'new Date()', description: 'Creates a new Date object representing the current time, or a specific date/time.', example: 'bdl now = wa9t();\ntbe3(now);\n\nbdl specificDate = wa9t(2024, 4, 1); // May 1st, 2024 (Month is 0-indexed)\ntbe3(specificDate);' },
        // Timers
        { darija: 'sta9()', english: 'setTimeout()', description: 'Execute a function once after a delay (in milliseconds).', example: 'sta9(dala(){ tbe3("Salam ba3d 1 seconde"); }, 1000);' },
        { darija: 'krr()', english: 'setInterval()', description: 'Execute a function repeatedly at intervals (in milliseconds).', example: 'bdl intervalId = krr(dala(){ tbe3("Tick"); }, 2000);\n// Use wa9fInterval(intervalId) to stop.' },
    ],
  },
  {
    name: "String Methods & Properties (Khasais dyal Noss)",
    icon: BookOpenText,
    entries: [
        // String Methods
        { darija: '.kbr7rf()', english: '.toUpperCase()', description: 'Convert string to uppercase.', example: 'tbe3("mer7ba".kbr7rf()); // "MER7BA"' },
        { darija: '.sghr7rf()', english: '.toLowerCase()', description: 'Convert string to lowercase.', example: 'tbe3("SALAM".sghr7rf()); // "salam"' },
        { darija: '.kayn()', english: '.includes()', description: 'Check if a string contains another string. Returns s7i7 or ghalat.', example: 'bdl txt = "DarijaScript zwina";\ntbe3(txt.kayn("zwina")); // s7i7\ntbe3(txt.kayn("khayba")); // ghalat' },
        // String Property
        { darija: '.twil', english: '.length', description: 'Get the number of characters in a string.', example: 'tbe3("hello".twil); // 5', usageNotes: 'This is a property, access it without parentheses `()`. It provides the count of characters.' },
    ],
  },
  {
    name: "Array Methods & Properties (Khasais dyal Tableau)",
    icon: ListChecks,
    entries: [
        // Array Methods
        { darija: '.zid()', english: '.push()', description: 'Add one or more elements to the end of an array and returns the new length.', example: 'bdl arr = [1, 2];\nbdl newLength = arr.zid(3, 4);\ntbe3(newLength); // 4\ntbe3(arr); // [1, 2, 3, 4]' },
        { darija: '.7yed()', english: '.pop()', description: 'Remove the last element from an array and return that element.', example: 'bdl arr = ["a", "b", "c"];\nbdl last = arr.7yed();\ntbe3(last); // "c"\ntbe3(arr); // ["a", "b"]' },
        { darija: '.7yedmnlwla()', english: '.shift()', description: 'Remove the first element from an array and return that element.', example: 'bdl arr = ["a", "b", "c"];\nbdl first = arr.7yedmnlwla();\ntbe3(first); // "a"\ntbe3(arr); // ["b", "c"]' },
        { darija: '.zidfllwla()', english: '.unshift()', description: 'Add one or more elements to the beginning of an array and returns the new length.', example: 'bdl arr = [2, 3];\nbdl newLength = arr.zidfllwla(0, 1);\ntbe3(newLength); // 4\ntbe3(arr); // [0, 1, 2, 3]' },
        { darija: '.dwr()', english: '.map()', description: 'Create a new array populated with the results of calling a provided function on every element.', example: 'bdl nums = [1, 2, 3];\nbdl doubled = nums.dwr(dala(n) {\n     rj3 n * 2;\n });\ntbe3(doubled); // [2, 4, 6]' },
        { darija: '.n9i()', english: '.filter()', description: 'Create a new array with all elements that pass the test implemented by the provided function.', example: 'bdl nums = [1, 2, 3, 4, 5];\nbdl evens = nums.n9i(dala(n) {\n     rj3 n % 2 == 0;\n });\ntbe3(evens); // [2, 4]' },
        { darija: '.lfech()', english: '.forEach()', description: 'Execute a provided function once for each array element.', example: 'bdl colors = ["Red", "Green"];\ncolors.lfech(dala(color, index) {\n     tbe3(index + ": " + color);\n });\n// Output:\n// 0: Red\n// 1: Green' },
        { darija: '.l9a()', english: '.find()', description: 'Return the value of the first element in the array that satisfies the provided testing function.', example: 'bdl nums = [1, 5, 10, 15];\nbdl found = nums.l9a(dala(n) {\n     rj3 n > 8;\n });\ntbe3(found); // 10' },
        { darija: '.lmmaj()', english: '.reduce()', description: 'Execute a reducer function on each element of the array, resulting in a single output value.', example: 'bdl nums = [1, 2, 3, 4];\nbdl sum = nums.lmmaj(dala(accumulator, currentValue) {\n     rj3 accumulator + currentValue;\n }, 0);\ntbe3(sum); // 10' },
        // Array Property
        { darija: '.twil', english: '.length', description: 'Get the number of elements in an array.', example: 'tbe3([10, 20, 30].twil); // 3', usageNotes: 'This is a property, access it without parentheses `()`. Can also be set to truncate or extend the array (use with caution).' },
    ],
  },
   {
    name: "Date Methods (Khasais dyal Tarikh)",
    icon: Clock,
    entries: [
        // Date Methods
        { darija: '.3am()', english: '.getFullYear()', description: 'Get the full year (4 digits) of a date object.', example: 'bdl d = wa9t(); tbe3(d.3am()); // e.g., 2024' },
        { darija: '.chhr()', english: '.getMonth()', description: 'Get the month (0-11) of a date object (0 = January, 11 = December).', example: 'bdl d = wa9t(); tbe3(d.chhr()); // e.g., 4 for May' },
        { darija: '.nhar()', english: '.getDate()', description: 'Get the day of the month (1-31) of a date object.', example: 'bdl d = wa9t(); tbe3(d.nhar());' },
        // Add more Date methods as needed (.getHours(), .getMinutes(), .getSeconds(), .getDay() etc.)
    ],
  },
  {
    name: "Error Handling (Mo3alajat L2akhtaa)",
    icon: AlertTriangle, // Changed icon
    entries: [
        { darija: 'jrb', english: 'try', description: 'Define a block of code to be tested for errors.', example: 'jrb {\n  tbe3("Kan 7awel...");\n  rmmi("Chi Ghalat W9e3!"); // Throw an error\n  tbe3("Had l code maytنفذش");\n} msk (ghalatLiW9e3) {\n  ghlat("Chedek l ghalat: " + ghalatLiW9e3);\n} fakhr {\n  tbe3("Had l block dima kaytنفذ.");\n}\n// Output:\n// Kan 7awel...\n// Chedek l ghalat: Chi Ghalat W9e3!\n// Had l block dima kaytنفذ.' },
        { darija: 'msk', english: 'catch', description: 'Define a block of code to be executed if an error occurs in the `jrb` block.', example: '// Chof lmtal dyal jrb' },
        { darija: 'rmmi', english: 'throw', description: 'Throw a user-defined exception (error). This interrupts normal code execution and searches for a `msk` block.', example: 'dala checkAge(age) {\n  ila (age < 18) {\n    rmmi "Khass tkoun kber men 18!";\n  }\n  tbe3("Mezyan!");\n}\n\njrb {\n  checkAge(15);\n} msk (e) {\n  ghlat("Ghalat: " + e);\n}' },
        { darija: 'fakhr', english: 'finally', description: 'Define a block of code to be executed regardless of the `jrb`/`msk` result (always runs after try/catch).', example: '// Chof lmtal dyal jrb' },
    ],
  },
];


export function DarijaDocs() {
  return (
    // Use the new container class and add height/overflow for scrolling within SheetContent
    <div className="docs-container h-full overflow-y-auto">
      {/* Introduction Section */}
      <div className="docs-intro">
        <h2>📖 DarijaScript Documentation</h2>
        <p>Kolchi li khassek ta3raf bach tkteb b DarijaScript!</p>
      </div>

      <Accordion type="multiple" defaultValue={["Keywords & Declarations (Lkalimat Lmiftahia)"]} className="w-full accordion-root">
        {documentation.map((category) => (
          <AccordionItem value={category.name} key={category.name} className="accordion-item">
            <AccordionTrigger className="accordion-trigger">
               <div className="flex items-center gap-3">
                  <category.icon className="w-5 h-5 opacity-80" />
                  <span>{category.name}</span>
               </div>
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              <div className="space-y-4"> {/* Add space between entries */}
                  {category.entries.map((entry) => (
                    <div key={entry.darija} className="doc-entry">
                       <div className="doc-entry-header">
                         <span className="doc-entry-darija">{entry.darija}</span>
                      </div>
                      <p className="doc-entry-description">{entry.description}</p>
                      {entry.usageNotes && (
                         <p className="doc-entry-usage-notes">{entry.usageNotes}</p>
                      )}
                      {entry.example && (
                        <div className="doc-entry-example">
                           <CodeBlock code={entry.example} language="darijascript" className="code-block" />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
         <div className="creator-credit ">
            Developed by <a href="https://mouaad-idoufkir.vercel.app/" target="_blank" rel="noopener noreferrer" className="creator-name">MOUAAD IDOUFKIR</a>
        </div>
      </Accordion>
    </div>
  );
}

    
