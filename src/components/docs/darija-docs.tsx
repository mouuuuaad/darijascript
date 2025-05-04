
'use client';

import type * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeBlock } from '@/components/docs/code-block'; // Assuming CodeBlock is updated or works with new classes
import { Badge } from "@/components/ui/badge";
import { BookOpenText, Lightbulb, TerminalSquare, Workflow } from 'lucide-react'; // Icons for categories

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

// Updated documentation structure with icons
const documentation: DocCategory[] = [
  {
    name: "Keywords & Declarations (Lkalimat Lmiftahia)",
    icon: TerminalSquare, // Example icon
    entries: [
        { darija: 'tabit', english: 'const', description: 'Declare a constant variable (value cannot be reassigned). Immutable.', example: 'tabit PI = 3.14;\n// PI = 3.15; -> Ghalat!', usageNotes: 'Use for values that should never change after initialization.' },
        { darija: 'bdl', english: 'let / var', description: 'Declare a variable (value can be reassigned). Mutable.', example: 'bdl counter = 0;\ncounter = counter + 1; // counter becomes 1' },
        { darija: 'dala', english: 'function', description: 'Define a reusable block of code (a function).', example: 'dala greet(name) {\n  tbe3("Salam, " + name + "!");\n}\ngreet("Dunya"); // Output: Salam, Dunya!' },
        { darija: 'rj3', english: 'return', description: 'Return a value from within a function. Stops function execution.', example: 'dala add(a, b) {\n  rj3 a + b; // Returns the sum\n}\nbdl sum = add(5, 3); // sum becomes 8' },
        { darija: 'jdid', english: 'new', description: 'Create an instance of an object constructor (e.g., `wa9t`).', example: 'bdl today = jdid wa9t(); // Creates a new Date object' },
        { darija: 'hadi', english: 'this', description: 'Refers to the current execution context (object).', usageNotes: 'The value of `hadi` depends on how a function is called.' },
        { darija: 'no3', english: 'typeof', description: 'Returns a string indicating the data type of a variable or value.', example: 'tbe3(no3 123); // "number"\ntbe3(no3 "hello"); // "string"' },
        { darija: 'rmmi', english: 'throw', description: 'Throw a user-defined exception, interrupting normal execution.', example: 'ila (x < 0) {\n  rmmi "Value cannot be negative.";\n}' },
    ],
  },
  {
    name: "Control Flow (Tahaqqom)",
    icon: Workflow, // Example icon
    entries: [
        { darija: 'ila', english: 'if', description: 'Execute a code block *only if* a condition evaluates to `s7i7`.', example: 'bdl age = 20;\nila (age >= 18) {\n  tbe3("You can enter.");\n}' },
        { darija: 'ella', english: 'else', description: 'Execute a code block if the preceding `ila` or `wa9ila` condition was `ghalat`.', example: 'bdl grade = 65;\nila (grade >= 70) {\n  tbe3("Pass");\n} ella {\n  tbe3("Fail"); // This runs\n}' },
        { darija: 'wa9ila', english: 'else if', description: 'Check another condition if the previous `ila` was `ghalat`. Can be chained.', example: 'bdl score = 75;\nila (score >= 90) {\n  tbe3("A");\n} wa9ila (score >= 70) {\n  tbe3("C"); // This runs\n} ella {\n  tbe3("F");\n}' },
        { darija: 'douz', english: 'for', description: 'Create a loop with initialization, condition, and increment steps.', example: '// Prints 0, 1, 2, 3, 4\ndouz (bdl i = 0; i < 5; i = i + 1) {\n  tbe3(i);\n}' },
        { darija: 'madamt', english: 'while', description: 'Execute a code block *repeatedly as long as* a condition remains `s7i7`.', example: 'bdl count = 0;\nmadamt (count < 3) {\n  tbe3(count);\n  count = count + 1;\n}' },
        { darija: 'dir...madamt', english: 'do...while', description: 'Execute a code block *once*, then repeat as long as a condition is `s7i7`.', example: 'bdl i = 5;\ndir {\n  tbe3(i);\n} madamt (i > 5); // Runs once' },
        { darija: 'bdl3la', english: 'switch', description: 'Select one of many code blocks to execute based on a value.', example: 'bdl day = "Lundi";\nbdl3la (day) {\n  7ala "Sebt":\n  7ala "L7ed": tbe3("Weekend!"); wa9f;\n  3adi: tbe3("Weekday");\n}' },
        { darija: '7ala', english: 'case', description: 'Define a specific case (value) within a `bdl3la` (switch) statement.', example: '// See bdl3la example' },
        { darija: '3adi', english: 'default', description: 'Define the default code block in a `bdl3la` (switch) statement.', example: '// See bdl3la example' },
        { darija: 'wa9f', english: 'break', description: 'Immediately exit the current loop or `bdl3la` statement.', example: 'douz (bdl i=0; i<10; i=i+1) { ila (i==5) wa9f; tbe3(i); } // 0-4' },
        { darija: 'kamml', english: 'continue', description: 'Skip the rest of the current iteration of a loop and proceed to the next one.', example: 'douz (bdl i=0; i<5; i=i+1) { ila (i==2) kamml; tbe3(i); } // 0,1,3,4' },
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
        { darija: 'Arrays', english: 'Arrays', description: 'Ordered list of values enclosed in square brackets `[]`.', example: 'bdl colors = ["Red", "Green", "Blue"];\ntbe3(colors[1]); // Green' },
        { darija: 'Objects', english: 'Objects', description: 'Collection of key-value pairs enclosed in curly braces `{}`.', example: 'bdl person = { name: "Ali", age: 30 };\ntbe3(person.name); // Ali' },
    ],
  },
  {
    name: "Built-in Functions (Dawall)",
    icon: TerminalSquare,
    entries: [
        { darija: 'tbe3()', english: 'console.log()', description: 'Log arguments to the output console.', example: 'tbe3("Hello", 123);' },
        { darija: 'nadi()', english: 'alert()', description: 'Display a modal alert box (browser).', example: 'nadi("Warning!");' },
        { darija: 'sowel()', english: 'prompt()', description: 'Display a prompt box for input (browser).', example: 'bdl name = sowel("Smitk?");' },
        { darija: 'tsawal()', english: 'confirm()', description: 'Display a confirmation box (browser).', example: 'bdl proceed = tsawal("Are you sure?");' },
        { darija: 'ghlat()', english: 'console.error()', description: 'Log arguments to the console as an error.', example: 'ghlat("Failed!");' },
        { darija: 'nbehh()', english: 'console.warn()', description: 'Log arguments to the console as a warning.', example: 'nbehh("Deprecated.");' },
        // Math
        { darija: 't7t()', english: 'Math.floor()', description: 'Return the largest integer less than or equal to a number.', example: 'tbe3(t7t(4.9)); // 4' },
        { darija: 'fo9()', english: 'Math.ceil()', description: 'Return the smallest integer greater than or equal to a number.', example: 'tbe3(fo9(4.1)); // 5' },
        { darija: 'dour()', english: 'Math.round()', description: 'Return the value rounded to the nearest integer.', example: 'tbe3(dour(4.5)); // 5' },
        { darija: 'tsarraf()', english: 'Math.random()', description: 'Return a pseudo-random number between 0 and 1.', example: 'tbe3(tsarraf());' },
        { darija: 'kbar()', english: 'Math.max()', description: 'Return the largest of zero or more numbers.', example: 'tbe3(kbar(1, 10, 5)); // 100' },
        { darija: 'sghar()', english: 'Math.min()', description: 'Return the smallest of zero or more numbers.', example: 'tbe3(sghar(1, 10, -2)); // -2' },
        { darija: 'mnfi()', english: 'Math.abs()', description: 'Return the absolute value.', example: 'tbe3(mnfi(-5)); // 5' },
        { darija: 'rf3()', english: 'Math.pow()', description: 'Return base to the exponent power.', example: 'tbe3(rf3(2, 3)); // 8' },
        { darija: 'jdr()', english: 'Math.sqrt()', description: 'Return the square root.', example: 'tbe3(jdr(9)); // 3' },
        // String
        { darija: 'ns()', english: 'String()', description: 'Convert a value to its string representation.', example: 'bdl strNum = ns(123); // "123"' },
        // Array (Static-like, assuming global context for now)
        // Object
        { darija: 'mfatih()', english: 'Object.keys()', description: 'Return an array of object keys.', example: 'bdl p = {a:1}; tbe3(mfatih(p)); // ["a"]' },
        { darija: 'qiyam()', english: 'Object.values()', description: 'Return an array of object values.', example: 'bdl p = {a:1}; tbe3(qiyam(p)); // [1]' },
        // Date
        { darija: 'daba()', english: 'Date.now()', description: 'Return milliseconds since epoch.', example: 'tbe3(daba());' },
        // Timers
        { darija: 'sta9()', english: 'setTimeout()', description: 'Execute a function once after a delay.', example: 'sta9(dala(){ tbe3("Hi"); }, 1000);' },
        { darija: 'krr()', english: 'setInterval()', description: 'Execute a function repeatedly at intervals.', example: 'krr(dala(){ tbe3("Tick"); }, 2000);' },
    ],
  },
  {
    name: "Methods & Properties (Khasais)",
    icon: BookOpenText, // Example icon
    entries: [
        // String Methods
        { darija: '.kbr7rf()', english: '.toUpperCase()', description: 'Convert string to uppercase.', example: 'tbe3("hello".kbr7rf()); // "HELLO"' },
        { darija: '.sghr7rf()', english: '.toLowerCase()', description: 'Convert string to lowercase.', example: 'tbe3("WORLD".sghr7rf()); // "world"' },
        { darija: '.kayn()', english: '.includes()', description: 'Check if a string contains another string.', example: 'tbe3("salam".kayn("la")); // s7i7' },
        // String Property
        { darija: '.twil', english: '.length (String)', description: 'Get the number of characters in a string.', example: 'tbe3("hello".twil); // 5', usageNotes: 'This is a property, not a function call.' },
        // Array Methods
        { darija: '.zid()', english: '.push()', description: 'Add elements to the end of an array.', example: 'bdl a=[1]; a.zid(2); tbe3(a); // [1, 2]' },
        { darija: '.7yed()', english: '.pop()', description: 'Remove the last element from an array.', example: 'bdl a=[1,2]; a.7yed(); tbe3(a); // [1]' },
        { darija: '.7yedmnlwla()', english: '.shift()', description: 'Remove the first element from an array.', example: 'bdl a=[1,2]; a.7yedmnlwla(); tbe3(a); // [2]' },
        { darija: '.zidfllwla()', english: '.unshift()', description: 'Add elements to the beginning of an array.', example: 'bdl a=[2]; a.zidfllwla(1); tbe3(a); // [1, 2]' },
        { darija: '.dwr()', english: '.map()', description: 'Create a new array by calling a function on every element.', example: 'bdl n=[1,2]; bdl d=n.dwr(dala(x){rj3 x*2;}); tbe3(d); // [2, 4]' },
        { darija: '.n9i()', english: '.filter()', description: 'Create a new array with elements that pass a test.', example: 'bdl n=[1,2,3]; bdl e=n.n9i(dala(x){rj3 x>1;}); tbe3(e); // [2, 3]' },
        { darija: '.lfech()', english: '.forEach()', description: 'Execute a function once for each array element.', example: 'bdl n=["a","b"]; n.lfech(dala(x){tbe3(x);}); // a, then b' },
        { darija: '.l9a()', english: '.find()', description: 'Return the value of the first element that satisfies a test.', example: 'bdl n=[1,5,10]; bdl f=n.l9a(dala(x){rj3 x>3;}); tbe3(f); // 5' },
        { darija: '.lmmaj()', english: '.reduce()', description: 'Execute a reducer function resulting in a single output value.', example: 'bdl n=[1,2,3]; bdl s=n.lmmaj(dala(acc,c){rj3 acc+c;}, 0); tbe3(s); // 6' },
        // Array Property
        { darija: '.twil', english: '.length (Array)', description: 'Get the number of elements in an array.', example: 'tbe3([10, 20].twil); // 2', usageNotes: 'This is a property, not a function call.' },
        // Date Methods
        { darija: '.3am()', english: '.getFullYear()', description: 'Get the full year of a date object.', example: 'bdl d = jdid wa9t(); tbe3(d.3am());' },
        { darija: '.chhr()', english: '.getMonth()', description: 'Get the month (0-11) of a date object.', example: 'bdl d = jdid wa9t(); tbe3(d.chhr()); // 0 = January' },
        { darija: '.nhar()', english: '.getDate()', description: 'Get the day of the month (1-31) of a date object.', example: 'bdl d = jdid wa9t(); tbe3(d.nhar());' },
    ],
  },
  {
    name: "Error Handling (Mo3alajat L2akhtaa)",
    icon: Workflow, // Reusing icon, could find a better one
    entries: [
        { darija: 'jrb', english: 'try', description: 'Define a block of code to be tested for errors.', example: 'jrb {\n  rmmi "Ghalat!";\n} msk (e) {\n  ghlat("Caught: " + e);\n} fakhr {\n  tbe3("Finished.");\n}' },
        { darija: 'msk', english: 'catch', description: 'Define a block of code to be executed if an error occurs in the `jrb` block.', example: '// See jrb example' },
        { darija: 'fakhr', english: 'finally', description: 'Define a block of code to be executed regardless of the `jrb`/`msk` result.', example: '// See jrb example' },
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

      <Accordion type="multiple" className="w-full accordion-root">
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
                         {entry.english && <Badge variant="secondary" className="doc-entry-english">{entry.english}</Badge>}
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
         <div className="creator-credit">
            Crafted with passion by <span className="creator-name">MOUAAD IDOUFKIR</span>
        </div>
      </Accordion>
    </div>
  );
}

    