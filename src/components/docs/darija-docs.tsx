'use client';

import type * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeBlock } from '@/components/docs/code-block';
import { Badge } from "@/components/ui/badge"; // Import Badge for visual distinction

interface DocEntry {
  darija: string;
  english: string;
  description: string;
  usageNotes?: string; // Optional field for extra details
  example?: string;
}

const documentation: { [category: string]: DocEntry[] } = {
  "Keywords & Declarations (Lkalimat Lmiftahia)": [
    { darija: 'tabit', english: 'const', description: 'Declare a constant variable (value cannot be reassigned). Immutable.', example: 'tabit PI = 3.14;\n// PI = 3.15; -> Ghalat!', usageNotes: 'Use for values that should never change after initialization.' },
    { darija: 'bdl', english: 'let / var', description: 'Declare a variable (value can be reassigned). Mutable.', example: 'bdl counter = 0;\ncounter = counter + 1; // counter becomes 1' },
    { darija: 'dala', english: 'function', description: 'Define a reusable block of code (a function).', example: 'dala greet(name) {\n  tbe3("Salam, " + name + "!");\n}\ngreet("Dunya"); // Output: Salam, Dunya!' },
    { darija: 'rj3', english: 'return', description: 'Return a value from within a function. Stops function execution.', example: 'dala add(a, b) {\n  rj3 a + b; // Returns the sum\n  tbe3("This won\'t run");\n}\nbdl sum = add(5, 3); // sum becomes 8' },
    { darija: 'jdid', english: 'new', description: 'Create an instance of an object constructor (e.g., `wa9t`).', example: 'bdl today = jdid wa9t(); // Creates a new Date object using the wa9t constructor' },
    { darija: 'hadi', english: 'this', description: 'Refers to the current execution context (object). Behavior is similar to JavaScript `this`.', usageNotes: 'The value of `hadi` depends on how a function is called.' },
    { darija: 'no3', english: 'typeof', description: 'Returns a string indicating the data type of a variable or value.', example: 'tbe3(no3 123); // "number"\ntbe3(no3 "hello"); // "string"\ntbe3(no3 farkha); // "object" (JS behavior)\ntbe3(no3 mchmcha); // "undefined"' },
  ],
  "Control Flow (Tahaqqom)": [
    { darija: 'ila', english: 'if', description: 'Execute a code block *only if* a condition evaluates to `s7i7`.', example: 'bdl age = 20;\nila (age >= 18) {\n  tbe3("You can enter.");\n}' },
    { darija: 'ella', english: 'else', description: 'Execute a code block if the preceding `ila` or `wa9ila` condition was `ghalat`.', example: 'bdl grade = 65;\nila (grade >= 70) {\n  tbe3("Pass");\n} ella {\n  tbe3("Fail"); // This runs\n}' },
    { darija: 'wa9ila', english: 'else if', description: 'Check another condition if the previous `ila` was `ghalat`. Can be chained.', example: 'bdl score = 75;\nila (score >= 90) {\n  tbe3("A");\n} wa9ila (score >= 70) {\n  tbe3("C"); // This runs\n} ella {\n  tbe3("F");\n}' },
    { darija: 'douz', english: 'for', description: 'Create a loop with initialization, condition, and increment steps.', example: '// Prints 0, 1, 2, 3, 4\ndouz (bdl i = 0; i < 5; i = i + 1) {\n  tbe3(i);\n}' },
    { darija: 'madamt', english: 'while', description: 'Execute a code block *repeatedly as long as* a condition remains `s7i7`. Condition checked before each iteration.', example: 'bdl count = 0;\nmadamt (count < 3) {\n  tbe3("Current count: " + count);\n  count = count + 1;\n}' },
    { darija: 'dir...madamt', english: 'do...while', description: 'Execute a code block *once*, then repeat as long as a condition is `s7i7`. Condition checked after each iteration.', example: 'bdl i = 5;\ndir {\n  tbe3(i); // Runs once even though i > 5 is false\n  i = i - 1;\n} madamt (i > 5);' },
    { darija: 'bdl3la', english: 'switch', description: 'Select one of many code blocks to execute based on a value.', example: 'bdl day = "Monday";\nbdl3la (day) {\n  7ala "Saturday":\n  7ala "Sunday":\n    tbe3("Weekend!");\n    wa9f; // Important: stops execution here\n  3adi:\n    tbe3("Weekday"); // This runs if day is "Monday"\n}' },
    { darija: '7ala', english: 'case', description: 'Define a specific case (value) within a `bdl3la` (switch) statement.', example: '// See bdl3la example' },
    { darija: '3adi', english: 'default', description: 'Define the default code block in a `bdl3la` (switch) statement, executed if no `7ala` matches.', example: '// See bdl3la example' },
    { darija: 'wa9f', english: 'break', description: 'Immediately exit the current loop (`douz`, `madamt`, `dir...madamt`) or `bdl3la` statement.', example: 'douz (bdl i = 0; i < 10; i = i + 1) {\n  ila (i === 5) {\n    wa9f; // Stops the loop when i is 5\n  }\n  tbe3(i); // Prints 0, 1, 2, 3, 4\n}' },
    { darija: 'kamml', english: 'continue', description: 'Skip the rest of the current iteration of a loop and proceed to the next one.', example: 'douz (bdl i = 0; i < 5; i = i + 1) {\n  ila (i === 2) {\n    kamml; // Skips tbe3(2)\n  }\n  tbe3(i); // Prints 0, 1, 3, 4\n}' },
  ],
  "Values & Literals (L9iyam)": [
    { darija: 's7i7', english: 'true', description: 'Boolean literal representing truth.', example: 'bdl isReady = s7i7;\nila (isReady) { /* ... */ }' },
    { darija: 'ghalat', english: 'false', description: 'Boolean literal representing falsehood. `kdb` is also accepted.', example: 'bdl hasErrors = ghalat;\nila (!hasErrors) { /* ... */ }' },
    { darija: 'farkha', english: 'null', description: 'Represents the intentional absence of any object value. A distinct value.', example: 'bdl user = farkha;\nila (user === farkha) { /* ... */ }' },
    { darija: 'mchmcha', english: 'undefined', description: 'Represents a variable that has been declared but not assigned a value.', example: 'bdl age; // age is initially mchmcha\ntbe3(age); // Output: mchmcha' },
    { darija: 'Numbers', english: 'Numbers', description: 'Standard numeric literals, including integers and decimals.', example: 'bdl price = 99.50;\nbdl quantity = 10;\nbdl total = price * quantity;' },
    { darija: 'Strings', english: 'Strings', description: 'Sequence of characters enclosed in double (`"`) or single (`\'`) quotes.', example: 'bdl message = "Salam Dünya!";\nbdl name = \'Mouna\';' },
  ],
  "Built-in Functions (Dawall Lilbinaa)": [
    { darija: 'tbe3()', english: 'console.log()', description: 'Log arguments to the output console.', example: 'tbe3("Hello", 123, s7i7); // Output: Hello 123 true' },
    { darija: 'nadi()', english: 'alert()', description: 'Display a modal alert box with a message (browser-specific).', example: 'nadi("Warning: File not saved!");' },
    { darija: 'sowel()', english: 'prompt()', description: 'Display a dialog box prompting the user for input (browser-specific).', example: 'bdl name = sowel("Shno smitk?");\ntbe3("Mrehba, " + name);' },
    { darija: 'tsawal()', english: 'confirm()', description: 'Display a dialog box with a message and OK/Cancel buttons (browser-specific). Returns `s7i7` or `ghalat`.', example: 'bdl proceed = tsawal("Are you sure you want to delete?");\nila (proceed) { /* ... */ }' },
    { darija: 'ghlat()', english: 'console.error()', description: 'Log arguments to the console as an error message.', example: 'ghlat("Failed to load resource.");' },
    { darija: 'nbehh()', english: 'console.warn()', description: 'Log arguments to the console as a warning message.', example: 'nbehh("Deprecated function used. Please update.");' },
    { darija: 'rmmi()', english: 'throw', description: 'Throw a user-defined exception, interrupting normal execution.', example: 'ila (x < 0) {\n  rmmi("Value cannot be negative.");\n}' },
  ],
   "Math Functions (Dawall Riyadiat)": [
    { darija: 't7t()', english: 'Math.floor()', description: 'Return the largest integer less than or equal to a number.', example: 'tbe3(t7t(4.9)); // 4\ntbe3(t7t(-4.1)); // -5' },
    { darija: 'fo9()', english: 'Math.ceil()', description: 'Return the smallest integer greater than or equal to a number.', example: 'tbe3(fo9(4.1)); // 5\ntbe3(fo9(-4.9)); // -4' },
    { darija: 'dour()', english: 'Math.round()', description: 'Return the value of a number rounded to the nearest integer.', example: 'tbe3(dour(4.5)); // 5\ntbe3(dour(4.4)); // 4' },
    { darija: 'tsarraf()', english: 'Math.random()', description: 'Return a pseudo-random number between 0 (inclusive) and 1 (exclusive).', example: 'tbe3(tsarraf() * 10); // Random number between 0 and 10 (exclusive of 10)' },
    { darija: 'kbar()', english: 'Math.max()', description: 'Return the largest of zero or more numbers.', example: 'tbe3(kbar(1, 10, 5, 100, -2)); // 100' },
    { darija: 'sghar()', english: 'Math.min()', description: 'Return the smallest of zero or more numbers.', example: 'tbe3(sghar(1, 10, 5, 100, -2)); // -2' },
    { darija: 'mnfi()', english: 'Math.abs()', description: 'Return the absolute (non-negative) value of a number.', example: 'tbe3(mnfi(-5)); // 5\ntbe3(mnfi(5)); // 5' },
    { darija: 'rf3()', english: 'Math.pow()', description: 'Return the base to the exponent power (base^exponent).', example: 'tbe3(rf3(2, 3)); // 8 (2*2*2)\ntbe3(rf3(5, 2)); // 25' },
    { darija: 'jdr()', english: 'Math.sqrt()', description: 'Return the square root of a number.', example: 'tbe3(jdr(9)); // 3\ntbe3(jdr(2)); // 1.414...' },
  ],
  "String Functions/Properties (Dawall/Khasais Nossoss)": [
     { darija: 'ns()', english: 'String()', description: 'Convert a value to its string representation.', example: 'bdl num = 123;\nbdl strNum = ns(num); // strNum is "123"\ntbe3(no3 strNum); // "string"' },
    { darija: 'kbr7rf()', english: '.toUpperCase()', description: 'Convert all characters in a string to uppercase.', example: 'tbe3("hello".kbr7rf()); // "HELLO"' },
    { darija: 'sghr7rf()', english: '.toLowerCase()', description: 'Convert all characters in a string to lowercase.', example: 'tbe3("WORLD".sghr7rf()); // "world"' },
    { darija: 'kayn()', english: '.includes()', description: 'Check if a string contains another specified string. Returns `s7i7` or `ghalat`.', example: 'tbe3("salam".kayn("la")); // s7i7\ntbe3("hello".kayn("bye")); // ghalat' },
    { darija: 'twil', english: '.length', description: 'Property returning the number of characters in a string.', example: 'tbe3("hello".twil); // 5\ntbe3("".twil); // 0', usageNotes: 'This is a property, accessed without parentheses `()`. Example: `myString.twil`' },
  ],
  "Array Functions (Dawall Masfofat)": [
    { darija: 'zid()', english: 'push()', description: 'Add one or more elements to the *end* of an array. Modifies the original array.', example: 'bdl arr = [1, 2];\narr.zid(3, 4);\ntbe3(arr); // [1, 2, 3, 4]' },
    { darija: '7yed()', english: 'pop()', description: 'Remove the *last* element from an array and return that element. Modifies the original array.', example: 'bdl arr = [1, 2, 3];\nbdl last = arr.7yed();\ntbe3(last); // 3\ntbe3(arr); // [1, 2]' },
    { darija: '7yedmnlwla()', english: 'shift()', description: 'Remove the *first* element from an array and return that element. Modifies the original array.', example: 'bdl arr = [1, 2, 3];\nbdl first = arr.7yedmnlwla();\ntbe3(first); // 1\ntbe3(arr); // [2, 3]' },
    { darija: 'zidfllwla()', english: 'unshift()', description: 'Add one or more elements to the *beginning* of an array. Modifies the original array.', example: 'bdl arr = [2, 3];\narr.zidfllwla(0, 1);\ntbe3(arr); // [0, 1, 2, 3]' },
    { darija: 'dwr()', english: 'map()', description: 'Create a *new* array populated with the results of calling a provided function on every element in the calling array.', example: 'bdl nums = [1, 2, 3];\nbdl doubled = nums.dwr(dala(n) { rj3 n * 2; });\ntbe3(doubled); // [2, 4, 6]\ntbe3(nums); // [1, 2, 3] (original unchanged)' },
    { darija: 'n9i()', english: 'filter()', description: 'Create a *new* array with all elements that pass the test implemented by the provided function (function should return `s7i7` or `ghalat`).', example: 'bdl nums = [1, 2, 3, 4, 5];\nbdl evens = nums.n9i(dala(n) { rj3 n % 2 === 0; });\ntbe3(evens); // [2, 4]\ntbe3(nums); // [1, 2, 3, 4, 5] (original unchanged)' },
    { darija: 'lfech()', english: 'forEach()', description: 'Execute a provided function once for each array element. Does not return a new array.', example: 'bdl names = ["Ali", "Sara"];\nnames.lfech(dala(name, index) { tbe3("Index " + index + ": Salam " + name); }); // Prints Salam for each name' },
    { darija: 'l9a()', english: 'find()', description: 'Return the *value* of the first element in the array that satisfies the provided testing function. Returns `mchmcha` if no values satisfy.', example: 'bdl nums = [1, 5, 10, 15];\nbdl found = nums.l9a(dala(n) { rj3 n > 7; });\ntbe3(found); // 10' },
    { darija: 'lmmaj()', english: 'reduce()', description: 'Execute a "reducer" function on each element, resulting in a single output value (e.g., sum, product).', example: '// Summing an array\nbdl nums = [1, 2, 3, 4];\nbdl sum = nums.lmmaj(dala(accumulator, currentValue) {\n  rj3 accumulator + currentValue;\n}, 0); // 0 is the initial value\ntbe3(sum); // 10' },
    { darija: 'twil', english: '.length', description: 'Property returning the number of elements in an array.', example: 'tbe3([10, 20, 30].twil); // 3', usageNotes: 'This is a property, accessed without parentheses `()`. Example: `myArray.twil`' },
  ],
  "Object Functions (Dawall Lkainat)": [
    { darija: 'mfatih()', english: 'Object.keys()', description: 'Return an array of a given object\'s own enumerable property *names* (keys).', example: 'bdl person = { name: "Aisha", age: 30 };\ntbe3(mfatih(person)); // ["name", "age"] (requires special interpreter handling)' },
    { darija: 'qiyam()', english: 'Object.values()', description: 'Return an array of a given object\'s own enumerable property *values*.', example: 'bdl person = { name: "Aisha", age: 30 };\ntbe3(qiyam(person)); // ["Aisha", 30] (requires special interpreter handling)' },
  ],
  "Date Functions (Dawall Tarikh)": [
    { darija: 'daba()', english: 'Date.now()', description: 'Return the number of milliseconds elapsed since the Unix epoch (January 1, 1970).', example: 'tbe3(daba()); // Outputs a large number' },
    { darija: 'wa9t()', english: 'new Date()', description: 'Create a new Date object representing the current date and time, or a specific date if arguments are provided.', example: 'bdl now = jdid wa9t();\ntbe3(now); // Outputs the current date/time string\nbdl specificDate = jdid wa9t(2024, 5, 15); // Note: Month is 0-indexed (5 = June)\ntbe3(specificDate);' },
    { darija: '3am()', english: '.getFullYear()', description: 'Get the full year (4 digits) of a date object.', example: 'bdl d = jdid wa9t();\ntbe3(d.3am());' },
    { darija: 'chhr()', english: '.getMonth()', description: 'Get the month (0-11) of a date object. Add 1 for human-readable month.', example: 'bdl d = jdid wa9t();\ntbe3(d.chhr()); // Example: 5 for June' },
    { darija: 'nhar()', english: '.getDate()', description: 'Get the day of the month (1-31) of a date object.', example: 'bdl d = jdid wa9t();\ntbe3(d.nhar());' },
  ],
  "Timers (Moa9itin)": [
    { darija: 'sta9()', english: 'setTimeout()', description: 'Execute a function *once* after a specified delay (in milliseconds). Returns a timer ID.', example: 'tbe3("Starting...");\nsta9(dala() {\n  tbe3("...Delayed message after 1 second!");\n}, 1000); // 1000ms = 1 second' },
    { darija: 'krr()', english: 'setInterval()', description: 'Execute a function *repeatedly* at fixed time intervals (in milliseconds). Returns an interval ID.', example: 'bdl intervalId = krr(dala() {\n  tbe3("Repeating message every 2 seconds");\n}, 2000);\n// To stop: clearKrr(intervalId); (Needs clearKrr function)' },
    // Note: Need `clearSta9` and `clearKrr` (equivalent to clearTimeout/clearInterval) for practical use.
  ],
  "Error Handling (Mo3alajat L2akhtaa)": [
    { darija: 'jrb', english: 'try', description: 'Define a block of code to be tested for errors while it is being executed.', example: 'jrb {\n  tbe3("Trying...");\n  rmmi("Oh no! An error!");\n  tbe3("This won\'t show");\n} msk (err) {\n  tbe3("Caught error: " + err);\n} fakhr {\n  tbe3("This always runs, error or not.");\n}' },
    { darija: 'msk', english: 'catch', description: 'Define a block of code to be executed if an error occurs in the `jrb` block.', example: '// See jrb example' },
    { darija: 'fakhr', english: 'finally', description: 'Define a block of code to be executed regardless of the `jrb`/`msk` result (always runs after try or catch).', example: '// See jrb example' },
  ],
};


export function DarijaDocs() {
  return (
    // Add a specific class for targeting docs styles
    <div className="docs-container py-4">
      <Accordion type="multiple" className="w-full space-y-4">
        {Object.entries(documentation).map(([category, entries]) => (
          <AccordionItem value={category} key={category} className="accordion-item">
            {/* Use custom class */}
            <AccordionTrigger className="accordion-trigger">
              {category}
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              {entries.map((entry) => (
                <div key={entry.darija} className="doc-entry"> {/* Use custom class */}
                   <div className="doc-entry-header">
                     <span className="doc-entry-darija">{entry.darija}</span>
                     {entry.english && <Badge variant="secondary" className="doc-entry-english">({entry.english})</Badge>}
                  </div>
                  <p className="doc-entry-description">{entry.description}</p>
                  {entry.usageNotes && (
                     <p className="text-xs text-amber-700 dark:text-amber-500 italic mt-1">Notes: {entry.usageNotes}</p>
                  )}
                  {entry.example && (
                    <div className="doc-entry-example">
                       <CodeBlock code={entry.example} language="darijascript" className="code-block" />
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
         <div className="creator-credit"> {/* Use custom class */}
            Crafted with ❤️ by <span className="creator-name">MOUAAD IDOUFKIR</span>
        </div>
      </Accordion>
    </div>
  );
}
