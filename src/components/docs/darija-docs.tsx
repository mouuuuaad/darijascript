'use client';

import type * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeBlock } from '@/components/docs/code-block'; // Assuming CodeBlock exists

interface DocEntry {
  darija: string;
  english: string;
  description: string;
  example?: string;
}

const documentation: { [category: string]: DocEntry[] } = {
  "Keywords & Declarations": [
    { darija: 'tabit', english: 'const', description: 'Declare a constant variable (value cannot be reassigned).', example: 'tabit PI = 3.14;' },
    { darija: 'bdl', english: 'let / var', description: 'Declare a variable (value can be reassigned).', example: 'bdl counter = 0;\ncounter = counter + 1;' },
    { darija: 'dala', english: 'function', description: 'Define a function block.', example: 'dala greet(name) {\n  tbe3("Salam, " + name + "!");\n}\ngreet("Dunya");' },
    { darija: 'rj3', english: 'return', description: 'Return a value from a function.', example: 'dala add(a, b) {\n  rj3 a + b;\n}\nbdl sum = add(5, 3); // sum is 8' },
    { darija: 'jdid', english: 'new', description: 'Create an instance of an object.', example: 'bdl today = jdid wa9t(); // Creates a new Date object' },
    { darija: 'hadi', english: 'this', description: 'Refers to the current execution context (object). Behavior similar to JavaScript `this`.' },
    { darija: 'no3', english: 'typeof', description: 'Returns a string indicating the type of the unevaluated operand.', example: 'tbe3(no3 123); // "number"\ntbe3(no3 "hello"); // "string"' },
  ],
  "Control Flow": [
    { darija: 'ila', english: 'if', description: 'Execute code block if a condition is true.', example: 'bdl age = 20;\nila (age >= 18) {\n  tbe3("Adult");\n}' },
    { darija: 'ella', english: 'else', description: 'Execute code block if the `ila` condition is false.', example: 'ila (age >= 18) {\n  tbe3("Adult");\n} ella {\n  tbe3("Minor");\n}' },
    { darija: 'wa9ila', english: 'else if', description: 'Check another condition if the previous `ila` was false.', example: 'bdl score = 75;\nila (score >= 90) {\n  tbe3("A");\n} wa9ila (score >= 70) {\n  tbe3("C"); // This will run\n} ella {\n  tbe3("F");\n}' },
    { darija: 'douz', english: 'for', description: 'Create a loop with initialization, condition, and increment.', example: '// Prints 0 to 4\ndouz (bdl i = 0; i < 5; i = i + 1) {\n  tbe3(i);\n}' },
    { darija: 'madamt', english: 'while', description: 'Execute code block as long as a condition is true.', example: 'bdl count = 0;\nmadamt (count < 3) {\n  tbe3(count);\n  count = count + 1;\n}' },
    { darija: 'dir...madamt', english: 'do...while', description: 'Execute code block once, then repeat as long as a condition is true.', example: 'bdl i = 5;\ndir {\n  tbe3(i); // Runs once even if condition is initially false\n  i = i - 1;\n} madamt (i > 5);' },
    { darija: 'bdl3la', english: 'switch', description: 'Select one of many code blocks to be executed.', example: 'bdl day = "Monday";\nbdl3la (day) {\n  7ala "Saturday":\n  7ala "Sunday":\n    tbe3("Weekend!");\n    wa9f;\n  3adi:\n    tbe3("Weekday");\n}' },
    { darija: '7ala', english: 'case', description: 'Define a specific case within a `bdl3la` statement.', example: '// See bdl3la example' },
    { darija: '3adi', english: 'default', description: 'Define the default code block in a `bdl3la` statement.', example: '// See bdl3la example' },
    { darija: 'wa9f', english: 'break', description: 'Exit a loop (`douz`, `madamt`, `dir...madamt`) or `bdl3la` statement.', example: 'douz (bdl i = 0; i < 10; i = i + 1) {\n  ila (i === 5) {\n    wa9f; // Stops the loop when i is 5\n  }\n  tbe3(i);\n}' },
    { darija: 'kamml', english: 'continue', description: 'Skip the current iteration of a loop and continue with the next one.', example: 'douz (bdl i = 0; i < 5; i = i + 1) {\n  ila (i === 2) {\n    kamml; // Skips printing 2\n  }\n  tbe3(i);\n}' },
  ],
  "Values & Literals": [
    { darija: 's7i7', english: 'true', description: 'Boolean literal for truth.', example: 'bdl isReady = s7i7;' },
    { darija: 'ghalat', english: 'false', description: 'Boolean literal for falsehood. `kdb` is also accepted.', example: 'bdl hasErrors = ghalat;' },
    { darija: 'farkha', english: 'null', description: 'Represents the intentional absence of any object value.', example: 'bdl user = farkha;' },
    { darija: 'mchmcha', english: 'undefined', description: 'Represents a variable that has not been assigned a value.', example: 'bdl age; // age is mchmcha initially' },
    { darija: 'Numbers', english: 'Numbers', description: 'Standard numeric literals (integers and decimals).', example: 'bdl price = 99.50;\nbdl quantity = 10;' },
    { darija: 'Strings', english: 'Strings', description: 'Sequence of characters enclosed in double ("") or single (\'\') quotes.', example: 'bdl message = "Salam Dünya!";\nbdl name = \'Mouna\';' },
  ],
  "Built-in Functions": [
    { darija: 'tbe3()', english: 'console.log()', description: 'Log arguments to the output console.', example: 'tbe3("Hello", 123, s7i7);' },
    { darija: 'nadi()', english: 'alert()', description: 'Display an alert box with a message.', example: 'nadi("Warning!");' },
    { darija: 'sowel()', english: 'prompt()', description: 'Display a dialog box prompting the user for input.', example: 'bdl name = sowel("Enter your name:");' },
    { darija: 'tsawal()', english: 'confirm()', description: 'Display a dialog box with a message and OK/Cancel buttons.', example: 'bdl proceed = tsawal("Are you sure?");' },
    { darija: 'ghlat()', english: 'console.error()', description: 'Log arguments to the console as an error.', example: 'ghlat("Failed to load resource.");' },
    { darija: 'nbehh()', english: 'console.warn()', description: 'Log arguments to the console as a warning.', example: 'nbehh("Deprecated function used.");' },
    { darija: 'rmmi()', english: 'throw', description: 'Throw a user-defined exception.', example: 'ila (x < 0) {\n  rmmi("Value cannot be negative.");\n}' },
  ],
  "Math Functions": [
    { darija: 't7t()', english: 'Math.floor()', description: 'Return the largest integer less than or equal to a number.', example: 'tbe3(t7t(4.9)); // 4' },
    { darija: 'fo9()', english: 'Math.ceil()', description: 'Return the smallest integer greater than or equal to a number.', example: 'tbe3(fo9(4.1)); // 5' },
    { darija: 'dour()', english: 'Math.round()', description: 'Return the value of a number rounded to the nearest integer.', example: 'tbe3(dour(4.5)); // 5' },
    { darija: 'tsarraf()', english: 'Math.random()', description: 'Return a pseudo-random number between 0 (inclusive) and 1 (exclusive).', example: 'tbe3(tsarraf());' },
    { darija: 'kbar()', english: 'Math.max()', description: 'Return the largest of zero or more numbers.', example: 'tbe3(kbar(1, 10, 5)); // 10' },
    { darija: 'sghar()', english: 'Math.min()', description: 'Return the smallest of zero or more numbers.', example: 'tbe3(sghar(1, 10, 5)); // 1' },
    { darija: 'mnfi()', english: 'Math.abs()', description: 'Return the absolute value of a number.', example: 'tbe3(mnfi(-5)); // 5' },
    { darija: 'rf3()', english: 'Math.pow()', description: 'Return the base to the exponent power.', example: 'tbe3(rf3(2, 3)); // 8' },
    { darija: 'jdr()', english: 'Math.sqrt()', description: 'Return the square root of a number.', example: 'tbe3(jdr(9)); // 3' },
  ],
  "String Functions/Properties": [
     { darija: 'ns()', english: 'String()', description: 'Convert a value to its string representation.', example: 'bdl num = 123;\nbdl strNum = ns(num); // "123"' },
    { darija: 'kbr7rf()', english: '.toUpperCase()', description: 'Convert a string to uppercase.', example: 'tbe3("hello".kbr7rf()); // "HELLO"' },
    { darija: 'sghr7rf()', english: '.toLowerCase()', description: 'Convert a string to lowercase.', example: 'tbe3("WORLD".sghr7rf()); // "world"' },
    { darija: 'kayn()', english: '.includes()', description: 'Check if a string contains another string.', example: 'tbe3("salam".kayn("la")); // s7i7 (true)' },
    { darija: 'twil', english: '.length', description: 'Property returning the length of a string.', example: 'tbe3("hello".twil); // 5' },
  ],
  "Array Functions": [
    { darija: 'zid()', english: 'push()', description: 'Add one or more elements to the end of an array.', example: 'bdl arr = [1, 2];\narr.zid(3);\n tbe3(arr); // [1, 2, 3]' },
    { darija: '7yed()', english: 'pop()', description: 'Remove the last element from an array and return it.', example: 'bdl arr = [1, 2, 3];\nbdl last = arr.7yed();\ntbe3(last); // 3\ntbe3(arr); // [1, 2]' },
    { darija: '7yedmnlwla()', english: 'shift()', description: 'Remove the first element from an array and return it.', example: 'bdl arr = [1, 2, 3];\nbdl first = arr.7yedmnlwla();\ntbe3(first); // 1\ntbe3(arr); // [2, 3]' },
    { darija: 'zidfllwla()', english: 'unshift()', description: 'Add one or more elements to the beginning of an array.', example: 'bdl arr = [2, 3];\narr.zidfllwla(1);\ntbe3(arr); // [1, 2, 3]' },
    { darija: 'dwr()', english: 'map()', description: 'Create a new array with the results of calling a provided function on every element.', example: 'bdl nums = [1, 2, 3];\nbdl doubled = nums.dwr(dala(n) { rj3 n * 2; });\ntbe3(doubled); // [2, 4, 6]' },
    { darija: 'n9i()', english: 'filter()', description: 'Create a new array with all elements that pass the test implemented by the provided function.', example: 'bdl nums = [1, 2, 3, 4];\nbdl evens = nums.n9i(dala(n) { rj3 n % 2 === 0; });\ntbe3(evens); // [2, 4]' },
    { darija: 'lfech()', english: 'forEach()', description: 'Execute a provided function once for each array element.', example: 'bdl names = ["Ali", "Sara"];\nnames.lfech(dala(name) { tbe3("Salam " + name); });' },
    { darija: 'l9a()', english: 'find()', description: 'Return the value of the first element that satisfies the provided testing function.', example: 'bdl nums = [1, 5, 10];\nbdl found = nums.l9a(dala(n) { rj3 n > 5; });\ntbe3(found); // 10' },
    { darija: 'lmmaj()', english: 'reduce()', description: 'Execute a reducer function on each element, resulting in a single output value.', example: 'bdl nums = [1, 2, 3];\nbdl sum = nums.lmmaj(dala(acc, curr) { rj3 acc + curr; }, 0);\ntbe3(sum); // 6' },
    { darija: 'twil', english: '.length', description: 'Property returning the number of elements in an array.', example: 'tbe3([1, 2, 3].twil); // 3' },
  ],
  "Object Functions": [
    { darija: 'mfatih()', english: 'Object.keys()', description: 'Return an array of a given object\'s own enumerable property names.', example: 'bdl obj = { a: 1, b: 2 };\ntbe3(mfatih(obj)); // ["a", "b"] (requires special interpreter handling)' },
    { darija: 'qiyam()', english: 'Object.values()', description: 'Return an array of a given object\'s own enumerable property values.', example: 'bdl obj = { a: 1, b: 2 };\ntbe3(qiyam(obj)); // [1, 2] (requires special interpreter handling)' },
  ],
  "Date Functions": [
    { darija: 'daba()', english: 'Date.now()', description: 'Return the number of milliseconds elapsed since the epoch.', example: 'tbe3(daba());' },
    { darija: 'wa9t()', english: 'new Date()', description: 'Create a new Date object.', example: 'bdl now = wa9t();\ntbe3(now);' },
    { darija: '3am()', english: '.getFullYear()', description: 'Get the year of a date.', example: 'bdl d = wa9t();\ntbe3(d.3am());' },
    { darija: 'chhr()', english: '.getMonth()', description: 'Get the month (0-11) of a date.', example: 'bdl d = wa9t();\ntbe3(d.chhr()); // Month is 0-indexed' },
    { darija: 'nhar()', english: '.getDate()', description: 'Get the day of the month (1-31).', example: 'bdl d = wa9t();\ntbe3(d.nhar());' },
  ],
  "Timers": [
    { darija: 'sta9()', english: 'setTimeout()', description: 'Execute a function once after a delay (in milliseconds).', example: 'sta9(dala() {\n  tbe3("Delayed message");\n}, 1000); // Executes after 1 second' },
    { darija: 'krr()', english: 'setInterval()', description: 'Execute a function repeatedly at fixed time intervals (in milliseconds).', example: 'bdl intervalId = krr(dala() {\n  tbe3("Repeating message");\n}, 2000); // Executes every 2 seconds\n// Need a way to clear: clearKrr(intervalId);' },
    // Note: Need `clearSta9` and `clearKrr` (equivalent to clearTimeout/clearInterval)
  ],
  "Error Handling": [
    { darija: 'jrb', english: 'try', description: 'Define a block of code to be tested for errors.', example: 'jrb {\n  // Code that might throw an error\n  rmmi("Something went wrong");\n} msk (err) {\n  tbe3("Caught error:", err);\n} fakhr {\n  tbe3("This always runs");\n}' },
    { darija: 'msk', english: 'catch', description: 'Define a block of code to be executed if an error occurs in the `jrb` block.', example: '// See jrb example' },
    { darija: 'fakhr', english: 'finally', description: 'Define a block of code to be executed regardless of the `jrb`/`msk` result.', example: '// See jrb example' },
  ],
};


export function DarijaDocs() {
  return (
    <Accordion type="multiple" className="w-full space-y-2 py-4">
      {Object.entries(documentation).map(([category, entries]) => (
        <AccordionItem value={category} key={category} className="border rounded-md shadow-sm bg-card">
          <AccordionTrigger className="px-4 py-3 text-base font-semibold text-primary hover:no-underline">
            {category}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            {entries.map((entry) => (
              <div key={entry.darija} className="border-l-4 border-accent pl-4 py-2 bg-muted/30 rounded-r-md">
                <p className="font-mono font-semibold text-accent text-sm">
                  {entry.darija} {entry.english && <span className="text-muted-foreground text-xs font-normal">({entry.english})</span>}
                </p>
                <p className="text-sm text-foreground/90 mt-1">{entry.description}</p>
                {entry.example && (
                  <div className="mt-2">
                     <CodeBlock code={entry.example} language="darijascript" />
                  </div>
                )}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
       <div className="mt-6 text-center text-sm text-muted-foreground">
          Created by <span className="font-semibold text-primary">MOUAAD IDOUFKIR</span>
      </div>
    </Accordion>
  );
}
