
import { ASTNode, parse } from './parser';

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
  'dala', // function (was khdma)
  'rj3', // return (was rja3)
  'jrb', // try
  'msk', // catch
  'fakhr', // finally
  'bdl3la', // switch
  '7ala', // case
  '3adi', // default
  'mnin', // from (for...of/in)
  'hta', // until/to (for loops)
  'farkha', // null
  'mchmcha', // undefined
  'jdid', // new
  'hadi', // this
  'no3', // typeof
];

const BOOLEAN_LITERALS: { [key: string]: boolean } = {
    's7i7': true, // true
    'kdb': false // false
};

// Built-in function names mapped to their JS equivalents for direct call
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
  // Array/Object/String/Date methods need special handling in the interpreter
};

// Properties need special handling, e.g., 'twil' for length
const BUILTIN_PROPERTIES: { [key: string]: string } = {
    'twil': 'length',
};

// Method calls need special handling based on the object type
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
  'mfatih', // Object.keys
  'qiyam', // Object.values
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
  let column = 0;

  while (cursor < code.length) {
    let char = code[cursor];

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
      }
      continue;
    }


    const startColumn = column;

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (cursor < code.length && /[a-zA-Z0-9_]/.test(code[cursor])) {
        word += code[cursor];
        cursor++;
        column++;
      }

      if (KEYWORDS.includes(word)) {
        tokens.push({ type: 'KEYWORD', value: word, line, column: startColumn });
      } else if (word in BOOLEAN_LITERALS) {
        tokens.push({ type: 'BOOLEAN', value: BOOLEAN_LITERALS[word], line, column: startColumn });
      } else if (word in BUILTIN_FUNCTIONS) {
        tokens.push({ type: 'BUILTIN_FUNCTION', value: word, line, column: startColumn });
      } else if (word in BUILTIN_PROPERTIES) {
         tokens.push({ type: 'BUILTIN_PROPERTY', value: word, line, column: startColumn });
      } else if (BUILTIN_METHODS.includes(word)) {
         tokens.push({ type: 'BUILTIN_METHOD', value: word, line, column: startColumn });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn });
      }
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let numStr = '';
      while (cursor < code.length && /\d/.test(code[cursor])) {
        numStr += code[cursor];
        cursor++;
        column++;
      }
      tokens.push({ type: 'NUMBER', value: parseInt(numStr, 10), line, column: startColumn });
      continue;
    }

    // Strings
    if (char === '"' || char === "'") {
      const quoteType = char;
      let str = '';
      cursor++; // Skip opening quote
      column++;
      while (cursor < code.length && code[cursor] !== quoteType) {
        if (code[cursor] === '\\') { // Handle escape sequences if needed
           cursor++;
           column++;
           if (cursor >= code.length) throw new Error(`[Ln ${line}, Col ${column}] Chaine de caractères pas fermée.`);
           // Basic escape handling (add more if needed: \n, \t, etc.)
           if (code[cursor] === quoteType || code[cursor] === '\\') {
               str += code[cursor];
           } else {
               str += '\\' + code[cursor]; // Keep unrecognized escapes as is
           }
        } else {
          str += code[cursor];
        }
        if (code[cursor] === '\n') { // Strings cannot span lines in basic DarijaScript
            throw new Error(`[Ln ${line}, Col ${column}] Chaine de caractères ne peut pas contenir de nouvelle ligne.`);
        }
        cursor++;
        column++;
      }
      if (cursor >= code.length || code[cursor] !== quoteType) {
         throw new Error(`[Ln ${line}, Col ${column}] Chaine de caractères pas fermée.`);
      }
      cursor++; // Skip closing quote
      column++;
      tokens.push({ type: 'STRING', value: str, line, column: startColumn });
      continue;
    }

    // Operators and Punctuation
    let operatorFound = false;
    for (let len = 3; len >= 1; len--) { // Check for multi-char operators first (e.g., '===')
        const opCandidate = code.substring(cursor, cursor + len);
        if (OPERATORS.includes(opCandidate)) {
            tokens.push({ type: 'OPERATOR', value: opCandidate, line, column });
            cursor += len;
            column += len;
            operatorFound = true;
            break;
        }
    }
    if (operatorFound) continue;


    if (PUNCTUATION.includes(char)) {
      tokens.push({ type: 'PUNCTUATION', value: char, line, column });
      cursor++;
      column++;
      continue;
    }


    throw new Error(`[Ln ${line}, Col ${column}] Ma 3rftch had l caractère: "${char}"`);
  }

  tokens.push({ type: 'EOF', value: null, line, column }); // End of File token
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
        if (this.vars.has(name)) {
            throw new Error(`Variable "${name}" déjà déclarée.`);
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
            throw new Error(`Variable "${name}" ma declaritch.`);
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
            throw new Error(`Variable "${name}" ma declaritch.`);
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

class Interpreter {
    ast: ASTNode;
    globalEnv: Environment;
    output: string[] = []; // To store output from 'tbe3' etc.

    constructor(ast: ASTNode) {
        this.ast = ast;
        this.globalEnv = new Environment();
        // Inject built-in functions into the global environment
        for (const name in BUILTIN_FUNCTIONS) {
            this.globalEnv.declare(name, BUILTIN_FUNCTIONS[name], true);
        }
        // Inject `undefined` equivalent
        this.globalEnv.declare('mchmcha', undefined, true);
         // Inject `null` equivalent
        this.globalEnv.declare('farkha', null, true);
         // Inject `this` equivalent (global this is usually undefined in strict mode or window)
        this.globalEnv.declare('hadi', typeof window !== 'undefined' ? window : undefined, true); // Simplified global `hadi`
    }

    interpret(node: ASTNode = this.ast, env: Environment = this.globalEnv): any {
        try {
           return this.evaluate(node, env);
        } catch (error: any) {
            // Handle runtime errors (including thrown errors from 'rmmi')
            if (error instanceof ReturnValue) {
                // Propagate return value up the call stack
                throw error;
            } else if (error instanceof BreakSignal || error instanceof ContinueSignal) {
                 // Propagate loop control signals
                throw error;
            } else {
                const errorMessage = `Runtime Ghalat 3nd '${node.type}': ${error.message || error}`;
                this.output.push(`Ghalat: ${errorMessage}`);
                console.error(errorMessage, error); // Also log the full error
                return { error: errorMessage }; // Indicate an error occurred
            }
        }
    }

    evaluate(node: ASTNode, env: Environment): any {
       // console.log("Evaluating:", node.type, node); // Debugging log
        switch (node.type) {
            case 'Program':
                let lastVal: any = undefined;
                for (const stmt of node.body ?? []) {
                    lastVal = this.evaluate(stmt, env);
                     // If a statement returned an error object, stop execution
                    if (lastVal && typeof lastVal === 'object' && lastVal.error) {
                        return lastVal;
                    }
                }
                return lastVal; // Or perhaps return the final state or specific result

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
            case 'Identifier':
                return env.lookup(node.name!);
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
            case 'CallExpression':
                return this.visitCallExpression(node, env);
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration(node, env);
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
            case 'ThrowStatement': // When 'rmmi' is called or implicitly thrown
                throw this.evaluate(node.argument!, env); // Evaluate the error object/value
            case 'MemberExpression':
                return this.visitMemberExpression(node, env);
             case 'NewExpression': // Handle 'jdid'
                return this.visitNewExpression(node, env);
            case 'SwitchStatement':
                return this.visitSwitchStatement(node, env);


            default:
                 const errorMessage = `Ma fhmthach '${node.type}' type dyal node`;
                 this.output.push(`Ghalat: ${errorMessage}`);
                 console.error(errorMessage, node);
                 return { error: errorMessage };
        }
    }

     visitBlockStatement(node: ASTNode, env: Environment): any {
        const blockEnv = env.extend(); // Create a new scope for the block
        let lastResult: any = undefined;
        for (const statement of node.body ?? []) {
            lastResult = this.evaluate(statement, blockEnv);
             // Handle errors propagating up
            if (lastResult && typeof lastResult === 'object' && lastResult.error) {
                return lastResult;
            }
        }
        return lastResult; // Return the value of the last expression if needed
    }

     visitVariableDeclaration(node: ASTNode, env: Environment): any {
         const isConstant = node.kind === 'tabit';
         let value = undefined; // Default to 'mchmcha' (undefined)
         if (node.initializer) {
             value = this.evaluate(node.initializer, env);
         }
         if (!node.id || !node.id.name) {
             throw new Error("Variable declaration needs an identifier.");
         }
         env.declare(node.id.name, value, isConstant);
         return value; // Declaration itself evaluates to the assigned value
     }


      visitAssignmentExpression(node: ASTNode, env: Environment): any {
        if (!node.left || !node.left.name) {
            throw new Error("Assignment target must be an identifier.");
        }
        if (!node.right) {
             throw new Error("Assignment needs a value.");
        }
        const value = this.evaluate(node.right, env);
        return env.assign(node.left.name, value);
      }

     visitBinaryExpression(node: ASTNode, env: Environment): any {
        const left = this.evaluate(node.left!, env);
        // Short-circuiting for && and ||
        if (node.operator === '&&') {
            return left ? this.evaluate(node.right!, env) : left;
        }
        if (node.operator === '||') {
            return left ? left : this.evaluate(node.right!, env);
        }

        const right = this.evaluate(node.right!, env);

        switch (node.operator) {
            case '+': return left + right; // Handle string concatenation and addition
            case '-': return left - right;
            case '*': return left * right;
            case '/':
                 if (right === 0) throw new Error("9isma 3la zero mamno3a!");
                 return left / right;
            case '%':
                 if (right === 0) throw new Error("Modulus b zero mamno3!");
                 return left % right;
            case '==': return left == right; // Abstract equality
            case '!=': return left != right;
            case '===': return left === right; // Strict equality
            case '!==': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            // Add bitwise/logical operators if needed
            default: throw new Error(`Operator dial binary ma 3rftouch: ${node.operator}`);
        }
    }

    visitUnaryExpression(node: ASTNode, env: Environment): any {
        const operand = this.evaluate(node.argument!, env);
        switch (node.operator) {
            case '-': return -operand;
            case '!': return !this.isTruthy(operand);
            case 'no3': return typeof operand; // Handle 'no3'
            // Add other unary operators like +, ~, ++, -- if needed
            default: throw new Error(`Operator dial unary ma 3rftouch: ${node.operator}`);
        }
    }

     visitUpdateExpression(node: ASTNode, env: Environment): any {
        if (!node.argument || node.argument.type !== 'Identifier') {
            throw new Error("Update expression khass ykoun 3la variable.");
        }
        const varName = node.argument.name!;
        let value = env.lookup(varName);
        if (typeof value !== 'number') {
             throw new Error(`Operator "${node.operator}" khass ykoun m3a number.`);
        }

        let result;
        if (node.operator === '++') {
            result = node.prefix ? ++value : value++;
        } else if (node.operator === '--') {
            result = node.prefix ? --value : value--;
        } else {
            throw new Error(`Update operator ma 3rftouch: ${node.operator}`);
        }
        env.assign(varName, value); // Assign the updated value back
        return result;
    }


    visitCallExpression(node: ASTNode, env: Environment): any {
        const calleeNode = node.callee!;
        const args = (node.arguments ?? []).map(arg => this.evaluate(arg, env));

         if (calleeNode.type === 'Identifier') {
            const funcName = calleeNode.name!;
            const func = env.lookup(funcName);

            if (typeof func === 'function') {
                // Check if it's one of our special built-ins that need output capture
                 if (['tbe3', 'ghlat', 'nbehh'].includes(funcName)) {
                    const formattedArgs = args.map(this.formatValueForOutput).join(' ');
                    this.output.push(formattedArgs); // Add to interpreter output
                    if (funcName === 'tbe3') return console.log(...args); // Also log normally
                    if (funcName === 'ghlat') return console.error(...args);
                    if (funcName === 'nbehh') return console.warn(...args);
                }
                // Handle 'rmmi' explicitly if needed, though try/catch handles throwing
                if (funcName === 'rmmi') {
                     throw args[0]; // Throw the evaluated argument
                }

                 // Handle regular DarijaScript functions (closures)
                if (func instanceof DarijaScriptFunction) {
                    const callEnv = func.closure.extend(); // Create environment from function's closure
                    // Declare arguments in the new environment
                    if (func.params.length !== args.length) {
                        throw new Error(`Dala "${funcName}" katsnna ${func.params.length} arguments, 3titih ${args.length}.`);
                    }
                    func.params.forEach((param, index) => {
                        callEnv.declare(param.name!, args[index], false); // Arguments are variables
                    });
                     // Execute function body in its own environment
                     try {
                        this.evaluate(func.body, callEnv);
                        return undefined; // Functions return undefined implicitly if no rj3
                     } catch (e) {
                         if (e instanceof ReturnValue) {
                             return e.value; // Return the value from 'rj3'
                         } else {
                             throw e; // Re-throw other errors/signals
                         }
                     }
                 } else {
                      // Handle native JS functions bound in the environment (Math, etc.)
                      // `this` context is tricky here, assuming global context for simplicity
                      try {
                           return func.apply(typeof window !== 'undefined' ? window : undefined, args);
                      } catch (error: any) {
                           throw new Error(`Ghalat mli kan nadi native function "${funcName}": ${error.message}`);
                      }
                 }

            } else {
                 throw new Error(`"${funcName}" ماشي dala.`);
            }
        } else if (calleeNode.type === 'MemberExpression') {
           // Handle method calls like "abc".kbr7rf() or myArray.zid(1)
            const obj = this.evaluate(calleeNode.object!, env);
            if (!calleeNode.property || (calleeNode.property.type !== 'Identifier' && calleeNode.property.type !== 'BUILTIN_METHOD')) {
                throw new Error("Method call khass ykoun 3ndo smia.");
            }
            const methodNameDarija = calleeNode.property.name!; // The DarijaScript method name

             // Map Darija method name to actual JS method name
             const jsMethodName = this.mapDarijaMethodToJs(methodNameDarija);
             if (!jsMethodName) {
                 throw new Error(`Method "${methodNameDarija}" ma 3rftouch.`);
             }


            if (obj == null) { // Check for null or undefined
                 throw new Error(`Ma ymknch tnadi method "${methodNameDarija}" 3la ${obj === null ? 'farkha' : 'mchmcha'}.`);
             }


             // Special handling for Object.keys/values
             if (methodNameDarija === 'mfatih') return Object.keys(obj);
             if (methodNameDarija === 'qiyam') return Object.values(obj);


            const method = obj[jsMethodName];

            if (typeof method === 'function') {
                 try {
                   return method.apply(obj, args);
                 } catch (error: any) {
                   throw new Error(`Ghalat mli kan nadi method "${methodNameDarija}" 3la ${typeof obj}: ${error.message}`);
                 }
            } else {
                throw new Error(`"${methodNameDarija}" (-> ${jsMethodName}) ماشي method dyal ${typeof obj}.`);
            }

        } else {
             throw new Error("Expression dyal call ma fhmthach.");
        }
    }

      visitFunctionDeclaration(node: ASTNode, env: Environment): any {
        if (!node.id || !node.id.name) {
            throw new Error("Function declaration needs a name.");
        }
        const funcName = node.id.name;
        const params = node.params ?? [];
        const body = node.body!;

        // Create a closure: capture the current environment
        const closure = env;
        const dsFunction = new DarijaScriptFunction(funcName, params, body, closure);

        env.declare(funcName, dsFunction, false); // Declare function in the current environment
        return undefined; // Declaration itself doesn't evaluate to a value
    }

     visitIfStatement(node: ASTNode, env: Environment): any {
        const test = this.evaluate(node.test!, env);
        if (this.isTruthy(test)) {
            return this.evaluate(node.consequent!, env);
        } else if (node.alternate) {
            return this.evaluate(node.alternate, env);
        }
        return undefined; // No else branch executed
    }

      visitWhileStatement(node: ASTNode, env: Environment): any {
        let result: any = undefined;
        while (this.isTruthy(this.evaluate(node.test!, env))) {
             try {
                result = this.evaluate(node.body!, env);
                if (result && typeof result === 'object' && result.error) return result; // Propagate error
             } catch (e) {
                 if (e instanceof BreakSignal) break;
                 if (e instanceof ContinueSignal) continue;
                 throw e; // Re-throw other errors/return values
             }
        }
        return undefined; // While loop itself doesn't produce a value
    }

     visitDoWhileStatement(node: ASTNode, env: Environment): any {
        let result: any = undefined;
        do {
             try {
                result = this.evaluate(node.body!, env);
                if (result && typeof result === 'object' && result.error) return result; // Propagate error
             } catch (e) {
                 if (e instanceof BreakSignal) break;
                 if (e instanceof ContinueSignal) continue; // Check condition again
                 throw e;
             }
        } while (this.isTruthy(this.evaluate(node.test!, env)));
        return undefined;
    }

     visitForStatement(node: ASTNode, env: Environment): any {
        const forEnv = env.extend(); // Scope for loop variables
        if (node.init) {
            this.evaluate(node.init, forEnv);
        }
        let result: any = undefined;
        while (!node.test || this.isTruthy(this.evaluate(node.test, forEnv))) {
            try {
                result = this.evaluate(node.body!, forEnv);
                if (result && typeof result === 'object' && result.error) return result; // Propagate error
            } catch (e) {
                if (e instanceof BreakSignal) break;
                if (e instanceof ContinueSignal) {
                    // Evaluate update before continuing
                     if (node.update) this.evaluate(node.update, forEnv);
                     continue;
                }
                throw e;
            }
             // Evaluate update at the end of each iteration
             if (node.update) {
                this.evaluate(node.update, forEnv);
             }
        }
        return undefined;
    }

     visitTryStatement(node: ASTNode, env: Environment): any {
        try {
            return this.evaluate(node.block!, env);
        } catch (error: any) {
            // Check if it's a signal we shouldn't catch here
            if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
                throw error; // Re-throw signals
            }

            if (node.handler) { // If there's a catch block
                const catchEnv = env.extend();
                 // Declare the error variable in the catch block's scope
                 if (node.handler.param && node.handler.param.name) {
                    catchEnv.declare(node.handler.param.name, error, false);
                 }
                 return this.evaluate(node.handler.body!, catchEnv);
            } else {
                 // No catch handler, re-throw the error if no finally
                 if (!node.finalizer) {
                    throw error;
                 }
                 // If only finally, the error will be thrown after finally executes
            }
        } finally {
            if (node.finalizer) {
                this.evaluate(node.finalizer, env);
            }
        }
        return undefined; // Try block itself doesn't return unless catch/block does
     }

     visitMemberExpression(node: ASTNode, env: Environment): any {
        const obj = this.evaluate(node.object!, env);
         if (!node.property) throw new Error("Member expression khass ykoun 3ndo property.");

         if (obj == null) { // Check for null or undefined
            throw new Error(`Ma ymknch tqra property mn ${obj === null ? 'farkha' : 'mchmcha'}.`);
        }


        if (node.computed) { // Array access like arr[0]
             const prop = this.evaluate(node.property, env);
             try {
                return obj[prop];
             } catch(error: any) {
                throw new Error(`Ghalat mli kan qra property [${prop}] mn ${typeof obj}: ${error.message}`);
             }
        } else { // Property access like obj.prop or obj.twil
            if (node.property.type !== 'Identifier' && node.property.type !== 'BUILTIN_PROPERTY') {
                 throw new Error("Property access khass ykoun smia.");
            }
            const propNameDarija = node.property.name!;

            // Map Darija property name to actual JS property name if needed
             const jsPropName = BUILTIN_PROPERTIES[propNameDarija] || propNameDarija;

             try {
                const value = obj[jsPropName];
                 // If accessing a method property without calling, maybe return a bound function or error?
                // For simplicity, let's return the method itself. Proper handling is complex.
                // if (typeof value === 'function') {
                //    return value.bind(obj); // Return the method bound to the object
                // }
                return value;
             } catch(error: any) {
                throw new Error(`Ghalat mli kan qra property ".${propNameDarija}" mn ${typeof obj}: ${error.message}`);
             }
        }
     }

       visitNewExpression(node: ASTNode, env: Environment): any {
        const calleeNode = node.callee!;
        if (calleeNode.type !== 'Identifier' && calleeNode.value !== 'wa9t' /* Special case for Date */) {
             throw new Error(`Operator 'jdid' khass ykoun m3a smia dyal constructor.`);
        }
         const args = (node.arguments ?? []).map(arg => this.evaluate(arg, env));

         // Very basic handling: Assume it's a JS constructor available globally
         // This needs refinement for user-defined constructors
         const constructorName = calleeNode.name || calleeNode.value; // 'wa9t' or other identifier

         try {
            if (constructorName === 'wa9t') {
                 return new Date(...args);
            }

             // Look up the constructor in the global scope (window or global)
             // This is a simplification and might not work in all JS environments securely
            const GlobalConstructor = (typeof window !== 'undefined' ? window : global) as any;
             const Constructor = GlobalConstructor[constructorName];

            if (typeof Constructor === 'function') {
                 return new Constructor(...args);
            } else {
                throw new Error(`Constructor "${constructorName}" ma l9itouch.`);
            }

         } catch (error: any) {
             throw new Error(`Ghalat mli kan dir 'jdid ${constructorName}': ${error.message}`);
         }
    }

    visitSwitchStatement(node: ASTNode, env: Environment): any {
        const discriminant = this.evaluate(node.discriminant!, env);
        const switchEnv = env.extend(); // Scope for the switch block
        let matched = false;
        let defaultCase: ASTNode | null = null;
        let fallThrough = false; // Track fall-through behavior

        for (const caseNode of node.cases ?? []) {
            if (caseNode.test) { // This is a 'case' clause
                if (!matched || fallThrough) {
                    const caseValue = this.evaluate(caseNode.test, switchEnv);
                    // Use strict equality (===) for case comparison, like JS
                    if (discriminant === caseValue) {
                        matched = true;
                        fallThrough = true; // Start falling through
                    }
                }
            } else { // This is the 'default' clause
                defaultCase = caseNode;
            }

            if (matched && fallThrough) {
                try {
                    for (const stmt of caseNode.consequent ?? []) {
                        this.evaluate(stmt, switchEnv);
                    }
                    // Check the last statement for break to stop fall-through
                    if (caseNode.consequent?.length) {
                       const lastStmt = caseNode.consequent[caseNode.consequent.length - 1];
                       // Simple check: If last statement is break, stop fall-through
                       // More robust check might involve analyzing the execution flow deeper
                       if (lastStmt.type === 'BreakStatement') {
                          fallThrough = false;
                          break; // Exit the loop processing cases
                       }
                    }
                } catch (e) {
                    if (e instanceof BreakSignal) {
                         fallThrough = false;
                         break; // Exit switch statement
                    }
                    if (e instanceof ContinueSignal) {
                         // Continue doesn't make sense directly in switch, treat like break?
                         // Or maybe it should continue to the next iteration of an outer loop?
                         // For simplicity, let's treat it like break within the switch.
                         fallThrough = false;
                         break;
                    }
                    throw e; // Re-throw other errors/returns
                }
            }
        }

         // Execute default case if no match or if fall-through reached it without a break
        if (defaultCase && (!matched || fallThrough)) {
             try {
                for (const stmt of defaultCase.consequent ?? []) {
                     this.evaluate(stmt, switchEnv);
                }
             } catch (e) {
                 if (e instanceof BreakSignal) {
                     // Break in default case exits the switch
                 } else {
                     throw e; // Re-throw others
                 }
             }
        }

        return undefined; // Switch statement itself doesn't evaluate to a value
    }


    // --- Helper Methods ---

    isTruthy(value: any): boolean {
        // Define DarijaScript truthiness rules (similar to JavaScript)
        return value !== false && value !== 0 && value !== '' && value !== null && value !== undefined; // and value !== NaN if you support it
    }

    formatValueForOutput(value: any): string {
        if (typeof value === 'string') {
            return value; // Keep strings as they are
        } else if (value === undefined) {
            return 'mchmcha';
        } else if (value === null) {
            return 'farkha';
        } else if (typeof value === 'object' && value !== null) {
            try {
                // Attempt to stringify objects, handle circular references if necessary
                // For basic display, JSON.stringify might be okay, but can fail
                return JSON.stringify(value);
            } catch {
                return '[Object]'; // Fallback for complex objects
            }
        }
        return String(value);
    }

     // Maps DarijaScript method names to their JavaScript counterparts
    mapDarijaMethodToJs(darijaMethod: string): string | null {
        const map: { [key: string]: string } = {
             'kbr7rf': 'toUpperCase',
             'sghr7rf': 'toLowerCase',
             'kayn': 'includes',
             'zid': 'push',
             '7yed': 'pop',
             '7yedmnlwla': 'shift',
             'zidfllwla': 'unshift',
             'dwr': 'map',
             'n9i': 'filter',
             'lfech': 'forEach',
             'l9a': 'find',
             'lmmaj': 'reduce',
             'mfatih': 'keys', // Special handling needed (Object.keys)
             'qiyam': 'values', // Special handling needed (Object.values)
             '3am': 'getFullYear',
             'chhr': 'getMonth',
             'nhar': 'getDate',
             // Add other mappings here
        };
        return map[darijaMethod] || null; // Return JS name or null if not found
    }

}


// --- Custom Classes for Control Flow ---

class ReturnValue {
    value: any;
    constructor(value: any) {
        this.value = value;
    }
}

class BreakSignal {}
class ContinueSignal {}

// --- Custom Class for DarijaScript Functions (Closures) ---
class DarijaScriptFunction {
    name: string;
    params: ASTNode[];
    body: ASTNode;
    closure: Environment; // The environment where the function was defined

    constructor(name: string, params: ASTNode[], body: ASTNode, closure: Environment) {
        this.name = name;
        this.params = params;
        this.body = body;
        this.closure = closure;
    }
     // This makes `typeof funcInstance === 'function'` return true in JS.
    // It doesn't actually make it callable directly without the interpreter context.
    get [Symbol.toStringTag]() {
        return 'Function';
    }
}

// --- Main interpret function ---

export function interpret(code: string): { output: string[], error?: string } {
  try {
    const tokens = tokenize(code);
    // console.log("Tokens:", tokens); // Optional: Log tokens
    const ast = parse(tokens);
    // console.log("AST:", JSON.stringify(ast, null, 2)); // Optional: Log AST

    if (ast.error) {
        return { output: [], error: ast.error };
    }

    const interpreter = new Interpreter(ast);
    const result = interpreter.interpret();

    // Check if the final result object indicates a runtime error occurred
    if (result && typeof result === 'object' && result.error) {
      // Error message is already in interpreter.output
      return { output: interpreter.output, error: result.error };
    }

    // Add the final result to output if it's not undefined and not an error object
    if (result !== undefined && !(result && typeof result === 'object' && result.error)) {
      // interpreter.output.push(interpreter.formatValueForOutput(result));
      // Decide if the final expression value should be automatically printed.
      // Often, IDEs only print explicit 'tbe3' output.
    }

    return { output: interpreter.output };

  } catch (e: any) {
    console.error("Interpreter Error:", e); // Log the full error for debugging
    // Ensure e.message exists and is a string
    const errorMessage = (e && typeof e.message === 'string') ? e.message : 'Erreur inconnue lors de l\'interprétation.';
    return { output: [], error: `Ghalat fel interpret: ${errorMessage}` };
  }
}
