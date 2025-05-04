

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
  '7ala', // case <-- Starts with number - Needs special handling
  '3adi', // default <-- Starts with number - Needs special handling
  'mnin', // from (for...of/in) -> Keep? Not standard JS 'for' structure
  'hta', // until/to (for loops) -> Keep? Not standard JS 'for' structure
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

// Values that can't be used as identifiers because they start with numbers
// but are used in the language (e.g., as property names or function names).
const NUMBER_STARTING_IDENTIFIERS = [
    '7yed', '7yedmnlwla', '3am', '7ala', '3adi' // Add others if needed
];

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
  // --- Static Object/Array methods ---
  // These need special handling in the interpreter, as they are called on the Object/Array constructor
  'mfatih': (obj: object) => Object.keys(obj), // Object.keys()
  'qiyam': (obj: object) => Object.values(obj), // Object.values()
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
  '7yed', // pop (starts with number)
  '7yedmnlwla', // shift (starts with number)
  'zidfllwla', // unshift
  'dwr', // map
  'n9i', // filter
  'lfech', // forEach
  'l9a', // find
  'lmmaj', // reduce
  '3am', // getFullYear (starts with number)
  'chhr', // getMonth
  'nhar' // getDate
];


const OPERATORS = ['+', '-', '*', '/', '%', '=', '==', '!=', '===', '!==', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-=', '*=', '/=', '%='];
const PUNCTUATION = ['(', ')', '{', '}', '[', ']', ';', ',', '.', ':']; // Added '[' and ']'

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
      continue;
    }
    if (char === '/' && code[cursor + 1] === '*') {
      cursor += 2; column += 2;
      while (cursor < code.length && !(code[cursor] === '*' && code[cursor + 1] === '/')) {
        if (code[cursor] === '\n') {
          line++; column = 0;
        } else {
          column++;
        }
        cursor++;
      }
      if (cursor < code.length) {
        cursor += 2; column += 2;
      } else {
           tokens.push({ type: 'ERROR', value: `Commentaire block ma msdoudch`, line, column: startColumn });
           break;
      }
      continue;
    }

     // Check for number-starting identifiers used as methods/functions/keywords
     let matchedNumIdentifier = false;
     for (const numIdent of NUMBER_STARTING_IDENTIFIERS) {
         // Use a regex that ensures the identifier is not part of a larger word
         // Include check for '(' after method name to avoid matching variables like '7yedhia'
         const regex = new RegExp(`^${numIdent}(?![a-zA-Z0-9_])`);
         const match = code.substring(cursor).match(regex);
          if (match) {
            const followingChar = code[cursor + numIdent.length];
             // Treat as identifier if followed by '.' or '(', likely a method/function call
             // Treat '7ala' and '3adi' as keywords
              if (numIdent === '7ala' || numIdent === '3adi') {
                  tokens.push({ type: 'KEYWORD', value: numIdent, line, column: startColumn });
              } else {
                 tokens.push({ type: 'IDENTIFIER', value: numIdent, line, column: startColumn });
              }
             cursor += numIdent.length;
             column += numIdent.length;
             matchedNumIdentifier = true;
             break;
         }
     }
     if (matchedNumIdentifier) continue;


    // Identifiers, keywords (starting with letter/underscore), remaining built-ins, booleans
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
         tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn }); // Treat as identifier
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn });
      }
      continue;
    }

    // Numbers (integer and float) - This comes *after* checking keywords/identifiers like 7ala, 3adi, 7yed
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
        if (!hasDecimal && code[cursor] === '.') {
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
        }
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
                 tokens.push({ type: 'ERROR', value: `Format dyal exponent machi s7i7 f Raqam`, line, column: startColumn });
                 break;
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
            break;
      }
      continue;
    }

    // Strings (double and single quotes)
    if (char === '"' || char === "'") {
      const quoteType = char;
      let str = '';
      cursor++; column++;
      while (cursor < code.length && code[cursor] !== quoteType) {
          let currentChar = code[cursor];
          if (currentChar === '\\') {
             cursor++; column++;
             if (cursor >= code.length) {
                 tokens.push({ type: 'ERROR', value: `Chaine de caractères pas fermée après l'échappement`, line, column: startColumn });
                 str = '';
                 break;
             }
             let escapedChar = code[cursor];
              switch (escapedChar) {
                  case 'n': str += '\n'; break; case 't': str += '\t'; break; case 'r': str += '\r'; break;
                  case 'b': str += '\b'; break; case 'f': str += '\f'; break; case '\\': str += '\\'; break;
                  case '"': str += '"'; break; case "'": str += "'"; break;
                  default: str += '\\' + escapedChar;
              }
          } else if (currentChar === '\n') {
             tokens.push({ type: 'ERROR', value: `Chaine de caractères ne peut pas contenir de nouvelle ligne.`, line, column: startColumn });
             str = '';
             break;
          } else {
            str += currentChar;
          }
          cursor++; column++;
      }
       if (str === '' && tokens[tokens.length-1]?.type === 'ERROR') {
            break;
       }
      if (cursor >= code.length || code[cursor] !== quoteType) {
         tokens.push({ type: 'ERROR', value: `Chaine de caractères pas fermée. Kan khass ${quoteType}`, line, column: startColumn });
         break;
      }
      cursor++; column++;
      tokens.push({ type: 'STRING', value: str, line, column: startColumn });
      continue;
    }

    // Operators and Punctuation
    let operatorFound = false;
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
        // Allow re-declaration of 'hadi' within functions/scopes if necessary?
        // Current behavior prevents it, which might be okay.
        if (this.vars.has(name) && Object.prototype.hasOwnProperty.call(this.vars, name)) {
            throw new Error(`Variable "${name}" déjà déclarée f had l scope.`);
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
             // Look for built-in JS objects/functions if not found in DarijaScript env
            if (typeof window !== 'undefined' && name in window) {
                 return (window as any)[name]; // e.g., Math, Object, Array
            }
            if (typeof global !== 'undefined' && name in global) {
                  return (global as any)[name];
            }
            throw new Error(`Variable "${name}" ma declaritch.`);
        }
        if (!env.vars.has(name)) {
            // This condition should theoretically not be met if resolve worked,
            // but keep as a safeguard.
             throw new Error(`Internal Error: Variable "${name}" not found in resolved environment.`);
        }
        return env.vars.get(name);
    }

    resolve(name: string): Environment | null {
        if (this.vars.has(name)) {
            return this;
        }
        if (this.parent) {
            return this.parent.resolve(name);
        }
        return null;
    }

    extend(): Environment {
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

class BreakSignal {}
class ContinueSignal {}

class DarijaScriptFunction {
    name: string | null;
    params: ASTNode[];
    body: ASTNode;
    closure: Environment;

    constructor(name: string | null, params: ASTNode[], body: ASTNode, closure: Environment) {
        this.name = name;
        this.params = params;
        this.body = body;
        this.closure = closure;
    }

    // Allows `instanceof DarijaScriptFunction` checks to work correctly
    get [Symbol.toStringTag]() {
        return 'Function';
    }
}


class Interpreter {
    ast: ASTNode;
    globalEnv: Environment;
    output: string[] = [];
    errorOccurred: boolean = false;

    constructor(ast: ASTNode) {
        this.ast = ast;
        this.globalEnv = new Environment();
        this.errorOccurred = false;

        // Inject built-in functions
        for (const name in BUILTIN_FUNCTIONS) {
            const nativeFunc = BUILTIN_FUNCTIONS[name];
            this.globalEnv.declare(name, (...args: any[]) => {
                try {
                     if (name === 'rmmi') {
                         throw args[0];
                     }
                     if (['tbe3', 'ghlat', 'nbehh'].includes(name)) {
                         const formattedArgs = args.map(arg => this.formatValueForOutput(arg)).join(' ');
                         this.output.push(formattedArgs);
                         // For Object.keys/values, call the native func directly
                         if (['mfatih', 'qiyam'].includes(name)) {
                              return nativeFunc.apply(Object, args); // Apply on Object
                         }
                         // If the target object (e.g., console) has the method, apply it there.
                         if (typeof console !== 'undefined' && name in console) {
                           return (console as any)[name](...args);
                         }
                         // Fallback: call the function globally (less likely for these specific ones)
                         return nativeFunc.apply(null, args);
                     }
                     // For Math, Date static methods, apply on null/global context
                     if (['t7t', 'fo9', 'dour', 'tsarraf', 'kbar', 'sghar', 'mnfi', 'rf3', 'jdr', 'daba'].includes(name)) {
                         return nativeFunc.apply(null, args);
                     }
                      // For constructors like Date or String conversion
                     if (['ns', 'wa9t'].includes(name)) {
                          if (name === 'wa9t') return new Date(...args);
                          if (name === 'ns') return String(args[0]);
                     }
                     // For timers, apply globally
                      if (['sta9', 'krr'].includes(name)) {
                         return nativeFunc.apply(null, args); // Or window/globalThis if needed
                     }
                     // Default fallback (should ideally cover all cases above)
                     return nativeFunc.apply(undefined, args);
                } catch (error: any) {
                    // Append line/col info if possible
                    const currentLocation = this.getCurrentLocationInfo();
                    throw new Error(`Ghalat f dlla "${name}"${currentLocation}: ${error.message}`);
                }
            }, true);
        }

        // Inject language constants
        this.globalEnv.declare('mchmcha', undefined, true);
        this.globalEnv.declare('farkha', null, true);
        // Declare 'hadi' (this) in the global scope. Its value might change in functions.
        // Initialize with window/global or undefined based on environment.
        this.globalEnv.declare('hadi', typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : undefined), true);
    }

    // Helper to get location info (potentially track current node)
    // This is a placeholder - needs actual implementation if needed
    getCurrentLocationInfo(): string {
         // Add logic to track the current node being evaluated if possible
         // return ` [Ln ?, Col ?]`;
         return '';
    }

    interpret(node: ASTNode = this.ast, env: Environment = this.globalEnv): any {
         if (this.errorOccurred) return { error: "Execution stopped due to previous error." };

        try {
           return this.evaluate(node, env);
        } catch (error: any) {
            if (this.errorOccurred) return;
             if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
                throw error; // These are control flow signals, not runtime errors
             }
            this.errorOccurred = true;
            const errorNode = node; // Or potentially track a more specific node if possible
            const errorMessage = `Runtime Ghalat [Ln ${errorNode.line ?? '?'}, Col ${errorNode.column ?? '?'}]: ${error.message || error}`;
            this.output.push(`Ghalat: ${errorMessage}`);
            console.error("Interpreter Runtime Error:", errorMessage, error);
            return { error: errorMessage }; // Return an error object for the caller
        }
    }

    evaluate(node: ASTNode, env: Environment): any {
        if (this.errorOccurred) return;
        const currentNodeLine = node.line;
        const currentNodeColumn = node.column;

        switch (node.type) {
            case 'Program':
                let lastVal: any = undefined;
                for (const stmt of node.body ?? []) {
                    lastVal = this.evaluate(stmt, env);
                    if (this.errorOccurred) return lastVal; // Propagate error object
                    if (lastVal !== undefined && lastVal !== null && !(lastVal instanceof Object && Object.keys(lastVal).length === 0 && lastVal.error)) {
                        // Optionally capture the value of the last expression statement if needed
                        // Currently, only the side effects (like 'tbe3') are relevant from top-level statements.
                    }
                }
                // The final result of a program is typically undefined unless the last statement was a return (not valid at top level)
                // or an expression statement whose value we want to return (like in a REPL).
                // For now, return undefined for Program execution.
                return undefined;


            case 'ExpressionStatement':
                return this.evaluate(node.expression!, env);
            case 'VariableDeclaration':
                return this.visitVariableDeclaration(node, env);
            case 'AssignmentExpression':
                return this.visitAssignmentExpression(node, env);
            case 'BinaryExpression':
                return this.visitBinaryExpression(node, env);
            case 'UnaryExpression':
                return this.visitUnaryExpression(node, env);
             case 'UpdateExpression':
                return this.visitUpdateExpression(node, env);
             case 'LogicalExpression':
                return this.visitLogicalExpression(node, env);
            case 'Identifier':
                return env.lookup(node.name!);
            case 'NumericLiteral': return node.value;
            case 'StringLiteral': return node.value;
            case 'BooleanLiteral': return node.value;
             case 'NullLiteral': return null;
             case 'UndefinedLiteral': return undefined;
             case 'ThisExpression': return env.lookup('hadi');
            case 'CallExpression':
                return this.visitCallExpression(node, env);
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration(node, env);
             case 'FunctionExpression':
                return this.visitFunctionExpression(node, env);
            case 'ReturnStatement':
                throw new ReturnValue(node.argument ? this.evaluate(node.argument, env) : undefined);
            case 'IfStatement':
                 return this.visitIfStatement(node, env);
            case 'BlockStatement':
                 return this.visitBlockStatement(node, env);
            case 'WhileStatement':
                return this.visitWhileStatement(node, env);
            case 'DoWhileStatement':
                return this.visitDoWhileStatement(node, env);
            case 'ForStatement':
                return this.visitForStatement(node, env);
            case 'BreakStatement':
                throw new BreakSignal();
            case 'ContinueStatement':
                throw new ContinueSignal();
            case 'TryStatement':
                return this.visitTryStatement(node, env);
            case 'MemberExpression':
                return this.visitMemberExpression(node, env);
             case 'NewExpression':
                return this.visitNewExpression(node, env);
            case 'SwitchStatement':
                return this.visitSwitchStatement(node, env);
            case 'ArrayExpression':
                return this.visitArrayExpression(node, env);
            case 'ObjectExpression':
                 return this.visitObjectExpression(node, env);
             // Add cases for other potential AST node types:
             // case 'ConditionalExpression': ...

            default:
                 throw new Error(`[Ln ${currentNodeLine??'?'}, Col ${currentNodeColumn??'?'}] Ma fhmthach '${node.type}' type dyal node`);
        }
    }

     visitBlockStatement(node: ASTNode, env: Environment): any {
        const blockEnv = env.extend();
        let lastResult: any = undefined;
        for (const statement of node.body ?? []) {
            lastResult = this.evaluate(statement, blockEnv);
            if (this.errorOccurred) return lastResult;
        }
        // A block statement itself evaluates to the value of the last statement executed,
        // but often its return value is ignored unless it's the body of a function without explicit return.
        return lastResult;
    }

     visitVariableDeclaration(node: ASTNode, env: Environment): any {
         const kind = node.kind!;
         const isConstant = kind === 'tabit';
         for (const declarator of node.declarations ?? []) {
             if (!declarator.id || !declarator.id.name) {
                 throw new Error("Variable declaration khass smia.");
             }
             const name = declarator.id.name;
              let value: any = undefined; // Initialize with undefined, like JS
             if (declarator.initializer) {
                 value = this.evaluate(declarator.initializer, env);
                 if (this.errorOccurred) return value; // Propagate error object
             }
             env.declare(name, value, isConstant);
         }
         return undefined; // Variable declaration statement itself returns undefined
     }

      visitAssignmentExpression(node: ASTNode, env: Environment): any {
          const leftNode = node.left!;
          const rightValue = this.evaluate(node.right!, env);
          if (this.errorOccurred) return rightValue;

          if (leftNode.type === 'Identifier') {
              const name = leftNode.name!;
              let finalValue;
               try {
                    const currentVal = env.lookup(name); // Check if exists and get current value
                    switch (node.operator) {
                        case '=': finalValue = rightValue; break;
                        case '+=': finalValue = currentVal + rightValue; break;
                        case '-=': finalValue = currentVal - rightValue; break;
                        case '*=': finalValue = currentVal * rightValue; break;
                        case '/=': if (rightValue === 0) throw new Error("9isma 3la zero mamno3a!"); finalValue = currentVal / rightValue; break;
                        case '%=': if (rightValue === 0) throw new Error("Modulus b zero mamno3!"); finalValue = currentVal % rightValue; break;
                        default: throw new Error(`Assignment operator ma fhamtouch: ${node.operator}`);
                    }
               } catch (lookupError) {
                   // Assignment to undeclared variable error is handled by env.assign
                   throw lookupError;
               }
              return env.assign(name, finalValue); // Assign the calculated value

          } else if (leftNode.type === 'MemberExpression') {
              const obj = this.evaluate(leftNode.object!, env);
              if (this.errorOccurred) return obj;
               if (obj == null) { // Check for null or undefined
                    throw new Error(`Ma ymknch t assigner l property dyal ${obj === null ? 'farkha' : 'mchmcha'}.`);
               }

              let propName: string | number;
              if (leftNode.computed) {
                  propName = this.evaluate(leftNode.property!, env);
                   if (this.errorOccurred) return propName;
              } else {
                  if (!leftNode.property || leftNode.property.type !== 'Identifier') {
                      throw new Error("Property assignment khass smia.");
                  }
                  propName = leftNode.property.name!;
                  // Do NOT map Darija property name to JS here for assignment.
                  // We assign to the property as named in DarijaScript.
                  // propName = BUILTIN_PROPERTIES[propName] || propName;
              }

               let finalValue;
                try {
                    // Get current value directly using the determined propName
                    const currentVal = obj[propName];
                    switch (node.operator) {
                        case '=': finalValue = rightValue; break;
                        case '+=': finalValue = currentVal + rightValue; break;
                        case '-=': finalValue = currentVal - rightValue; break;
                        case '*=': finalValue = currentVal * rightValue; break;
                        case '/=': if (rightValue === 0) throw new Error("9isma 3la zero mamno3a!"); finalValue = currentVal / rightValue; break;
                        case '%=': if (rightValue === 0) throw new Error("Modulus b zero mamno3!"); finalValue = currentVal % rightValue; break;
                        default: throw new Error(`Assignment operator ma fhamtouch: ${node.operator}`);
                    }
                    obj[propName] = finalValue; // Assign the final value
                    return finalValue;
                } catch (error: any) {
                    // Catch potential errors during property access or assignment (e.g., on non-extensible objects)
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
            case '+': return left + right; case '-': return left - right; case '*': return left * right;
            case '/': if (right === 0) throw new Error("9isma 3la zero mamno3a!"); return left / right;
            case '%': if (right === 0) throw new Error("Modulus b zero mamno3!"); return left % right;
            case '==': return left == right; case '!=': return left != right;
            case '===': return left === right; case '!==': return left !== right;
            case '<': return left < right; case '>': return left > right;
            case '<=': return left <= right; case '>=': return left >= right;
            default: throw new Error(`Operator dial binary ma 3rftouch: ${node.operator}`);
        }
    }

    visitLogicalExpression(node: ASTNode, env: Environment): any {
         const left = this.evaluate(node.left!, env);
         if (this.errorOccurred) return left;
         // Short-circuiting behavior:
         if (node.operator === '||') return this.isTruthy(left) ? left : this.evaluate(node.right!, env);
         if (node.operator === '&&') return !this.isTruthy(left) ? left : this.evaluate(node.right!, env);
         // If error occurs in right operand evaluation, it will be caught by interpret()
         throw new Error(`Logical operator ma 3rftouch: ${node.operator}`);
    }


    visitUnaryExpression(node: ASTNode, env: Environment): any {
        const operand = this.evaluate(node.argument!, env);
         if (this.errorOccurred) return operand;
        switch (node.operator) {
            case '-': return -operand; case '!': return !this.isTruthy(operand);
            case 'no3': return typeof operand; case '+': return +operand; // Unary plus for type coercion
            default: throw new Error(`Operator dial unary ma 3rftouch: ${node.operator}`);
        }
    }

     visitUpdateExpression(node: ASTNode, env: Environment): any {
        const argNode = node.argument!;
        if (argNode.type === 'Identifier') {
            const varName = argNode.name!;
            let value = env.lookup(varName); // Ensure variable exists
            if (typeof value !== 'number') throw new Error(`Operator "${node.operator}" khass ykoun m3a number.`);
            const originalValue = value;
            value = node.operator === '++' ? value + 1 : value - 1;
            env.assign(varName, value); // Assign back the updated value
            return node.prefix ? value : originalValue; // Return new value for prefix, old for postfix
        } else if (argNode.type === 'MemberExpression') {
           const obj = this.evaluate(argNode.object!, env);
           if (this.errorOccurred) return obj;
            if (obj == null) throw new Error(`Ma ymknch t update property dyal ${obj === null ? 'farkha' : 'mchmcha'}.`);
            let propName: string | number;
            if (argNode.computed) {
                 propName = this.evaluate(argNode.property!, env);
                 if (this.errorOccurred) return propName;
            } else {
                 if (!argNode.property || argNode.property.type !== 'Identifier') throw new Error("Property update khass smia.");
                 propName = argNode.property.name!;
                 // Do not map property name here, update the DarijaScript named property
                 // propName = BUILTIN_PROPERTIES[propName] || propName;
            }
             let value = obj[propName]; // Get current value
             if (typeof value !== 'number') throw new Error(`Operator "${node.operator}" khass ykoun m3a number property.`);
             const originalValue = value;
             value = node.operator === '++' ? value + 1 : value - 1; // Calculate new value
              try {
                  obj[propName] = value; // Assign the updated value back
                  return node.prefix ? value : originalValue;
              } catch (error: any) {
                   throw new Error(`Maقدرتش n update property "${String(propName)}" 3la ${typeof obj}: ${error.message}`);
              }
        } else {
            throw new Error("Update expression khass ykoun 3la variable wla property.");
        }
    }

    visitCallExpression(node: ASTNode, env: Environment): any {
        const calleeNode = node.callee!;
        let thisContext: any = undefined; // 'this' context for the call
        let funcToCall: any;

        // Evaluate arguments first
        let args = (node.arguments ?? []).map(arg => { // Use let for args
            const evaluatedArg = this.evaluate(arg, env);
            if (this.errorOccurred) throw new Error("Ghalat f argument dyal function call."); // Throw to signal error
            return evaluatedArg;
        });
        if (this.errorOccurred) return; // Should have been caught by the throw above


        // Determine the function and 'this' context
        if (calleeNode.type === 'MemberExpression') {
            // Method call: obj.method(...) or obj[method](...)
            const obj = this.evaluate(calleeNode.object!, env);
            if (this.errorOccurred) return obj;
            if (obj == null) throw new Error(`Ma ymknch tnadi method mn ${obj === null ? 'farkha' : 'mchmcha'}.`);

            let propName: string | number | symbol;
            let darijaPropName: string | null = null; // Store original Darija name if needed

            if (calleeNode.computed) {
                propName = this.evaluate(calleeNode.property!, env);
                if (this.errorOccurred) return propName;
            } else {
                if (!calleeNode.property || calleeNode.property.type !== 'Identifier') {
                    throw new Error("Method call khass smia.");
                }
                darijaPropName = calleeNode.property.name!;
                // Check if it's a Darija built-in method name and map to JS name for lookup
                const mappedJsMethod = this.mapDarijaMethodToJs(darijaPropName);
                propName = mappedJsMethod || darijaPropName; // Use mapped JS name if exists, else original Darija name
            }

            // Get the function from the object using the determined property name (JS or Darija)
            funcToCall = obj[propName];
            thisContext = obj; // 'this' is the object itself

             // Special handling for built-in methods like Array.map/filter etc. that take callbacks
             const requiresCallbackWrapper = (obj instanceof Array || typeof obj === 'string') &&
                                            typeof propName === 'string' &&
                                            ['map', 'filter', 'find', 'forEach', 'reduce'].includes(propName);

             if (requiresCallbackWrapper && args.length > 0 && args[0] instanceof DarijaScriptFunction) {
                const darijaCallback = args[0];
                 // Wrap the DarijaScript function in a JS function that sets up the correct environment
                 const jsCallbackWrapper = (...callbackArgs: any[]) => {
                    const callbackEnv = darijaCallback.closure.extend();
                    // Bind arguments (value, index, array) to Darija function parameters
                    darijaCallback.params.forEach((param, index) => {
                         if (param.name) {
                            callbackEnv.declare(param.name, callbackArgs[index], false);
                         }
                    });
                    // Set 'hadi' (this) within the callback. Use the original 'thisContext' if available.
                    // For Array methods, 'this' inside the callback can be passed as a second argument to map/filter etc.
                    // We need to decide the desired behavior or mimic JS default (undefined in strict, global otherwise)
                    callbackEnv.declare('hadi', thisContext, false); // Use obj as 'hadi' for now

                    let returnValue: any = undefined;
                    try {
                         // Execute the Darija function body in the new environment
                         this.evaluate(darijaCallback.body, callbackEnv);
                    } catch (e) {
                         if (e instanceof ReturnValue) {
                             returnValue = e.value;
                         } else {
                             throw e; // Re-throw Break/Continue or actual errors
                         }
                    }
                    return returnValue;
                 };
                 // Need to handle the optional 'thisArg' for methods like map, filter, etc.
                 const thisArg = args[1]; // Assuming second arg is thisArg, if provided
                 args = [jsCallbackWrapper, thisArg]; // Adjust args for the native call
             }


        } else {
            // Regular function call: func(...)
            funcToCall = this.evaluate(calleeNode, env);
            if (this.errorOccurred) return funcToCall;
            // Default 'this' for global function calls. In strict mode, should be undefined.
            // Here, we simplify and use the global 'hadi' value.
            thisContext = this.globalEnv.lookup('hadi');
             // Handle static calls like Object.keys / Object.values invoked via Darija names
             if (calleeNode.type === 'Identifier') {
                 if (calleeNode.name === 'mfatih') { funcToCall = Object.keys; thisContext=Object; }
                 if (calleeNode.name === 'qiyam') { funcToCall = Object.values; thisContext=Object; }
             }
        }

         // Check if the callee is actually callable
         if (typeof funcToCall !== 'function' && !(funcToCall instanceof DarijaScriptFunction)) {
             let calleeName = 'expression';
             if (calleeNode?.type === 'Identifier') calleeName = calleeNode.name!;
             else if (calleeNode?.type === 'MemberExpression' && calleeNode.property?.type === 'Identifier') calleeName = calleeNode.property.name!;
              // Provide more detail if it was a mapped method
             if(calleeNode.type === 'MemberExpression' && calleeNode.property?.type === 'Identifier'){
                 const originalName = calleeNode.property.name!;
                 const mappedName = this.mapDarijaMethodToJs(originalName);
                 if(mappedName && mappedName !== originalName) {
                      calleeName = `${originalName} (-> ${mappedName})`;
                 }
             }
             throw new Error(`Dak lli bghiti tnadi "${calleeName}" (type: ${typeof funcToCall}) ماشي dala.`);
         }

          // Handle DarijaScript function calls
         if (funcToCall instanceof DarijaScriptFunction) {
             const callEnv = funcToCall.closure.extend();
             if (funcToCall.params.length !== args.length) {
                  throw new Error(`Dala "${funcToCall.name || 'anonymous'}" katsnna ${funcToCall.params.length} arguments, 3titih ${args.length}.`);
             }
             // Declare arguments in the function's environment
             funcToCall.params.forEach((param, index) => {
                  if (!param.name) throw new Error("Parameter khass smia.");
                  callEnv.declare(param.name, args[index], false);
             });
              // Set 'hadi' (this) for the user function call.
              // Use the determined thisContext (e.g., the object for method calls, global otherwise)
             callEnv.declare('hadi', thisContext, false);
              try {
                 // Evaluate the function body
                 this.evaluate(funcToCall.body, callEnv);
                 return undefined; // Functions implicitly return undefined if no 'rj3'
              } catch (e) {
                  if (e instanceof ReturnValue) return e.value; // Catch return value
                  else throw e; // Re-throw other signals/errors
              }
          } else {
               // Native JS function calls (including built-ins and methods)
               try {
                    // The global function wrappers handle output capture and errors
                    // For methods, we call directly using apply
                    return funcToCall.apply(thisContext, args);
               } catch (error: any) {
                    let funcName = 'native function';
                     if(calleeNode.type === 'Identifier') funcName = calleeNode.name!;
                     else if (calleeNode.type === 'MemberExpression' && calleeNode.property?.type === 'Identifier') funcName = calleeNode.property.name!;
                    throw new Error(`Ghalat mli kan nadi native function/method "${funcName}": ${error.message}`);
               }
          }
    }

      visitFunctionDeclaration(node: ASTNode, env: Environment): any {
        if (!node.id || !node.id.name) throw new Error("Function declaration khass smia.");
        const funcName = node.id.name;
        const params = node.params ?? [];
        const body = node.body!;
        const closure = env; // Capture the current environment
        const dsFunction = new DarijaScriptFunction(funcName, params, body, closure);
        env.declare(funcName, dsFunction, false); // Declare the function in the current environment
        return undefined;
    }

     visitFunctionExpression(node: ASTNode, env: Environment): DarijaScriptFunction {
         const funcName = node.id?.name || null; // Anonymous functions have null name
         const params = node.params ?? [];
         const body = node.body!;
         const closure = env; // Capture the current environment
         // Return the function object itself, not declared in the env here
         return new DarijaScriptFunction(funcName, params, body, closure);
     }

     visitIfStatement(node: ASTNode, env: Environment): any {
        const test = this.evaluate(node.test!, env);
        if (this.errorOccurred) return test;
        if (this.isTruthy(test)) {
            return this.evaluate(node.consequent!, env);
        } else if (node.alternate) {
            return this.evaluate(node.alternate, env);
        }
        return undefined; // No else branch executed
    }

      visitWhileStatement(node: ASTNode, env: Environment): any {
        let lastResult: any = undefined;
        while (this.isTruthy(this.evaluate(node.test!, env))) {
             if (this.errorOccurred) return; // Check for errors from test evaluation
             try {
                lastResult = this.evaluate(node.body!, env);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) break; // Exit the loop
                 else if (e instanceof ContinueSignal) continue; // Skip to next iteration test
                 else throw e; // Re-throw ReturnValue or runtime errors
             }
        }
        return undefined; // Loop finished normally
    }

     visitDoWhileStatement(node: ASTNode, env: Environment): any {
        let lastResult: any = undefined;
        do {
             try {
                lastResult = this.evaluate(node.body!, env);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) break;
                 else if (e instanceof ContinueSignal) {} // Continue still requires test check
                 else throw e;
             }
             // Evaluate the test condition *after* the first iteration
             const testResult = this.evaluate(node.test!, env);
             if (this.errorOccurred) return testResult;
             if (!this.isTruthy(testResult)) break; // Exit if test is false
        } while (true);
        return undefined;
    }

     visitForStatement(node: ASTNode, env: Environment): any {
        const forEnv = env.extend(); // Create a new scope for the loop variables
        let lastResult: any = undefined;
        // Evaluate initializer in the new scope
        if (node.init) {
            this.evaluate(node.init, forEnv);
            if (this.errorOccurred) return;
        }
        // Loop condition check
        while (!node.test || this.isTruthy(this.evaluate(node.test, forEnv))) {
             if (this.errorOccurred) return; // Error in test evaluation
             // Execute loop body
             try {
                lastResult = this.evaluate(node.body!, forEnv);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) break; // Exit loop
                 else if (e instanceof ContinueSignal) {
                      // If continue, jump directly to update, then re-test
                      if (node.update) {
                          this.evaluate(node.update, forEnv);
                          if (this.errorOccurred) return;
                      }
                      continue; // Continue to the next loop iteration test
                 }
                 else throw e; // Re-throw ReturnValue or runtime errors
             }
              // Evaluate update expression (if any) after body execution
              if (node.update) {
                 this.evaluate(node.update, forEnv);
                 if (this.errorOccurred) return;
             }
        }
        return undefined; // Loop finished
    }

     visitTryStatement(node: ASTNode, env: Environment): any {
        let result: any;
        try {
            result = this.evaluate(node.block!, env);
             if (this.errorOccurred) return result; // Propagate error object
        } catch (error: any) {
             // Don't handle control flow signals here, re-throw them
             if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
                 // Execute finally block before re-throwing control flow signal
                 if (node.finalizer) {
                     try { this.evaluate(node.finalizer, env); }
                     catch (finallyError: any) {
                          // Error in finally overrides the original signal/error
                          this.errorOccurred = true;
                          this.output.push(`Ghalat f finally block: ${finallyError.message || finallyError}`);
                          return { error: `Ghalat f finally block: ${finallyError.message || finallyError}` };
                     }
                 }
                throw error; // Re-throw the control flow signal
            }
             // This is a runtime error, handle with catch/finally
            if (node.handler) {
                const catchEnv = env.extend();
                 if (node.handler.param && node.handler.param.name) {
                    // Declare the error object in the catch block's scope
                    catchEnv.declare(node.handler.param.name, error.message || error, false); // Store message or error itself
                 }
                  try {
                    // Execute the catch block
                    result = this.evaluate(node.handler.body!, catchEnv);
                      if (this.errorOccurred) return result; // Propagate error from catch
                 } catch(catchBlockError: any) {
                       // If error occurs *within* the catch block, finally still runs
                       if (node.finalizer) {
                           try { this.evaluate(node.finalizer, env); }
                           catch (finallyError: any) {
                                this.errorOccurred = true;
                                this.output.push(`Ghalat f finally block after catch error: ${finallyError.message || finallyError}`);
                                return { error: `Ghalat f finally block after catch error: ${finallyError.message || finallyError}` };
                           }
                       }
                       throw catchBlockError; // Re-throw error from catch block
                 }
            } else {
                 // No catch block, but maybe finally. If no finally, re-throw original error.
                  if (!node.finalizer) throw error;
            }
        } finally {
             // Execute finally block if it exists, regardless of try/catch outcomes
            if (node.finalizer) {
                 try {
                     const finallyResult = this.evaluate(node.finalizer, env);
                      // If finally throws or returns, it overrides previous outcomes
                      // Error propagation from finally handled by the main interpret try/catch
                      // ReturnValue from finally needs specific handling if desired (JS usually doesn't return from finally)
                      // We'll ignore finally's return value for now, just execute it.
                      if (this.errorOccurred) return; // Propagate error from finally
                 }
                 catch (finallyError: any) {
                      // Handle control flow signals from finally? JS typically doesn't allow break/continue here.
                      // If finally throws a runtime error, it overrides everything.
                      if (!(finallyError instanceof ReturnValue || finallyError instanceof BreakSignal || finallyError instanceof ContinueSignal)) {
                           this.errorOccurred = true;
                           this.output.push(`Ghalat f finally block: ${finallyError.message || finallyError}`);
                           return { error: `Ghalat f finally block: ${finallyError.message || finallyError}` };
                      } else {
                           // Re-throw control flow signals from finally if needed, though unusual
                           throw finallyError;
                      }
                 }
            }
        }
        // Return the result from try or catch block (if executed)
        return result;
     }

     visitMemberExpression(node: ASTNode, env: Environment): any {
        const obj = this.evaluate(node.object!, env);
        if (this.errorOccurred) return obj;
         if (obj == null) { // Check for both null and undefined
            throw new Error(`Ma ymknch tqra property mn ${obj === null ? 'farkha' : 'mchmcha'}.`);
        }
        let propName: string | number | symbol;
        if (node.computed) { // Bracket notation: obj[expr]
             propName = this.evaluate(node.property!, env);
             if (this.errorOccurred) return propName;
        } else { // Dot notation: obj.prop
            if (!node.property || node.property.type !== 'Identifier') {
                 throw new Error("Member access b '.' khass ykoun smia.");
            }
            const darijaPropName = node.property.name!;
             // Check if it's a mapped property like 'twil' -> 'length'
             const mappedProp = BUILTIN_PROPERTIES[darijaPropName];
             if (mappedProp) {
                 try { return obj[mappedProp]; } // Access using the JS name
                 catch (error: any) { throw new Error(`Ghalat mli kan qra property "${darijaPropName}" (JS: ${mappedProp}) mn ${typeof obj}: ${error.message}`); }
             }
             // Check if it's a mapped method name
             const mappedMethod = this.mapDarijaMethodToJs(darijaPropName);
             if (mappedMethod && typeof obj[mappedMethod] === 'function') {
                // If it's a method, return it bound to the object 'this' context
                 // This ensures 'this' is correctly set when the function is called later via CallExpression
                return obj[mappedMethod].bind(obj);
             }
             // If not a mapped property or method, use the Darija name directly
             propName = darijaPropName;
        }
         try {
             // Access the property using the determined name (could be number, string, symbol, or Darija name)
            const value = obj[propName];
            // If the retrieved value is a native JS function (but not one we manually bound above),
            // bind it to the object instance here.
            if (typeof value === 'function' && !(value instanceof DarijaScriptFunction)) {
                // Check if it's a method of this object instance or its prototype chain
                if (propName in obj) { // Use 'in' to check prototype chain as well
                    return value.bind(obj);
                }
            }
            return value; // Return the raw value (primitive, object, DarijaScriptFunction, undefined, etc.)
         } catch (error: any) {
             throw new Error(`Ghalat mli kan qra property "${String(propName)}" mn ${typeof obj}: ${error.message}`);
         }
     }

       visitNewExpression(node: ASTNode, env: Environment): any {
        const callee = this.evaluate(node.callee!, env);
        if (this.errorOccurred) return callee;
        const args = (node.arguments ?? []).map(arg => {
             const evalArg = this.evaluate(arg, env);
             if (this.errorOccurred) throw new Error("Ghalat f argument dyal constructor.");
             return evalArg;
        });
         if (this.errorOccurred) return;

        // Check if the callee is a constructor (native JS function)
        if (typeof callee !== 'function' || callee instanceof DarijaScriptFunction) {
            let calleeName = node.callee?.type === 'Identifier' ? node.callee.name! : 'expression';
            throw new Error(`Dak lli bghiti dir lih 'jdid' ("${calleeName}") ماشي constructor s7i7.`);
        }
         try {
             // Handle specific built-in constructors like Date ('wa9t')
             if (node.callee?.type === 'Identifier' && node.callee.name === 'wa9t') {
                  return new Date(...args);
             }
             // Allow constructing other native JS classes if available globally
             return new (callee as any)(...args);
         } catch (error: any) {
              let constructorName = node.callee?.type === 'Identifier' ? node.callee.name : 'constructor';
             throw new Error(`Ghalat mli kan dir 'jdid ${constructorName}': ${error.message}`);
         }
    }

    visitSwitchStatement(node: ASTNode, env: Environment): any {
        const discriminant = this.evaluate(node.discriminant!, env);
        if (this.errorOccurred) return discriminant;
        const switchEnv = env.extend(); // Scope for potential block-scoped variables within cases
        let matched = false;
        let fallThrough = false; // Track if we are falling through cases
        let defaultCaseNode: ASTNode | null = null;

        // Find the default case first (if any)
        for (const caseNode of node.cases ?? []) {
            if (!caseNode.test) {
                defaultCaseNode = caseNode;
                break;
            }
        }

        try {
            // Iterate through cases
            for (const caseNode of node.cases ?? []) {
                 if (this.errorOccurred) break;
                 let isCurrentMatch = false;
                 // Skip default case in this loop
                 if (!caseNode.test) continue;

                 // Evaluate case test only if no previous match or currently falling through
                 if (!matched || fallThrough) {
                     const caseValue = this.evaluate(caseNode.test, switchEnv);
                     if (this.errorOccurred) break;
                     // Use strict equality (===) for matching, like JS switch
                     if (discriminant === caseValue) {
                         isCurrentMatch = true;
                         matched = true;
                         fallThrough = true; // Start falling through
                     }
                 }

                 // Execute consequent block if it's a match or we are falling through
                 if (isCurrentMatch || fallThrough) {
                     for (const stmt of caseNode.consequent ?? []) {
                         this.evaluate(stmt, switchEnv); // Evaluate statement
                         if (this.errorOccurred) throw new Error("Ghalat f west switch case statement."); // Throw to break out
                     }
                     // Fallthrough continues unless a 'wa9f' (break) is encountered (handled by throwing BreakSignal)
                 }
            }

            // Execute default case if no match occurred, or if we fell through to it
             if (defaultCaseNode && (!matched || fallThrough)) {
                  for (const stmt of defaultCaseNode.consequent ?? []) {
                     this.evaluate(stmt, switchEnv);
                     if (this.errorOccurred) throw new Error("Ghalat f west default switch case statement.");
                 }
             }

        } catch (e) {
             if (e instanceof BreakSignal) {
                 // 'wa9f' encountered, exit the switch normally
             } else if (e instanceof ContinueSignal) {
                 // 'kamml' is generally not meaningful directly inside a switch, treat like break?
                 // Or throw an error? For now, act like break.
             } else {
                 throw e; // Re-throw ReturnValue or runtime errors
             }
         }
        return undefined; // Switch statement itself doesn't return a value
    }

     visitArrayExpression(node: ASTNode, env: Environment): any[] {
        const elements = (node.elements ?? []).map(element => {
            // Handle elision (empty slots like [1, , 3])
            if (element === null || element === undefined) {
                // JS arrays handle sparse elements natively, return undefined for the slot
                return undefined;
            }
            const value = this.evaluate(element, env);
            if (this.errorOccurred) throw new Error("Ghalat f evaluation dyal element f array.");
            return value;
        });
         // If an error occurred during element evaluation, the map would have thrown.
         // If we reach here, elements array is populated (possibly with undefined for elisions).
         if (this.errorOccurred) {
             return []; // Should not be reached if errors are thrown correctly
         }
        return elements;
    }

     visitObjectExpression(node: ASTNode, env: Environment): object {
         const obj: { [key: string]: any } = {};
         for (const propNode of node.properties ?? []) {
             if (propNode.type !== 'Property' || !propNode.key || !propNode.value) {
                 throw new Error("Object literal property format ghalat.");
             }
             let key: string | number;
             if (propNode.key.type === 'Identifier') {
                 key = propNode.key.name!;
             } else if (propNode.key.type === 'StringLiteral' || propNode.key.type === 'NumericLiteral') {
                 key = propNode.key.value;
             } else {
                  throw new Error("Smia dyal object property khass tkoun Identifier, String, wla Number.");
             }

             const value = this.evaluate(propNode.value, env);
             if (this.errorOccurred) throw new Error("Ghalat f evaluation dyal object property value.");

             obj[key] = value;
         }
          if (this.errorOccurred) {
             return {}; // Should not be reached
         }
         return obj;
     }


    // --- Helper Methods ---

    isTruthy(value: any): boolean {
        // Mimics JavaScript truthiness: false, 0, "", null, undefined, NaN are falsey.
        return !(!value || value === 0 || (typeof value === 'bigint' && value === 0n) || value === "" || value === null || value === undefined || Number.isNaN(value));
    }

    formatValueForOutput(value: any): string {
        if (value === undefined) return 'mchmcha';
        if (value === null) return 'farkha';
        if (typeof value === 'string') return value; // Keep strings as they are for output
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'function') {
             if (value instanceof DarijaScriptFunction) return `[Dala: ${value.name || 'anonymous'}]`;
             else return `[Dala Native: ${value.name || 'anonymous'}]`;
        }
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                 // Recursively format array elements, handle circular references
                 try {
                     const cache = new Set();
                     return `[${value.map(v => {
                         if (typeof v === 'object' && v !== null) {
                             if (cache.has(v)) return '[Circular]';
                             cache.add(v);
                         }
                         return this.formatValueForOutput(v);
                     }).join(', ')}]`;
                 } catch { return '[Array]'; } // Fallback
            } else {
                 // Basic object formatting, handle circular references
                 try {
                     const cache = new Set();
                     // Use JSON.stringify for a structured view, replacing functions
                     return JSON.stringify(value, (key, val) => {
                         if (typeof val === 'object' && val !== null) {
                             if (cache.has(val)) return '[Circular]';
                             cache.add(val);
                         }
                         if (typeof val === 'function') return '[Function]';
                          if (typeof val === 'bigint') return `${val}n`; // BigInt needs special handling
                         return val;
                     }, 2); // Indent for readability
                 } catch { return '[Object]'; } // Fallback for unstringifiable objects
            }
        }
        if (typeof value === 'symbol') return String(value);
        if (typeof value === 'bigint') return `${value}n`; // Format BigInts
        return typeof value; // Fallback for unknown types
    }

    mapDarijaMethodToJs(darijaMethod: string): string | null {
        const map: { [key: string]: string } = {
             'kbr7rf': 'toUpperCase', 'sghr7rf': 'toLowerCase', 'kayn': 'includes',
             'zid': 'push', '7yed': 'pop', '7yedmnlwla': 'shift', 'zidfllwla': 'unshift',
             'dwr': 'map', 'n9i': 'filter', 'lfech': 'forEach', 'l9a': 'find', 'lmmaj': 'reduce',
             '3am': 'getFullYear', 'chhr': 'getMonth', 'nhar': 'getDate'
             // Static methods like mfatih/qiyam are handled differently (in callExpression)
             // Properties like 'twil' handled in memberExpression
        };
        return map[darijaMethod] || null; // Return JS name or null if no mapping
    }
}


// --- Main interpret function (Entry Point) ---

export function interpret(code: string): { output: string[], error?: string } {
  let interpreter: Interpreter | null = null;
  try {
    // 1. Tokenize
    const tokens = tokenize(code);
    const tokenizerError = tokens.find(t => t.type === 'ERROR');
    if (tokenizerError) {
        console.error("Tokenizer Error:", tokenizerError.value);
        return { output: [], error: `Ghalat f Tokenizer: ${tokenizerError.value}` };
    }
    // console.log("Tokens:", tokens); // Debugging

    // 2. Parse
    const ast = parseCode(tokens); // Use imported parse function
    if (ast.error) {
         console.error("Parser Error:", ast.error);
         return { output: [], error: `Ghalat f Parser: ${ast.error}` };
    }
    // console.log("AST:", JSON.stringify(ast, null, 2)); // Debugging

    // 3. Interpret
    interpreter = new Interpreter(ast);
    interpreter.interpret(); // Start interpretation

    // Check if interpretation itself set the error flag
    if (interpreter.errorOccurred) {
      // The error message should already be in the output array
      const lastOutput = interpreter.output[interpreter.output.length - 1] || "Runtime ghalat.";
      // Ensure the returned error message starts with "Ghalat:"
      const errorMessage = lastOutput.startsWith('Ghalat:') ? lastOutput.substring(7).trim() : lastOutput;
      return { output: interpreter.output, error: `Ghalat: ${errorMessage}` };
    }

    // Interpretation finished without errors reported by the interpreter itself
    return { output: interpreter.output };

  } catch (e: any) {
    // Catch unexpected system errors during tokenization, parsing, or interpretation
    console.error("Interpreter System Error:", e);
    const errorMessage = (e && typeof e.message === 'string') ? e.message : 'Erreur système inconnue.';
     const output = interpreter ? interpreter.output : [];
     // Add system error message to output if it wasn't already added by interpreter
     if (!output.some(line => line.includes(errorMessage))) {
         output.push(`Ghalat System: ${errorMessage}`);
     }
    // Ensure the returned error reflects the system error
    return { output: output, error: `Ghalat System: ${errorMessage}` };
  }
}

