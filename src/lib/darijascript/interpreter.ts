

// Import the parse function and ASTNode interface
import { ASTNode, parse as parseCode } from './parser';

interface Token {
  type: string;
  value: any;
  line: number;
  column: number;
}

const KEYWORDS = [
  'tabit', // const
  'bdl', // let / var
  'ila', // if
  'ella', // else
  'wa9ila', // else if (wa ila)
  'douz', // for
  'madamt', // while
  'dir', // do (dir...madamt)
  'wa9f', // break
  'kamml', // continue
  'dala', // function (was khdma) -> changed to dala
  'rj3', // return (was rja3) -> changed to rj3
  'jrb', // try
  'msk', // catch
  'fakhr', // finally
  'bdl3la', // switch
  '7ala', // case <-- Starts with number
  '3adi', // default <-- Starts with number
  'mnin', // from (for...of/in) -> Keep? Not standard JS 'for' structure
  'hta', // until/to (for loops) -> Keep? Not standard JS 'for' structure
  'farkha', // null
  'mchmcha', // undefined
  'jdid', // new
  'hadi', // this
  'no3', // typeof
];

// Boolean Literals mapping
const BOOLEAN_LITERALS: { [key: string]: boolean } = {
    's7i7': true, // true
    'kdb': false, // false - Added kdb as alternative
    'ghalat': false // Added 'ghalat' as false for flexibility
};

// Built-in function names mapped to their JS equivalents for direct call
// This mapping is crucial for the interpreter.
const BUILTIN_FUNCTIONS: { [key: string]: (...args: any[]) => any } = {
  'tbe3': (...args: any[]) => console.log(...args), // console.log
  'nadi': (message: string) => alert(message), // alert
  'sowel': (question: string) => prompt(question), // prompt
  'tsawal': (message: string) => confirm(message), // confirm
  'ghlat': (...args: any[]) => console.error(...args), // console.error
  'nbehh': (...args: any[]) => console.warn(...args), // console.warn
  't7t': (num: number) => Math.floor(num), // Math.floor
  'fo9': (num: number) => Math.ceil(num), // Math.ceil
  'dour': (num: number) => Math.round(num), // Math.round
  'tsarraf': () => Math.random(), // Math.random
  'kbar': (...args: number[]) => Math.max(...args), // Math.max
  'sghar': (...args: number[]) => Math.min(...args), // Math.min
  'mnfi': (num: number) => Math.abs(num), // Math.abs
  'rf3': (base: number, exp: number) => Math.pow(base, exp), // Math.pow
  'jdr': (num: number) => Math.sqrt(num), // Math.sqrt
  'ns': (value: any) => String(value), // String()
  'daba': () => Date.now(), // Date.now()
  'wa9t': (...args: any[]) => new Date(...args), // new Date()
  'sta9': (callback: TimerHandler, delay?: number, ...args: any[]) => setTimeout(callback, delay, ...args), // setTimeout
  'krr': (callback: TimerHandler, delay?: number, ...args: any[]) => setInterval(callback, delay, ...args), // setInterval
  'rmmi': (error: any) => { throw error; }, // throw (implemented as a function for consistency)
};

// Properties need special handling, e.g., 'twil' for length
// Mapping Darija property names to JS property names
const BUILTIN_PROPERTIES: { [key: string]: string } = {
    'twil': 'length', // length property
};

// Method calls need special handling based on the object type
// List of Darija method names that need mapping
const BUILTIN_METHODS: string[] = [
  'kbr7rf', // toUpperCase
  'sghr7rf', // toLowerCase
  'kayn', // includes
  'zid', // push
  '7yed', // pop
  '7yedmnlwla', // shift
  'zidfllwla', // unshift
  'dwr', // map
  'n9i', // filter
  'lfech', // forEach
  'l9a', // find
  'lmmaj', // reduce
  'mfatih', // Object.keys (Special handling required)
  'qiyam', // Object.values (Special handling required)
  '3am', // getFullYear
  'chhr', // getMonth
  'nhar' // getDate
];


const OPERATORS = ['+', '-', '*', '/', '%', '=', '==', '!=', '===', '!==', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-=', '*=', '/=', '%='];
const PUNCTUATION = ['(', ')', '{', '}', ';', ',', '.', ':']; // Added '.' for method calls

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  let line = 1;
  let column = 0; // Column numbers are 0-indexed internally for simplicity

  while (cursor < code.length) {
    let char = code[cursor];
    const startColumn = column; // Store column at the start of the token

    // Skip whitespace
    if (/\s/.test(char)) {
      if (char === '\n') {
        line++;
        column = 0;
      } else {
        column++;
      }
      cursor++;
      continue;
    }

    // Skip comments
    if (char === '/' && code[cursor + 1] === '/') {
      while (cursor < code.length && code[cursor] !== '\n') {
        cursor++;
      }
      // No need to increment line/column here, the newline handling above takes care of it
      continue; // Skip the rest of the line
    }
    if (char === '/' && code[cursor + 1] === '*') {
      cursor += 2; // Skip '/*'
      column += 2;
      while (cursor < code.length && !(code[cursor] === '*' && code[cursor + 1] === '/')) {
        if (code[cursor] === '\n') {
          line++;
          column = 0;
        } else {
          column++;
        }
        cursor++;
      }
      if (cursor < code.length) {
        cursor += 2; // Skip '*/'
        column += 2;
      } else {
           // Unterminated block comment
           tokens.push({ type: 'ERROR', value: `Commentaire block ma msdoudch`, line, column: startColumn });
           break; // Stop tokenizing on error
      }
      continue;
    }

    // Check for specific keywords starting with numbers *before* general identifiers/numbers
    // Ensure we match the whole word using regex lookahead for non-word characters or end of string
    if (code.substring(cursor).match(/^7ala(?!\w)/)) {
        tokens.push({ type: 'KEYWORD', value: '7ala', line, column: startColumn });
        cursor += 4; column += 4; continue;
    }
    if (code.substring(cursor).match(/^3adi(?!\w)/)) {
        tokens.push({ type: 'KEYWORD', value: '3adi', line, column: startColumn });
        cursor += 4; column += 4; continue;
    }
    // Add other number-starting keywords here if any (e.g., 3am, 7yed)
    // Note: BUILTIN_METHODS check below should handle these if they are not *strictly* keywords

    // Identifiers, keywords (starting with letter/underscore), built-ins, booleans
    if (/[a-zA-Z_]/.test(char)) { // Start with letter or underscore
      let word = '';
      while (cursor < code.length && /[a-zA-Z0-9_]/.test(code[cursor])) { // Continue with letters, numbers, or underscore
        word += code[cursor];
        cursor++;
        column++;
      }

      if (KEYWORDS.includes(word)) {
        tokens.push({ type: 'KEYWORD', value: word, line, column: startColumn });
      } else if (word in BOOLEAN_LITERALS) {
        tokens.push({ type: 'BOOLEAN', value: BOOLEAN_LITERALS[word], line, column: startColumn });
      } else if (word in BUILTIN_FUNCTIONS) {
        tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn }); // Treat as identifier
      } else if (word in BUILTIN_PROPERTIES) {
         tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn }); // Treat as identifier
      } else if (BUILTIN_METHODS.includes(word)) {
         // Includes methods starting with numbers like 7yed, 3am handled here if not caught above
         tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn }); // Treat as identifier
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn });
      }
      continue;
    }

    // Numbers (integer and float) - This comes *after* checking keywords like 7ala, 3adi
    if (/\d/.test(char) || (char === '.' && /\d/.test(code[cursor + 1]))) { // Starts with digit or '.' followed by digit
        let numStr = '';
        let hasDecimal = false;
        if(char === '.') {
            numStr += '.';
            cursor++;
            column++;
            hasDecimal = true;
        }
        while (cursor < code.length && /\d/.test(code[cursor])) {
            numStr += code[cursor];
            cursor++;
            column++;
        }
        if (!hasDecimal && code[cursor] === '.') { // Check for decimal point after digits
             // Check if the next char is also a digit to avoid conflict with member access '.'
             if (/\d/.test(code[cursor + 1])) {
                numStr += '.';
                cursor++;
                column++;
                hasDecimal = true;
                while (cursor < code.length && /\d/.test(code[cursor])) {
                    numStr += code[cursor];
                    cursor++;
                    column++;
                }
             }
             // If '.' is not followed by a digit, it's likely a member access, handle it later.
        }

       // Basic exponent handling (e.g., 1e3, 1.5e-2)
       if (cursor < code.length && (code[cursor] === 'e' || code[cursor] === 'E')) {
           numStr += code[cursor];
           cursor++;
           column++;
            if (cursor < code.length && (code[cursor] === '+' || code[cursor] === '-')) {
                 numStr += code[cursor];
                 cursor++;
                 column++;
            }
            if (cursor < code.length && /\d/.test(code[cursor])) {
                 while (cursor < code.length && /\d/.test(code[cursor])) {
                    numStr += code[cursor];
                    cursor++;
                    column++;
                 }
            } else {
                 // Invalid exponent format
                 tokens.push({ type: 'ERROR', value: `Format dyal exponent machi s7i7 f Raqam`, line, column: startColumn });
                 break; // Stop tokenizing
            }
       }


      try {
           const value = parseFloat(numStr);
           if (isNaN(value)) {
                throw new Error("Raqam machi s7i7");
           }
           tokens.push({ type: 'NUMBER', value: value, line, column: startColumn });
      } catch (e: any) {
            tokens.push({ type: 'ERROR', value: `Raqam machi s7i7: ${numStr}`, line, column: startColumn });
            break; // Stop tokenizing
      }
      continue;
    }

    // Strings (double and single quotes)
    if (char === '"' || char === "'") {
      const quoteType = char;
      let str = '';
      cursor++; // Skip opening quote
      column++;
      while (cursor < code.length && code[cursor] !== quoteType) {
          let currentChar = code[cursor];
          if (currentChar === '\\') { // Handle escape sequences
             cursor++;
             column++;
             if (cursor >= code.length) {
                 tokens.push({ type: 'ERROR', value: `Chaine de caractères pas fermée après l'échappement`, line, column: startColumn });
                 str = ''; // Mark as error state
                 break;
             }
             let escapedChar = code[cursor];
              switch (escapedChar) {
                  case 'n': str += '\n'; break;
                  case 't': str += '\t'; break;
                  case 'r': str += '\r'; break;
                  case 'b': str += '\b'; break;
                  case 'f': str += '\f'; break;
                  case '\\': str += '\\'; break;
                  case '"': str += '"'; break;
                  case "'": str += "'"; break;
                  // Add more escapes if needed (e.g., unicode \uXXXX)
                  default:
                      // Keep unrecognized escapes as backslash + char
                      str += '\\' + escapedChar;
              }

          } else if (currentChar === '\n') {
             // Strings cannot span lines in basic DarijaScript unless escaped?
             // For simplicity, forbid raw newlines in strings.
             tokens.push({ type: 'ERROR', value: `Chaine de caractères ne peut pas contenir de nouvelle ligne.`, line, column: startColumn });
             str = ''; // Mark as error state
             break; // Stop processing this string
          } else {
            str += currentChar;
          }
          cursor++;
          column++;
      }

       if (str === '' && tokens[tokens.length-1]?.type === 'ERROR') {
            // Error already pushed
            break; // Stop tokenizing
       }

      if (cursor >= code.length || code[cursor] !== quoteType) {
         tokens.push({ type: 'ERROR', value: `Chaine de caractères pas fermée. Kan khass ${quoteType}`, line, column: startColumn });
         break; // Stop tokenizing
      }
      cursor++; // Skip closing quote
      column++;
      tokens.push({ type: 'STRING', value: str, line, column: startColumn });
      continue;
    }

    // Operators and Punctuation
    let operatorFound = false;
    // Check for 3-char operators first (===, !==)
    for (let len = 3; len >= 1; len--) {
        const opCandidate = code.substring(cursor, cursor + len);
        if (OPERATORS.includes(opCandidate)) {
            tokens.push({ type: 'OPERATOR', value: opCandidate, line, column: startColumn });
            cursor += len;
            column += len;
            operatorFound = true;
            break;
        }
    }
    if (operatorFound) continue;


    if (PUNCTUATION.includes(char)) {
      tokens.push({ type: 'PUNCTUATION', value: char, line, column: startColumn });
      cursor++;
      column++;
      continue;
    }


    // Unrecognized character
    tokens.push({ type: 'ERROR', value: `Ma 3rftch had l caractère: "${char}"`, line, column: startColumn });
    break; // Stop tokenizing on the first error
  }

   // Add EOF token only if no error occurred during tokenization
   if (tokens.length === 0 || tokens[tokens.length - 1].type !== 'ERROR') {
       tokens.push({ type: 'EOF', value: null, line, column }); // End of File token
   }
  return tokens;
}


// --- Interpreter ---

class Environment {
    parent: Environment | null;
    vars: Map<string, any>;
    consts: Set<string>;

    constructor(parent: Environment | null = null) {
        this.parent = parent;
        this.vars = new Map();
        this.consts = new Set();
    }

    declare(name: string, value: any, isConstant: boolean) {
        // Allow re-declaration for 'bdl' in the same scope? (like JS var) - For simplicity, disallow.
        if (this.vars.has(name)) {
            // Check if it's already declared in *this specific* scope
             if (Object.prototype.hasOwnProperty.call(this.vars, name)) {
                 throw new Error(`Variable "${name}" déjà déclarée f had l scope.`);
             }
        }
        this.vars.set(name, value);
        if (isConstant) {
            this.consts.add(name);
        }
        return value;
    }

    assign(name: string, value: any) {
        const env = this.resolve(name);
        if (!env) {
            // Allow creating global variables if assigned without declaration? (like non-strict JS)
            // For stricter behavior:
             throw new Error(`Variable "${name}" ma declaritch 9bel matbdlha.`);
        }
        if (env.consts.has(name)) {
             throw new Error(`Ma ymknch tbdl constant "${name}".`);
        }
        env.vars.set(name, value);
        return value;
    }

    lookup(name: string): any {
        const env = this.resolve(name);
        if (!env) {
            // Check for global window/global object properties?
            if (typeof window !== 'undefined' && name in window) {
                return (window as any)[name];
            }
             if (typeof global !== 'undefined' && name in global) {
                 return (global as any)[name];
             }
            throw new Error(`Variable "${name}" ma declaritch.`);
        }
        // Check if the variable exists in the resolved environment's map
        if (!env.vars.has(name)) {
             // This case might indicate an issue with resolve logic if env is found but var isn't
             throw new Error(`Internal Error: Variable "${name}" not found in resolved environment.`);
        }
        return env.vars.get(name);
    }

    // Finds the environment where the variable was declared
    resolve(name: string): Environment | null {
        if (this.vars.has(name)) {
            return this;
        }
        if (this.parent) {
            return this.parent.resolve(name);
        }
        return null; // Not found in the chain
    }

    extend(): Environment {
        // Create a new environment whose parent is the current one
        return new Environment(this);
    }
}

// --- Custom Classes for Control Flow and Functions ---

class ReturnValue {
    value: any;
    constructor(value: any) {
        this.value = value;
    }
}

class BreakSignal {
    // No properties needed, just the class type acts as the signal
}
class ContinueSignal {
     // No properties needed
}

// Represents a user-defined DarijaScript function and its captured environment (closure)
class DarijaScriptFunction {
    name: string | null; // Can be anonymous
    params: ASTNode[]; // Parameter identifiers
    body: ASTNode; // BlockStatement
    closure: Environment; // The environment where the function was defined

    constructor(name: string | null, params: ASTNode[], body: ASTNode, closure: Environment) {
        this.name = name;
        this.params = params;
        this.body = body;
        this.closure = closure;
    }

    // This helps identify it as a function for 'typeof' but doesn't make it natively callable
    get [Symbol.toStringTag]() {
        return 'Function';
    }
}


class Interpreter {
    ast: ASTNode;
    globalEnv: Environment;
    output: string[] = []; // To store output from 'tbe3' etc.
    errorOccurred: boolean = false; // Flag to stop execution on error

    constructor(ast: ASTNode) {
        this.ast = ast;
        this.globalEnv = new Environment();
        this.errorOccurred = false; // Reset error flag

        // --- Inject built-in functions and constants into the global environment ---
        for (const name in BUILTIN_FUNCTIONS) {
            // Wrap native functions to handle potential errors and 'this' context
            const nativeFunc = BUILTIN_FUNCTIONS[name];
            this.globalEnv.declare(name, (...args: any[]) => {
                try {
                     // Special case for 'rmmi' (throw)
                     if (name === 'rmmi') {
                         throw args[0]; // Throw the provided argument
                     }
                     // Capture output for specific functions
                     if (['tbe3', 'ghlat', 'nbehh'].includes(name)) {
                         const formattedArgs = args.map(arg => this.formatValueForOutput(arg)).join(' ');
                         this.output.push(formattedArgs);
                         // Still call the original console method
                         return nativeFunc.apply(console, args);
                     }
                    // Call other native functions (Math, Date, etc.)
                    // Use `undefined` as `this` context for global functions like Math methods
                     return nativeFunc.apply(undefined, args);
                } catch (error: any) {
                    // Catch errors from native function calls and re-throw as runtime errors
                    throw new Error(`Ghalat f dlla "${name}": ${error.message}`);
                }
            }, true); // Declare as constant
        }

        // Inject language constants
        this.globalEnv.declare('mchmcha', undefined, true); // undefined
        this.globalEnv.declare('farkha', null, true); // null
        // Inject `hadi` (this) - global 'this' is complex, simplifying to undefined/window
        this.globalEnv.declare('hadi', typeof window !== 'undefined' ? window : undefined, true); // Simplified global `hadi`

         // Inject Math object (or specific methods if preferred)
         // this.globalEnv.declare('Riyadiyat', Math, true); // Example: Expose Math object

    }

    interpret(node: ASTNode = this.ast, env: Environment = this.globalEnv): any {
         if (this.errorOccurred) return { error: "Execution stopped due to previous error." }; // Stop if an error happened

        try {
           return this.evaluate(node, env);
        } catch (error: any) {
            if (this.errorOccurred) return; // Don't report secondary errors

             // Control flow signals should be caught and handled by loops/functions, not here.
             if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
                throw error; // Propagate control flow signals up
             }

             // Handle runtime errors (including those thrown by 'rmmi' or native functions)
            this.errorOccurred = true; // Set the flag
            const errorNode = node; // The node where the error likely originated
            const errorMessage = `Runtime Ghalat [Ln ${errorNode.line ?? '?'}, Col ${errorNode.column ?? '?'}]: ${error.message || error}`;
            this.output.push(`Ghalat: ${errorMessage}`);
            console.error("Interpreter Runtime Error:", errorMessage, error); // Also log the full error stack
            return { error: errorMessage }; // Return an error object
        }
    }

    evaluate(node: ASTNode, env: Environment): any {
        if (this.errorOccurred) return; // Check flag at the start of evaluation
        // console.log("Evaluating:", node.type, node); // Debugging log

        // Assign line/column from node to the interpreter context for better error reporting
        // (This requires nodes to have line/column info from the parser)
        const currentNodeLine = node.line;
        const currentNodeColumn = node.column;


        switch (node.type) {
            case 'Program':
                let lastVal: any = undefined;
                for (const stmt of node.body ?? []) {
                    lastVal = this.evaluate(stmt, env);
                    if (this.errorOccurred) return lastVal; // Stop program on error
                }
                return lastVal; // Return value of the last statement

            case 'ExpressionStatement': // Handle ExpressionStatement
                return this.evaluate(node.expression!, env); // Evaluate the expression within

            case 'VariableDeclaration':
                return this.visitVariableDeclaration(node, env);
            case 'AssignmentExpression':
                return this.visitAssignmentExpression(node, env);
            case 'BinaryExpression':
                return this.visitBinaryExpression(node, env);
            case 'UnaryExpression':
                return this.visitUnaryExpression(node, env);
             case 'UpdateExpression': // Handle ++ and --
                return this.visitUpdateExpression(node, env);
             case 'LogicalExpression': // Handle && and || specifically if needed
                return this.visitLogicalExpression(node, env);
            case 'Identifier':
                return env.lookup(node.name!); // Throws if not found
            case 'NumericLiteral':
                return node.value;
            case 'StringLiteral':
                return node.value;
            case 'BooleanLiteral':
                return node.value;
             case 'NullLiteral': // Added for 'farkha'
                 return null;
             case 'UndefinedLiteral': // Added for 'mchmcha'
                 return undefined;
             case 'ThisExpression': // Handle 'hadi'
                 return env.lookup('hadi'); // Look up 'this' value in the current env chain
            case 'CallExpression':
                return this.visitCallExpression(node, env);
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration(node, env);
             case 'FunctionExpression': // Handle anonymous functions if parsed
                return this.visitFunctionExpression(node, env);
            case 'ReturnStatement':
                 // Evaluate the argument and wrap it in ReturnValue
                throw new ReturnValue(node.argument ? this.evaluate(node.argument, env) : undefined);
            case 'IfStatement':
                 return this.visitIfStatement(node, env);
            case 'BlockStatement':
                 return this.visitBlockStatement(node, env); // Handles its own scope
            case 'WhileStatement':
                return this.visitWhileStatement(node, env);
            case 'DoWhileStatement':
                return this.visitDoWhileStatement(node, env);
            case 'ForStatement':
                return this.visitForStatement(node, env);
            case 'BreakStatement':
                throw new BreakSignal(); // Signal to break out of a loop/switch
            case 'ContinueStatement':
                throw new ContinueSignal(); // Signal to continue to next loop iteration
            case 'TryStatement':
                return this.visitTryStatement(node, env);
             // 'ThrowStatement' isn't parsed directly, 'rmmi()' call handles it.
            case 'MemberExpression':
                return this.visitMemberExpression(node, env);
             case 'NewExpression': // Handle 'jdid'
                return this.visitNewExpression(node, env);
            case 'SwitchStatement':
                return this.visitSwitchStatement(node, env);
             // Add cases for other potential AST node types from your parser:
             // case 'ArrayExpression': ...
             // case 'ObjectExpression': ...
             // case 'ConditionalExpression': ... // (test ? consequent : alternate)

            default:
                 // Use stored line/column for error message
                 throw new Error(`[Ln ${currentNodeLine??'?'}, Col ${currentNodeColumn??'?'}] Ma fhmthach '${node.type}' type dyal node`);
        }
    }

     visitBlockStatement(node: ASTNode, env: Environment): any {
        const blockEnv = env.extend(); // Create a new scope for the block
        let lastResult: any = undefined;
        for (const statement of node.body ?? []) {
            lastResult = this.evaluate(statement, blockEnv);
            if (this.errorOccurred) return lastResult; // Propagate error signal
             // If a return happened inside the block, stop executing the block
            // (The ReturnValue signal will be caught higher up)
        }
        return lastResult; // Return the value of the last expression/statement if applicable
    }

     visitVariableDeclaration(node: ASTNode, env: Environment): any {
         const kind = node.kind!; // 'tabit' or 'bdl'
         const isConstant = kind === 'tabit';

         // Iterate through declarations (parser creates one VariableDeclaration with multiple declarators)
         for (const declarator of node.declarations ?? []) {
             if (!declarator.id || !declarator.id.name) {
                 throw new Error("Variable declaration khass smia.");
             }
             const name = declarator.id.name;

             let value = undefined; // Default value is 'mchmcha'
             if (declarator.initializer) {
                 value = this.evaluate(declarator.initializer, env);
                 if (this.errorOccurred) return value; // Propagate error
             }
             // Declare in the current environment
             env.declare(name, value, isConstant);
         }

         return undefined; // Variable declaration statement itself doesn't evaluate to a value
     }


      visitAssignmentExpression(node: ASTNode, env: Environment): any {
          const leftNode = node.left!;
          const value = this.evaluate(node.right!, env);
          if (this.errorOccurred) return value;

          if (leftNode.type === 'Identifier') {
              const name = leftNode.name!;
              // Assignment operators like +=, -= etc.
              const currentVal = env.lookup(name); // Get current value first
              let finalValue = value;
               switch (node.operator) {
                  case '=': break; // Simple assignment handled below
                  case '+=': finalValue = currentVal + value; break;
                  case '-=': finalValue = currentVal - value; break;
                  case '*=': finalValue = currentVal * value; break;
                  case '/=':
                      if (value === 0) throw new Error("9isma 3la zero mamno3a!");
                      finalValue = currentVal / value;
                      break;
                  case '%=':
                      if (value === 0) throw new Error("Modulus b zero mamno3!");
                      finalValue = currentVal % value;
                      break;
                  // Add other compound assignment operators if supported (e.g., &=, |=, <<= etc.)
                  default:
                      throw new Error(`Assignment operator ma fhamtouch: ${node.operator}`);
               }
              return env.assign(name, finalValue); // Assign the final value

          } else if (leftNode.type === 'MemberExpression') {
              // Assignment to property: obj.prop = value or arr[index] = value
              const obj = this.evaluate(leftNode.object!, env);
              if (this.errorOccurred) return obj;
               if (obj == null) { // Check for null or undefined object
                    throw new Error(`Ma ymknch t assigner l property dyal ${obj === null ? 'farkha' : 'mchmcha'}.`);
               }

              let propName: string | number;
              if (leftNode.computed) { // arr[index] = value
                  propName = this.evaluate(leftNode.property!, env);
                   if (this.errorOccurred) return propName;
              } else { // obj.prop = value
                  if (!leftNode.property || leftNode.property.type !== 'Identifier') {
                      throw new Error("Property assignment khass smia.");
                  }
                  propName = leftNode.property.name!;
                   // Map Darija property name if needed (e.g., obj.twil = 5, which might be invalid)
                  propName = BUILTIN_PROPERTIES[propName] || propName;
              }

               // Handle compound assignment for properties
               const currentVal = obj[propName];
               let finalValue = value;
                switch (node.operator) {
                    case '=': break;
                    case '+=': finalValue = currentVal + value; break;
                    case '-=': finalValue = currentVal - value; break;
                    case '*=': finalValue = currentVal * value; break;
                    case '/=':
                        if (value === 0) throw new Error("9isma 3la zero mamno3a!");
                        finalValue = currentVal / value;
                        break;
                    case '%=':
                         if (value === 0) throw new Error("Modulus b zero mamno3!");
                        finalValue = currentVal % value;
                        break;
                    default:
                        throw new Error(`Assignment operator ma fhamtouch: ${node.operator}`);
                }

               try {
                   obj[propName] = finalValue;
                   return finalValue; // Assignment expression evaluates to the assigned value
               } catch (error: any) {
                    throw new Error(`Maقدرتش n assigner l property "${String(propName)}" 3la ${typeof obj}: ${error.message}`);
               }
          } else {
               throw new Error("Assignment target ماشي valid.");
          }
      }

     visitBinaryExpression(node: ASTNode, env: Environment): any {
        const left = this.evaluate(node.left!, env);
        if (this.errorOccurred) return left;
        const right = this.evaluate(node.right!, env);
         if (this.errorOccurred) return right;

        switch (node.operator) {
            // Arithmetic
            case '+': return left + right; // Handles number addition and string concatenation
            case '-': return left - right;
            case '*': return left * right;
            case '/':
                 if (right === 0) throw new Error("9isma 3la zero mamno3a!");
                 return left / right;
            case '%':
                 if (right === 0) throw new Error("Modulus b zero mamno3!");
                 return left % right;

             // Comparison
            case '==': return left == right; // Abstract equality (type coercion)
            case '!=': return left != right;
            case '===': return left === right; // Strict equality (no type coercion)
            case '!==': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;

            // Bitwise & other operators (Add if supported by parser)
            // case '&': return left & right;
            // case '|': return left | right;
            // case '^': return left ^ right;
            // case '<<': return left << right;
            // case '>>': return left >> right;
            // case '>>>': return left >>> right;
            // case 'in': return left in right;
            // case 'instanceof': return left instanceof right;

            default: throw new Error(`Operator dial binary ma 3rftouch: ${node.operator}`);
        }
    }

    // Handle logical operators separately for short-circuiting
    visitLogicalExpression(node: ASTNode, env: Environment): any {
         const left = this.evaluate(node.left!, env);
         if (this.errorOccurred) return left;

         if (node.operator === '||') {
             return this.isTruthy(left) ? left : this.evaluate(node.right!, env);
         }
         if (node.operator === '&&') {
             return !this.isTruthy(left) ? left : this.evaluate(node.right!, env);
         }
         // Add other logical operators like nullish coalescing (??) if supported
          // case '??': return left ?? this.evaluate(node.right!, env);

         throw new Error(`Logical operator ma 3rftouch: ${node.operator}`);
    }


    visitUnaryExpression(node: ASTNode, env: Environment): any {
        const operand = this.evaluate(node.argument!, env);
         if (this.errorOccurred) return operand;

        switch (node.operator) {
            case '-': return -operand; // Numeric negation
            case '!': return !this.isTruthy(operand); // Logical negation
            case 'no3': return typeof operand; // Handle 'no3' for typeof
            case '+': return +operand; // Unary plus (converts to number)
            // Add other unary operators like ~, delete if needed
            // case '~': return ~operand; // Bitwise NOT
            // case 'delete': // More complex, involves environment manipulation
            default: throw new Error(`Operator dial unary ma 3rftouch: ${node.operator}`);
        }
    }

     visitUpdateExpression(node: ASTNode, env: Environment): any {
         // Handles both prefix (++x, --x) and postfix (x++, x--)
        const argNode = node.argument!;

        if (argNode.type === 'Identifier') {
            const varName = argNode.name!;
            let value = env.lookup(varName);
            if (typeof value !== 'number') {
                 throw new Error(`Operator "${node.operator}" khass ykoun m3a number.`);
            }
            const originalValue = value; // Store for postfix return

            if (node.operator === '++') {
                value++;
            } else if (node.operator === '--') {
                value--;
            } else {
                throw new Error(`Update operator ma 3rftouch: ${node.operator}`);
            }
            env.assign(varName, value); // Assign the updated value back

            return node.prefix ? value : originalValue; // Return new value for prefix, old for postfix

        } else if (argNode.type === 'MemberExpression') {
           // Handle updates like obj.prop++ or arr[index]++
           const obj = this.evaluate(argNode.object!, env);
           if (this.errorOccurred) return obj;
            if (obj == null) {
                 throw new Error(`Ma ymknch t update property dyal ${obj === null ? 'farkha' : 'mchmcha'}.`);
            }

            let propName: string | number;
            if (argNode.computed) {
                 propName = this.evaluate(argNode.property!, env);
                 if (this.errorOccurred) return propName;
            } else {
                 if (!argNode.property || argNode.property.type !== 'Identifier') {
                      throw new Error("Property update khass smia.");
                 }
                 propName = argNode.property.name!;
                 propName = BUILTIN_PROPERTIES[propName] || propName; // Map if necessary
            }


             let value = obj[propName];
             if (typeof value !== 'number') {
                 throw new Error(`Operator "${node.operator}" khass ykoun m3a number property.`);
             }
             const originalValue = value;

             if (node.operator === '++') {
                 value++;
             } else { // Must be --
                 value--;
             }

              try {
                  obj[propName] = value; // Update the property value
                  return node.prefix ? value : originalValue;
              } catch (error: any) {
                   throw new Error(`Maقدرتش n update property "${String(propName)}" 3la ${typeof obj}: ${error.message}`);
              }

        } else {
            throw new Error("Update expression khass ykoun 3la variable wla property.");
        }
    }


    visitCallExpression(node: ASTNode, env: Environment): any {
        const callee = this.evaluate(node.callee!, env);
        if (this.errorOccurred) return callee;

        const args = (node.arguments ?? []).map(arg => {
            const evaluatedArg = this.evaluate(arg, env);
            if (this.errorOccurred) throw new Error("Error evaluating argument"); // Stop mapping on error
            return evaluatedArg;
        });
         if (this.errorOccurred) return; // Check if error occurred during arg evaluation

         // Check if the callee is actually a function
         if (typeof callee !== 'function' && !(callee instanceof DarijaScriptFunction)) {
             // Get the name/representation of the callee for the error message
             let calleeName = 'expression';
             if (node.callee?.type === 'Identifier') calleeName = node.callee.name!;
             else if (node.callee?.type === 'MemberExpression') calleeName = 'property';
             throw new Error(`Dak lli bghiti tnadi "${calleeName}" ماشي dala.`);
         }


          // Handle DarijaScript function calls (closures)
         if (callee instanceof DarijaScriptFunction) {
             const callEnv = callee.closure.extend(); // Create new environment inheriting from function's closure

              // Check argument count
             if (callee.params.length !== args.length) {
                  // Allow variable arguments? Or enforce strict count?
                  throw new Error(`Dala "${callee.name || 'anonymous'}" katsnna ${callee.params.length} arguments, 3titih ${args.length}.`);
             }
              // Declare arguments in the new environment
             callee.params.forEach((param, index) => {
                  if (!param.name) throw new Error("Parameter khass smia.");
                  // Arguments are mutable within the function unless declared 'tabit' (not typical for params)
                  callEnv.declare(param.name, args[index], false);
             });

              // Set 'hadi' (this) for the function call - complex topic!
              // For simple functions, 'this' might be global or undefined.
              // For methods, it should be the object. This needs context from MemberExpression.
              // Simplification: Pass global 'this' for now.
              callEnv.declare('hadi', this.globalEnv.lookup('hadi'), false); // Inherit global 'this'


              // Execute function body in its own environment
              try {
                 this.evaluate(callee.body, callEnv);
                  // If the function completes without a 'rj3', it implicitly returns 'mchmcha' (undefined)
                 return undefined;
              } catch (e) {
                  if (e instanceof ReturnValue) {
                      return e.value; // Caught a 'rj3' statement
                  } else {
                      throw e; // Re-throw other errors or control signals (break/continue should not escape function)
                  }
              }
          } else {
               // Handle native JS function calls (already wrapped in the environment)
               // Determine 'this' context for native calls (e.g., method calls)
               let thisContext = undefined;
               if (node.callee?.type === 'MemberExpression') {
                    // If it's obj.method(), 'this' should be obj
                    const obj = this.evaluate(node.callee.object!, env);
                    if (this.errorOccurred) return obj;
                    thisContext = obj;

                    // Handle mapped Darija method names
                     if (node.callee.property?.type === 'Identifier') {
                         const methodNameDarija = node.callee.property.name!;
                         const methodNameJs = this.mapDarijaMethodToJs(methodNameDarija);
                         if (methodNameJs && typeof obj[methodNameJs] === 'function') {
                             // Call the mapped JS method
                              try {
                                 return obj[methodNameJs](...args);
                              } catch (error: any) {
                                 throw new Error(`Ghalat mli kan nadi l method "${methodNameDarija}" (JS: ${methodNameJs}): ${error.message}`);
                              }
                         } else if (methodNameJs) {
                             throw new Error(`Method "${methodNameDarija}" (JS: ${methodNameJs}) ma l9inahahch f ${typeof obj}.`);
                         }
                         // If not a mapped method, fall through to call the original callee
                     }
               } else {
                    // Global function call (e.g., tbe3()), 'this' is usually global object or undefined
                    thisContext = this.globalEnv.lookup('hadi'); // Use the global 'this'
               }


               try {
                    // The 'callee' here is the wrapper we created in the constructor
                    return callee.apply(thisContext, args);
               } catch (error: any) {
                    // Errors from native calls should be caught by the wrapper,
                    // but catch here just in case.
                    let funcName = node.callee?.type === 'Identifier' ? node.callee.name : 'native function';
                    throw new Error(`Ghalat mli kan nadi native function "${funcName}": ${error.message}`);
               }
          }
    }

      visitFunctionDeclaration(node: ASTNode, env: Environment): any {
        if (!node.id || !node.id.name) {
            throw new Error("Function declaration khass smia.");
        }
        const funcName = node.id.name;
        const params = node.params ?? [];
        const body = node.body!; // Expecting BlockStatement from parser

        // Create a closure: capture the current environment
        const closure = env;
        const dsFunction = new DarijaScriptFunction(funcName, params, body, closure);

        env.declare(funcName, dsFunction, false); // Declare function in the current environment (functions are not const by default)
        return undefined; // Declaration itself doesn't evaluate to a value
    }

     // Handle anonymous function expressions e.g., bdl x = dala() { ... }
     visitFunctionExpression(node: ASTNode, env: Environment): DarijaScriptFunction {
         const funcName = node.id?.name || null; // Optional name for function expression
         const params = node.params ?? [];
         const body = node.body!;
         const closure = env; // Capture the current environment

         return new DarijaScriptFunction(funcName, params, body, closure);
     }

     visitIfStatement(node: ASTNode, env: Environment): any {
        const test = this.evaluate(node.test!, env);
        if (this.errorOccurred) return test;

        if (this.isTruthy(test)) {
            // Execute the consequent block/statement
            return this.evaluate(node.consequent!, env);
        } else if (node.alternate) {
             // Execute the alternate block/statement (else or else if)
            return this.evaluate(node.alternate, env);
        }
        // No else branch, statement evaluates to undefined
        return undefined;
    }

      visitWhileStatement(node: ASTNode, env: Environment): any {
        let lastResult: any = undefined;
        while (this.isTruthy(this.evaluate(node.test!, env))) {
             if (this.errorOccurred) return; // Check error after evaluating test
             try {
                // Execute the loop body
                lastResult = this.evaluate(node.body!, env);
                if (this.errorOccurred) return lastResult; // Check error after executing body
             } catch (e) {
                 if (e instanceof BreakSignal) {
                     break; // Exit the while loop
                 } else if (e instanceof ContinueSignal) {
                      continue; // Skip to the next iteration's test
                 } else {
                      throw e; // Re-throw ReturnValue or other errors
                 }
             }
        }
        // While loop statement evaluates to undefined
        return undefined;
    }

     visitDoWhileStatement(node: ASTNode, env: Environment): any {
        let lastResult: any = undefined;
        do {
             try {
                // Execute the loop body at least once
                lastResult = this.evaluate(node.body!, env);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) {
                     break; // Exit the loop
                 } else if (e instanceof ContinueSignal) {
                     // In do-while, continue goes straight to the test
                     // So, just let the loop condition check happen
                 } else {
                     throw e; // Re-throw ReturnValue or other errors
                 }
             }
            // Evaluate the test condition after the body
             const testResult = this.evaluate(node.test!, env);
             if (this.errorOccurred) return testResult;
             if (!this.isTruthy(testResult)) {
                 break; // Exit if condition is false
             }
        } while (true); // Loop controlled by break and condition check

         // Do-while loop statement evaluates to undefined
        return undefined;
    }

     visitForStatement(node: ASTNode, env: Environment): any {
        // For loop involves its own scope for variables declared in init
        const forEnv = env.extend();
        let lastResult: any = undefined;

         // 1. Initializer
        if (node.init) {
            this.evaluate(node.init, forEnv);
            if (this.errorOccurred) return;
        }

         // 2. Loop condition check (before first iteration and each subsequent)
        while (!node.test || this.isTruthy(this.evaluate(node.test, forEnv))) {
             if (this.errorOccurred) return; // Check after test evaluation

            // 3. Execute loop body
             try {
                lastResult = this.evaluate(node.body!, forEnv);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) {
                     break; // Exit the for loop
                 } else if (e instanceof ContinueSignal) {
                      // Fall through to the update step before next iteration
                 } else {
                      throw e; // Re-throw ReturnValue or other errors
                 }
             }

             // 4. Update expression (after body, before next condition check)
              if (node.update) {
                 this.evaluate(node.update, forEnv);
                 if (this.errorOccurred) return;
             }
             // Continue signal effectively jumps here (after body, before update)
        }

         // For loop statement evaluates to undefined
        return undefined;
    }

     visitTryStatement(node: ASTNode, env: Environment): any {
        let result: any;
        try {
            // Execute the 'try' block
            result = this.evaluate(node.block!, env);
             if (this.errorOccurred) return result; // Propagate error if it happened in try block

        } catch (error: any) {
            // Check if it's a signal we shouldn't catch here (should propagate)
            if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
                // These should only be caught by functions/loops/switches, not try/catch
                // However, if a finally block exists, it must run first.
                 if (node.finalizer) {
                     try {
                        this.evaluate(node.finalizer, env);
                        // Ignore errors in finally for now, or handle them? JS throws error from finally.
                     } catch (finallyError: any) {
                          // Error in finally overrides the original signal/error
                          throw finallyError;
                     }
                 }
                throw error; // Re-throw the original control signal
            }

             // It's a runtime error, check for a 'catch' handler
            if (node.handler) { // If there's a catch block ('msk')
                const catchEnv = env.extend(); // New scope for the catch block

                 // Declare the error variable in the catch block's scope
                 if (node.handler.param && node.handler.param.name) {
                    catchEnv.declare(node.handler.param.name, error, false); // Error object is mutable
                 } else {
                     // Catch block without a parameter, error is not accessible by name
                 }
                  // Execute the catch block
                 try {
                    result = this.evaluate(node.handler.body!, catchEnv);
                     // If catch block itself throws or returns, that's the new result
                 } catch(catchError: any) {
                      // If catch throws, check finally before propagating catchError
                       if (node.finalizer) {
                           try {
                                this.evaluate(node.finalizer, env);
                           } catch (finallyError: any) {
                                throw finallyError; // Error in finally overrides catch error
                           }
                       }
                       throw catchError; // Propagate the error from catch
                 }

            } else {
                 // No catch handler, the error will be re-thrown after finally (if any)
                 // We handle this implicitly by letting the flow reach finally block execution
                 // and then the error propagates if not handled by finally.
                  if (!node.finalizer) {
                       throw error; // Re-throw immediately if no catch and no finally
                  }
            }
        } finally {
            // Execute the 'finally' block if it exists
            // This runs regardless of whether an error occurred or was caught,
            // or if a return/break/continue happened in try or catch.
            if (node.finalizer) {
                 // If finally throws an error or returns, it overrides any previous state.
                 try {
                      const finallyResult = this.evaluate(node.finalizer, env);
                      // JS normally discards finally's return value unless it throws.
                      // If 'finally' completes normally, the original throw/return/signal continues.
                      // Let's stick to throwing errors from finally overrides others.
                      // If finally returns, should that override? Let's say no for now.
                 } catch (finallyError: any) {
                       throw finallyError; // Throw error from finally, overriding any prior error/signal
                 }
            }
        }
         // If try/catch completed without exceptions/returns propagating out, return the result
         // (usually the result of the try block or the catch block if it ran)
        return result;
     }

     visitMemberExpression(node: ASTNode, env: Environment): any {
         // Handles obj.prop and obj[prop]
        const obj = this.evaluate(node.object!, env);
        if (this.errorOccurred) return obj;

         if (obj == null) { // Check for null or undefined
            // Special case: Allow .twil on null/undefined string representations? Or error. Error is safer.
            throw new Error(`Ma ymknch tqra property mn ${obj === null ? 'farkha' : 'mchmcha'}.`);
        }

        let propName: string | number | symbol; // Property can be string, number, or symbol

        if (node.computed) { // Computed property access: obj[expression]
             propName = this.evaluate(node.property!, env);
             if (this.errorOccurred) return propName;
        } else { // Static property access: obj.identifier
            if (!node.property || node.property.type !== 'Identifier') {
                 throw new Error("Member access khass ykoun smia.");
            }
            propName = node.property.name!;

            // Map Darija property name (like 'twil') to JS name ('length') if applicable
             const mappedProp = BUILTIN_PROPERTIES[propName];
             if (mappedProp) {
                  // Directly return the JS property value if mapped
                 try {
                    return obj[mappedProp];
                 } catch (error: any) {
                    throw new Error(`Ghalat mli kan qra property "${propName}" (JS: ${mappedProp}) mn ${typeof obj}: ${error.message}`);
                 }
             }
             // If not mapped, use the original name (propName)
        }

         try {
            const value = obj[propName];

            // Special handling for accessing methods as properties:
            // If the accessed property is a function, and it's a method of the object,
            // we need to return it bound to the object so 'this' works correctly
            // when it's eventually called by CallExpression.
            if (typeof value === 'function') {
                 // Check if it's a method that we need to bind 'this' for
                 // Native JS methods are usually bound automatically or handled by `apply`/`call`.
                 // Let's bind it to be safe, though CallExpression's logic might handle it too.
                 return value.bind(obj);
            }

            return value; // Return non-function properties directly
         } catch (error: any) {
              // Handle errors during property access (e.g., on non-objects)
              // The obj == null check above handles most cases, but proxies or getters could throw.
             throw new Error(`Ghalat mli kan qra property "${String(propName)}" mn ${typeof obj}: ${error.message}`);
         }
     }

       visitNewExpression(node: ASTNode, env: Environment): any {
           // Handles 'jdid Constructor(...args)'
        const callee = this.evaluate(node.callee!, env);
        if (this.errorOccurred) return callee;

        const args = (node.arguments ?? []).map(arg => {
             const evalArg = this.evaluate(arg, env);
             if (this.errorOccurred) throw new Error("Error evaluating constructor argument");
             return evalArg;
        });
         if (this.errorOccurred) return;

        // Check if the callee is a constructor (a function)
        if (typeof callee !== 'function') {
            let calleeName = 'expression';
             if (node.callee?.type === 'Identifier') calleeName = node.callee.name!;
            throw new Error(`Dak lli bghiti dir lih 'jdid' ("${calleeName}") ماشي constructor.`);
        }

         // Check if it's a DarijaScript function - are they constructible?
         // Standard JS functions created with 'function' are constructible.
         // Arrow functions are not. Assume DarijaScript 'dala' are like standard functions.
         if (callee instanceof DarijaScriptFunction) {
             // How to handle `new DarijaScriptFunction()`?
             // Requires defining prototype chains, etc. Complex.
             // For now, maybe disallow 'jdid' with user-defined functions unless specifically designed.
             throw new Error(`Ma ymknch tsta3ml 'jdid' m3a dala dyal DarijaScript "${callee.name || 'anonymous'}" (mazal mam suprtatch).`);
         }

         // Assume it's a native JS constructor (like Date, or others if available)
         try {
             return new (callee as any)(...args);
         } catch (error: any) {
              let constructorName = node.callee?.type === 'Identifier' ? node.callee.name : 'constructor';
             throw new Error(`Ghalat mli kan dir 'jdid ${constructorName}': ${error.message}`);
         }
    }

    visitSwitchStatement(node: ASTNode, env: Environment): any {
        const discriminant = this.evaluate(node.discriminant!, env);
        if (this.errorOccurred) return discriminant;

        const switchEnv = env.extend(); // Scope for the switch block (though JS switch doesn't have block scope per case)
        let matched = false;
        let fallThrough = false; // Track if we are falling through cases
        let defaultCaseHandler: ASTNode | null = null;
        let blockResult: any = undefined; // Result of the executed block

        // Find the default case first
        for (const caseNode of node.cases ?? []) {
            if (!caseNode.test) {
                defaultCaseHandler = caseNode;
                break;
            }
        }

        try {
            for (const caseNode of node.cases ?? []) {
                 if (this.errorOccurred) break; // Stop processing cases on error

                let isMatch = false;
                if (caseNode.test) { // This is a 'case' clause
                    if (!matched || fallThrough) { // Only evaluate if no prior match or falling through
                        const caseValue = this.evaluate(caseNode.test, switchEnv); // Evaluate case expression
                        if (this.errorOccurred) break;
                        // Use strict equality (===) for case comparison, like JS switch
                        if (discriminant === caseValue) {
                            isMatch = true;
                            matched = true; // Mark that we found a match
                            fallThrough = true; // Start falling through from this point
                        }
                    }
                } else {
                    // Default case logic is handled after the loop if needed
                     continue;
                }

                // Execute consequent statements if it's a match or we are falling through
                if (isMatch || fallThrough) {
                    for (const stmt of caseNode.consequent ?? []) {
                        blockResult = this.evaluate(stmt, switchEnv); // Evaluate statement in the case
                        if (this.errorOccurred) throw new Error("Error in switch case"); // Trigger catch below
                        // ReturnValue should propagate out immediately via throw
                    }
                     // JS switch fall-through happens unless explicitly broken.
                     // BreakSignal is caught below.
                }
            } // End loop through cases

            // Execute default case if no match was found, or if fall-through reached the end without a break
            if (defaultCaseHandler && (!matched || fallThrough)) {
                 for (const stmt of defaultCaseHandler.consequent ?? []) {
                     blockResult = this.evaluate(stmt, switchEnv);
                     if (this.errorOccurred) throw new Error("Error in default switch case");
                     // ReturnValue propagates via throw
                 }
            }

        } catch (e) {
             if (e instanceof BreakSignal) {
                 // 'wa9f' was encountered, exit the switch statement normally
             } else if (e instanceof ContinueSignal) {
                 // 'kamml' inside a switch is generally an error or behaves like break.
                 // Let's treat it like break for simplicity.
             } else {
                 throw e; // Re-throw ReturnValue or other runtime errors
             }
         }

        // Switch statement itself evaluates to undefined unless a contained return happens
        return undefined;
    }


    // --- Helper Methods ---

    // Defines truthiness according to JavaScript rules
    isTruthy(value: any): boolean {
        // Everything is truthy except: false, 0, -0, 0n, "", null, undefined, NaN
        return !(!value || value === 0 || (typeof value === 'bigint' && value === 0n) || value === "" || value === null || value === undefined || Number.isNaN(value));
    }

    // Formats values for display in the output array
    formatValueForOutput(value: any): string {
        if (value === undefined) {
            return 'mchmcha';
        } else if (value === null) {
            return 'farkha';
        } else if (typeof value === 'string') {
            return value; // Keep strings as they are (maybe quote them?)
            // return `"${value}"`; // Option: quote strings
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        } else if (typeof value === 'function') {
             if (value instanceof DarijaScriptFunction) {
                return `[Dala: ${value.name || 'anonymous'}]`;
             } else {
                // Attempt to get native function name, fallback otherwise
                return `[Dala Native: ${value.name || 'anonymous'}]`;
             }
        } else if (typeof value === 'object') {
            // Basic handling for arrays and objects
            if (Array.isArray(value)) {
                // Recursively format array elements? Limit depth?
                 return `[${value.map(v => this.formatValueForOutput(v)).join(', ')}]`;
            } else {
                // Simple object representation, avoid circular issues
                 try {
                    // Be careful with JSON.stringify for complex objects (functions, Symbols, circular refs)
                     const cache = new Set();
                     return JSON.stringify(value, (key, value) => {
                         if (typeof value === 'object' && value !== null) {
                             if (cache.has(value)) {
                                 // Circular reference found, discard key
                                 return '[Circular]';
                             }
                             // Store value in our collection
                             cache.add(value);
                         }
                         if (typeof value === 'function') {
                            return '[Function]'; // Represent functions
                         }
                         return value;
                     }, 2); // Pretty print object
                 } catch {
                     return '[Object]'; // Fallback
                 }
            }
        } else if (typeof value === 'symbol') {
             return String(value);
        } else if (typeof value === 'bigint') {
             return `${value}n`;
        }
        // Fallback for unexpected types
        return typeof value;
    }

     // Maps DarijaScript method names to their JavaScript counterparts
     // This is used during MemberExpression evaluation for method calls.
    mapDarijaMethodToJs(darijaMethod: string): string | null {
        const map: { [key: string]: string } = {
             'kbr7rf': 'toUpperCase',
             'sghr7rf': 'toLowerCase',
             'kayn': 'includes', // String/Array includes
             'zid': 'push',     // Array push
             '7yed': 'pop',      // Array pop
             '7yedmnlwla': 'shift',   // Array shift
             'zidfllwla': 'unshift', // Array unshift
             'dwr': 'map',       // Array map
             'n9i': 'filter',    // Array filter
             'lfech': 'forEach', // Array forEach
             'l9a': 'find',      // Array find
             'lmmaj': 'reduce',  // Array reduce
             // Object methods are static, handled differently in CallExpression typically
             'mfatih': 'keys', // Special handling needed (Object.keys)
             'qiyam': 'values', // Special handling needed (Object.values)
             '3am': 'getFullYear', // Date method
             'chhr': 'getMonth',   // Date method
             'nhar': 'getDate'    // Date method
             // Add other mappings here as needed
        };
        return map[darijaMethod] || null; // Return JS name or null if not found
    }

}


// --- Main interpret function (Entry Point) ---

export function interpret(code: string): { output: string[], error?: string } {
  let interpreter: Interpreter | null = null; // Define interpreter here to access its output in catch
  try {
    // 1. Tokenize
    const tokens = tokenize(code);
    // Check for tokenizer errors
    const tokenizerError = tokens.find(t => t.type === 'ERROR');
    if (tokenizerError) {
        console.error("Tokenizer Error:", tokenizerError.value);
        return { output: [], error: `Ghalat f Tokenizer: ${tokenizerError.value}` };
    }
    // console.log("Tokens:", tokens); // Optional: Log tokens

    // 2. Parse using the imported parse function
    const ast = parseCode(tokens); // Use imported parse function
     // Check for parser errors
    if (ast.error) {
         console.error("Parser Error:", ast.error);
         return { output: [], error: `Ghalat f Parser: ${ast.error}` };
    }
    // console.log("AST:", JSON.stringify(ast, null, 2)); // Optional: Log AST


    // 3. Interpret
    interpreter = new Interpreter(ast);
    const result = interpreter.interpret(); // Start interpretation


    // Check if the final result indicates a runtime error occurred during interpretation
    if (interpreter.errorOccurred) {
      // Error message is already expected to be in interpreter.output
      const lastOutput = interpreter.output[interpreter.output.length - 1] || "Runtime ghalat.";
      // Ensure the error message starts with "Ghalat:"
      const errorMessage = lastOutput.startsWith('Ghalat:') ? lastOutput : `Ghalat: ${lastOutput}`;
      return { output: interpreter.output, error: errorMessage };
    }

    // Optional: Add the final evaluated result of the program to the output,
    // but typically IDEs only show explicit prints.
    // if (result !== undefined) {
    //   interpreter.output.push(interpreter.formatValueForOutput(result));
    // }

    return { output: interpreter.output }; // Return accumulated output

  } catch (e: any) {
    // Catch unexpected errors during the whole process (tokenizer, parser, interpreter setup)
    console.error("Interpreter System Error:", e);
    const errorMessage = (e && typeof e.message === 'string') ? e.message : 'Erreur inconnue lors de l\'interprétation.';
    // If interpreter exists, add error to its output, otherwise return new output array
     const output = interpreter ? interpreter.output : [];
     if (interpreter && !interpreter.errorOccurred) { // Avoid duplicate error messages if runtime error was already handled
        output.push(`Ghalat System: ${errorMessage}`);
     } else if (!interpreter) {
         output.push(`Ghalat System: ${errorMessage}`);
     }
    return { output: output, error: `Ghalat System: ${errorMessage}` };
  }
}

