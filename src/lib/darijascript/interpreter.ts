

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
    '7yed', '7yedmnlwla', '3am' // Add others if needed
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

     // Check for keywords starting with numbers *before* general identifiers/numbers
    if (code.substring(cursor).match(/^7ala(?!\w)/)) {
        tokens.push({ type: 'KEYWORD', value: '7ala', line, column: startColumn });
        cursor += 4; column += 4; continue;
    }
    if (code.substring(cursor).match(/^3adi(?!\w)/)) {
        tokens.push({ type: 'KEYWORD', value: '3adi', line, column: startColumn });
        cursor += 4; column += 4; continue;
    }

    // Check for number-starting identifiers used as methods/functions
    let matchedNumIdentifier = false;
    for (const numIdent of NUMBER_STARTING_IDENTIFIERS) {
        if (code.substring(cursor).match(new RegExp(`^${numIdent}(?!\\w)`))) {
            tokens.push({ type: 'IDENTIFIER', value: numIdent, line, column: startColumn });
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
            if (typeof window !== 'undefined' && name in window) {
                return (window as any)[name];
            }
             if (typeof global !== 'undefined' && name in global) {
                 return (global as any)[name];
             }
            throw new Error(`Variable "${name}" ma declaritch.`);
        }
        if (!env.vars.has(name)) {
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
                         return nativeFunc.apply(console, args); // Apply console methods on console
                     }
                     // For Math, Date static methods, apply on undefined/null
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
                    throw new Error(`Ghalat f dlla "${name}": ${error.message}`);
                }
            }, true);
        }

        // Inject language constants
        this.globalEnv.declare('mchmcha', undefined, true);
        this.globalEnv.declare('farkha', null, true);
        this.globalEnv.declare('hadi', typeof window !== 'undefined' ? window : undefined, true);
    }

    interpret(node: ASTNode = this.ast, env: Environment = this.globalEnv): any {
         if (this.errorOccurred) return { error: "Execution stopped due to previous error." };

        try {
           return this.evaluate(node, env);
        } catch (error: any) {
            if (this.errorOccurred) return;
             if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
                throw error;
             }
            this.errorOccurred = true;
            const errorNode = node;
            const errorMessage = `Runtime Ghalat [Ln ${errorNode.line ?? '?'}, Col ${errorNode.column ?? '?'}]: ${error.message || error}`;
            this.output.push(`Ghalat: ${errorMessage}`);
            console.error("Interpreter Runtime Error:", errorMessage, error);
            return { error: errorMessage };
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
                    if (this.errorOccurred) return lastVal;
                }
                return lastVal;

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
             // Add cases for other potential AST node types:
             // case 'ObjectExpression': ...
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
              let value: any = undefined; // Default to undefined
             if (declarator.initializer) {
                 value = this.evaluate(declarator.initializer, env);
                 if (this.errorOccurred) return value;
             }
             env.declare(name, value, isConstant);
         }
         return undefined;
     }

      visitAssignmentExpression(node: ASTNode, env: Environment): any {
          const leftNode = node.left!;
          const rightValue = this.evaluate(node.right!, env);
          if (this.errorOccurred) return rightValue;

          if (leftNode.type === 'Identifier') {
              const name = leftNode.name!;
              let finalValue;
               try {
                    const currentVal = env.lookup(name);
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
                   // Allow assignment to undeclared global (implicit global) like non-strict JS?
                   // For now, enforce declaration before assignment via env.assign's check.
                   throw lookupError;
               }
              return env.assign(name, finalValue);

          } else if (leftNode.type === 'MemberExpression') {
              const obj = this.evaluate(leftNode.object!, env);
              if (this.errorOccurred) return obj;
               if (obj == null) {
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
                  propName = BUILTIN_PROPERTIES[propName] || propName;
              }

               let finalValue;
                try {
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
                    obj[propName] = finalValue;
                    return finalValue;
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
         if (node.operator === '||') return this.isTruthy(left) ? left : this.evaluate(node.right!, env);
         if (node.operator === '&&') return !this.isTruthy(left) ? left : this.evaluate(node.right!, env);
         throw new Error(`Logical operator ma 3rftouch: ${node.operator}`);
    }


    visitUnaryExpression(node: ASTNode, env: Environment): any {
        const operand = this.evaluate(node.argument!, env);
         if (this.errorOccurred) return operand;
        switch (node.operator) {
            case '-': return -operand; case '!': return !this.isTruthy(operand);
            case 'no3': return typeof operand; case '+': return +operand;
            default: throw new Error(`Operator dial unary ma 3rftouch: ${node.operator}`);
        }
    }

     visitUpdateExpression(node: ASTNode, env: Environment): any {
        const argNode = node.argument!;
        if (argNode.type === 'Identifier') {
            const varName = argNode.name!;
            let value = env.lookup(varName);
            if (typeof value !== 'number') throw new Error(`Operator "${node.operator}" khass ykoun m3a number.`);
            const originalValue = value;
            value = node.operator === '++' ? value + 1 : value - 1;
            env.assign(varName, value);
            return node.prefix ? value : originalValue;
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
                 propName = BUILTIN_PROPERTIES[propName] || propName;
            }
             let value = obj[propName];
             if (typeof value !== 'number') throw new Error(`Operator "${node.operator}" khass ykoun m3a number property.`);
             const originalValue = value;
             value = node.operator === '++' ? value + 1 : value - 1;
              try {
                  obj[propName] = value;
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
        const args = (node.arguments ?? []).map(arg => {
            const evaluatedArg = this.evaluate(arg, env);
            if (this.errorOccurred) throw new Error("Error evaluating argument");
            return evaluatedArg;
        });
        if (this.errorOccurred) return; // Stop if argument evaluation failed

        // Determine the function and 'this' context
        if (calleeNode.type === 'MemberExpression') {
            // Method call: obj.method(...) or obj[method](...)
            const obj = this.evaluate(calleeNode.object!, env);
            if (this.errorOccurred) return obj;
            if (obj == null) throw new Error(`Ma ymknch tnadi method mn ${obj === null ? 'farkha' : 'mchmcha'}.`);

            let propName: string | number | symbol;
            if (calleeNode.computed) {
                propName = this.evaluate(calleeNode.property!, env);
                if (this.errorOccurred) return propName;
            } else {
                if (!calleeNode.property || calleeNode.property.type !== 'Identifier') {
                    throw new Error("Method call khass smia.");
                }
                propName = calleeNode.property.name!;
                // Check if it's a Darija built-in method name
                const mappedJsMethod = this.mapDarijaMethodToJs(propName);
                if (mappedJsMethod) {
                    propName = mappedJsMethod; // Use the JS method name
                }
            }

            funcToCall = obj[propName];
            thisContext = obj; // 'this' is the object itself

             // Special handling for Array methods accessed via Darija names
            if (thisContext instanceof Array && typeof propName === 'string' && BUILTIN_METHODS.includes(propName)) {
                 // Ensure we call the correct Array.prototype method
                 funcToCall = Array.prototype[propName as keyof Array<any>];
            }
            // Similar handling for String methods
            if (typeof thisContext === 'string' && typeof propName === 'string' && BUILTIN_METHODS.includes(propName)) {
                 funcToCall = String.prototype[propName as keyof String];
            }
             // Date methods
            if (thisContext instanceof Date && typeof propName === 'string' && BUILTIN_METHODS.includes(propName)) {
                 funcToCall = Date.prototype[propName as keyof Date];
            }


        } else {
            // Regular function call: func(...)
            funcToCall = this.evaluate(calleeNode, env);
            if (this.errorOccurred) return funcToCall;
            thisContext = env.lookup('hadi'); // Global 'this' (or undefined in strict mode)
             // Handle static calls like Object.keys / Object.values
             if (calleeNode.type === 'Identifier') {
                 if (calleeNode.name === 'mfatih') { funcToCall = Object.keys; thisContext=Object; }
                 if (calleeNode.name === 'qiyam') { funcToCall = Object.values; thisContext=Object; }
             }
        }

         // Check if the callee is actually callable
         if (typeof funcToCall !== 'function' && !(funcToCall instanceof DarijaScriptFunction)) {
             let calleeName = 'expression';
             if (calleeNode?.type === 'Identifier') calleeName = calleeNode.name!;
             else if (calleeNode?.type === 'MemberExpression') calleeName = 'property';
             throw new Error(`Dak lli bghiti tnadi "${calleeName}" (value: ${typeof funcToCall}) ماشي dala.`);
         }

          // Handle DarijaScript function calls
         if (funcToCall instanceof DarijaScriptFunction) {
             const callEnv = funcToCall.closure.extend();
             if (funcToCall.params.length !== args.length) {
                  throw new Error(`Dala "${funcToCall.name || 'anonymous'}" katsnna ${funcToCall.params.length} arguments, 3titih ${args.length}.`);
             }
             funcToCall.params.forEach((param, index) => {
                  if (!param.name) throw new Error("Parameter khass smia.");
                  callEnv.declare(param.name, args[index], false);
             });
              // Set 'hadi' (this) for user function call. Simplification: use global 'this'.
             callEnv.declare('hadi', this.globalEnv.lookup('hadi'), false);
              try {
                 this.evaluate(funcToCall.body, callEnv);
                 return undefined; // Implicit undefined return
              } catch (e) {
                  if (e instanceof ReturnValue) return e.value;
                  else throw e;
              }
          } else {
               // Native JS function calls
               try {
                    // The wrapper in the env handles output capture and errors for global functions
                    // For methods, we call directly using apply
                     if (calleeNode.type === 'MemberExpression') {
                         // Use reflect API for safer calls?
                         return funcToCall.apply(thisContext, args);
                     } else {
                        // Global function (already wrapped or Object static)
                        return funcToCall.apply(thisContext, args);
                     }
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
        const closure = env;
        const dsFunction = new DarijaScriptFunction(funcName, params, body, closure);
        env.declare(funcName, dsFunction, false);
        return undefined;
    }

     visitFunctionExpression(node: ASTNode, env: Environment): DarijaScriptFunction {
         const funcName = node.id?.name || null;
         const params = node.params ?? [];
         const body = node.body!;
         const closure = env;
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
        return undefined;
    }

      visitWhileStatement(node: ASTNode, env: Environment): any {
        let lastResult: any = undefined;
        while (this.isTruthy(this.evaluate(node.test!, env))) {
             if (this.errorOccurred) return;
             try {
                lastResult = this.evaluate(node.body!, env);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) break;
                 else if (e instanceof ContinueSignal) continue;
                 else throw e;
             }
        }
        return undefined;
    }

     visitDoWhileStatement(node: ASTNode, env: Environment): any {
        let lastResult: any = undefined;
        do {
             try {
                lastResult = this.evaluate(node.body!, env);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) break;
                 else if (e instanceof ContinueSignal) {}
                 else throw e;
             }
             const testResult = this.evaluate(node.test!, env);
             if (this.errorOccurred) return testResult;
             if (!this.isTruthy(testResult)) break;
        } while (true);
        return undefined;
    }

     visitForStatement(node: ASTNode, env: Environment): any {
        const forEnv = env.extend();
        let lastResult: any = undefined;
        if (node.init) {
            this.evaluate(node.init, forEnv);
            if (this.errorOccurred) return;
        }
        while (!node.test || this.isTruthy(this.evaluate(node.test, forEnv))) {
             if (this.errorOccurred) return;
             try {
                lastResult = this.evaluate(node.body!, forEnv);
                if (this.errorOccurred) return lastResult;
             } catch (e) {
                 if (e instanceof BreakSignal) break;
                 else if (e instanceof ContinueSignal) {} // Handled by update below
                 else throw e;
             }
              if (node.update) {
                 this.evaluate(node.update, forEnv);
                 if (this.errorOccurred) return;
             }
        }
        return undefined;
    }

     visitTryStatement(node: ASTNode, env: Environment): any {
        let result: any;
        try {
            result = this.evaluate(node.block!, env);
             if (this.errorOccurred) return result;
        } catch (error: any) {
            if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
                 if (node.finalizer) {
                     try { this.evaluate(node.finalizer, env); }
                     catch (finallyError: any) { throw finallyError; }
                 }
                throw error;
            }
            if (node.handler) {
                const catchEnv = env.extend();
                 if (node.handler.param && node.handler.param.name) {
                    catchEnv.declare(node.handler.param.name, error, false);
                 }
                  try {
                    result = this.evaluate(node.handler.body!, catchEnv);
                 } catch(catchError: any) {
                       if (node.finalizer) {
                           try { this.evaluate(node.finalizer, env); }
                           catch (finallyError: any) { throw finallyError; }
                       }
                       throw catchError;
                 }
            } else {
                  if (!node.finalizer) throw error;
            }
        } finally {
            if (node.finalizer) {
                 try { this.evaluate(node.finalizer, env); }
                 catch (finallyError: any) { throw finallyError; }
            }
        }
        return result;
     }

     visitMemberExpression(node: ASTNode, env: Environment): any {
        const obj = this.evaluate(node.object!, env);
        if (this.errorOccurred) return obj;
         if (obj == null) {
            throw new Error(`Ma ymknch tqra property mn ${obj === null ? 'farkha' : 'mchmcha'}.`);
        }
        let propName: string | number | symbol;
        if (node.computed) {
             propName = this.evaluate(node.property!, env);
             if (this.errorOccurred) return propName;
        } else {
            if (!node.property || node.property.type !== 'Identifier') {
                 throw new Error("Member access khass ykoun smia.");
            }
            propName = node.property.name!;
             const mappedProp = BUILTIN_PROPERTIES[propName];
             if (mappedProp) {
                 try { return obj[mappedProp]; }
                 catch (error: any) { throw new Error(`Ghalat mli kan qra property "${propName}" (JS: ${mappedProp}) mn ${typeof obj}: ${error.message}`); }
             }
        }
         try {
            const value = obj[propName];
            // Bind method if it's a function on the object instance
            if (typeof value === 'function' && typeof propName === 'string' && !(func instanceof DarijaScriptFunction)) {
                const jsMethodName = this.mapDarijaMethodToJs(propName) || propName;
                if(typeof obj[jsMethodName] === 'function'){
                    return obj[jsMethodName].bind(obj);
                }
            }
            return value;
         } catch (error: any) {
             throw new Error(`Ghalat mli kan qra property "${String(propName)}" mn ${typeof obj}: ${error.message}`);
         }
     }

       visitNewExpression(node: ASTNode, env: Environment): any {
        const callee = this.evaluate(node.callee!, env);
        if (this.errorOccurred) return callee;
        const args = (node.arguments ?? []).map(arg => {
             const evalArg = this.evaluate(arg, env);
             if (this.errorOccurred) throw new Error("Error evaluating constructor argument");
             return evalArg;
        });
         if (this.errorOccurred) return;
        if (typeof callee !== 'function') {
            let calleeName = node.callee?.type === 'Identifier' ? node.callee.name! : 'expression';
            throw new Error(`Dak lli bghiti dir lih 'jdid' ("${calleeName}") ماشي constructor.`);
        }
         if (callee instanceof DarijaScriptFunction) {
             throw new Error(`Ma ymknch tsta3ml 'jdid' m3a dala dyal DarijaScript "${callee.name || 'anonymous'}" (mazal mam suprtatch).`);
         }
         try {
             // Allow constructing built-ins like Date
             if (node.callee?.type === 'Identifier' && node.callee.name === 'wa9t') {
                  return new Date(...args);
             }
             // Potentially allow other native constructors if needed
             return new (callee as any)(...args);
         } catch (error: any) {
              let constructorName = node.callee?.type === 'Identifier' ? node.callee.name : 'constructor';
             throw new Error(`Ghalat mli kan dir 'jdid ${constructorName}': ${error.message}`);
         }
    }

    visitSwitchStatement(node: ASTNode, env: Environment): any {
        const discriminant = this.evaluate(node.discriminant!, env);
        if (this.errorOccurred) return discriminant;
        const switchEnv = env.extend();
        let matched = false;
        let fallThrough = false;
        let defaultCaseHandler: ASTNode | null = null;
        let blockResult: any = undefined;

        for (const caseNode of node.cases ?? []) {
            if (!caseNode.test) { defaultCaseHandler = caseNode; break; }
        }

        try {
            for (const caseNode of node.cases ?? []) {
                 if (this.errorOccurred) break;
                let isMatch = false;
                if (caseNode.test) {
                    if (!matched || fallThrough) {
                        const caseValue = this.evaluate(caseNode.test, switchEnv);
                        if (this.errorOccurred) break;
                        if (discriminant === caseValue) {
                            isMatch = true; matched = true; fallThrough = true;
                        }
                    }
                } else continue;

                if (isMatch || fallThrough) {
                    for (const stmt of caseNode.consequent ?? []) {
                        blockResult = this.evaluate(stmt, switchEnv);
                        if (this.errorOccurred) throw new Error("Error in switch case");
                    }
                }
            }
            if (defaultCaseHandler && (!matched || fallThrough)) {
                 for (const stmt of defaultCaseHandler.consequent ?? []) {
                     blockResult = this.evaluate(stmt, switchEnv);
                     if (this.errorOccurred) throw new Error("Error in default switch case");
                 }
            }
        } catch (e) {
             if (e instanceof BreakSignal) {}
             else if (e instanceof ContinueSignal) {} // Treat like break in switch
             else throw e;
         }
        return undefined;
    }

     visitArrayExpression(node: ASTNode, env: Environment): any[] {
        const elements = (node.elements ?? []).map(element => {
            // Handle potential null elements (e.g., [1, , 3]) if parser supports them
            if (element === null || element === undefined) {
                // Represent sparse array elements. JS arrays handle this naturally.
                return undefined; // Or handle differently if needed
            }
            const value = this.evaluate(element, env);
            if (this.errorOccurred) throw new Error("Error evaluating array element");
            return value;
        });
         if (this.errorOccurred) {
            // This check might be redundant if the error is thrown inside map
            return []; // Return empty array or handle error state
        }
        return elements;
    }


    // --- Helper Methods ---

    isTruthy(value: any): boolean {
        return !(!value || value === 0 || (typeof value === 'bigint' && value === 0n) || value === "" || value === null || value === undefined || Number.isNaN(value));
    }

    formatValueForOutput(value: any): string {
        if (value === undefined) return 'mchmcha';
        if (value === null) return 'farkha';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'function') {
             if (value instanceof DarijaScriptFunction) return `[Dala: ${value.name || 'anonymous'}]`;
             else return `[Dala Native: ${value.name || 'anonymous'}]`;
        }
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                 return `[${value.map(v => this.formatValueForOutput(v)).join(', ')}]`;
            } else {
                 try {
                     const cache = new Set();
                     return JSON.stringify(value, (key, value) => {
                         if (typeof value === 'object' && value !== null) {
                             if (cache.has(value)) return '[Circular]';
                             cache.add(value);
                         }
                         if (typeof value === 'function') return '[Function]';
                         return value;
                     }, 2);
                 } catch { return '[Object]'; }
            }
        }
        if (typeof value === 'symbol') return String(value);
        if (typeof value === 'bigint') return `${value}n`;
        return typeof value;
    }

    mapDarijaMethodToJs(darijaMethod: string): string | null {
        const map: { [key: string]: string } = {
             'kbr7rf': 'toUpperCase', 'sghr7rf': 'toLowerCase', 'kayn': 'includes',
             'zid': 'push', '7yed': 'pop', '7yedmnlwla': 'shift', 'zidfllwla': 'unshift',
             'dwr': 'map', 'n9i': 'filter', 'lfech': 'forEach', 'l9a': 'find', 'lmmaj': 'reduce',
             '3am': 'getFullYear', 'chhr': 'getMonth', 'nhar': 'getDate'
             // Static methods like mfatih/qiyam are handled differently
        };
        return map[darijaMethod] || null;
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
    // console.log("Tokens:", tokens);

    // 2. Parse
    const ast = parseCode(tokens);
    if (ast.error) {
         console.error("Parser Error:", ast.error);
         return { output: [], error: `Ghalat f Parser: ${ast.error}` };
    }
    // console.log("AST:", JSON.stringify(ast, null, 2));

    // 3. Interpret
    interpreter = new Interpreter(ast);
    interpreter.interpret(); // Start interpretation

    if (interpreter.errorOccurred) {
      const lastOutput = interpreter.output[interpreter.output.length - 1] || "Runtime ghalat.";
      const errorMessage = lastOutput.startsWith('Ghalat:') ? lastOutput : `Ghalat: ${lastOutput}`;
      return { output: interpreter.output, error: errorMessage };
    }

    return { output: interpreter.output };

  } catch (e: any) {
    console.error("Interpreter System Error:", e);
    const errorMessage = (e && typeof e.message === 'string') ? e.message : 'Erreur inconnue lors de l\'interprétation.';
     const output = interpreter ? interpreter.output : [];
     if (interpreter && !interpreter.errorOccurred) {
        output.push(`Ghalat System: ${errorMessage}`);
     } else if (!interpreter) {
         output.push(`Ghalat System: ${errorMessage}`);
     }
    return { output: output, error: `Ghalat System: ${errorMessage}` };
  }
}
