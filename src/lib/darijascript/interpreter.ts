// DarijaScript Interpreter (Basic Implementation)

// --- Tokenizer ---
interface Token {
  type: string;
  value: string | number | boolean | null;
  line: number;
  column: number;
}

const KEYWORDS = ['tabit', 'bdl', 'ila', 'ella', 'wa9ila', 'douz', 'mnin', 'hta', 'dala', 'rj3'];
const BUILTINS = ['tba3']; // Built-in functions like console.log
const OPERATORS = ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!'];
const PUNCTUATION = ['(', ')', '{', '}', ';', ','];
const BOOLEANS = ['s7i7', 'ghalat']; // true, false

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let column = 1;
  let cursor = 0;

  while (cursor < code.length) {
    let char = code[cursor];

    // Skip whitespace
    if (/\s/.test(char)) {
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
      cursor++;
      continue;
    }

    // Skip comments (single line for now)
    if (char === '/' && code[cursor + 1] === '/') {
        while(code[cursor] !== '\n' && cursor < code.length) {
            cursor++;
            column++;
        }
        continue;
    }


    const startColumn = column;

    // Numbers
    if (/\d/.test(char)) {
      let numStr = '';
      while (/\d/.test(code[cursor])) {
        numStr += code[cursor];
        cursor++;
        column++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr), line, column: startColumn });
      continue;
    }

    // Strings (simple implementation with double quotes)
    if (char === '"') {
      let strValue = '';
      cursor++; // Skip opening quote
      column++;
      while (code[cursor] !== '"' && cursor < code.length) {
         // Handle escaped quotes (optional, add later if needed)
        strValue += code[cursor];
        cursor++;
        column++;
      }
       if (code[cursor] !== '"') {
           throw new Error(`[Ln ${line}, Col ${column}] String bla tkml ("")`); // Unterminated string
       }
      cursor++; // Skip closing quote
      column++;
      tokens.push({ type: 'STRING', value: strValue, line, column: startColumn });
      continue;
    }

    // Keywords, Identifiers, Booleans, Built-ins
    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (/[a-zA-Z0-9_]/.test(code[cursor]) && cursor < code.length) {
        word += code[cursor];
        cursor++;
        column++;
      }
      if (KEYWORDS.includes(word)) {
        tokens.push({ type: 'KEYWORD', value: word, line, column: startColumn });
      } else if (BUILTINS.includes(word)) {
          tokens.push({ type: 'BUILTIN', value: word, line, column: startColumn });
      } else if (BOOLEANS.includes(word)) {
          tokens.push({ type: 'BOOLEAN', value: word === 's7i7', line, column: startColumn });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn });
      }
      continue;
    }

    // Operators and Punctuation
     let potentialOp = '';
     let matchedOp = '';
     for (let i = 0; i < 3 && cursor + i < code.length; i++) { // Check up to 3 chars for operators like ===
         potentialOp += code[cursor + i];
         if (OPERATORS.includes(potentialOp) || PUNCTUATION.includes(potentialOp)) {
             matchedOp = potentialOp;
         }
     }

     if (matchedOp) {
         if (OPERATORS.includes(matchedOp)) {
            tokens.push({ type: 'OPERATOR', value: matchedOp, line, column: startColumn });
         } else if (PUNCTUATION.includes(matchedOp)) {
            tokens.push({ type: 'PUNCTUATION', value: matchedOp, line, column: startColumn });
         }
         cursor += matchedOp.length;
         column += matchedOp.length;
         continue;
     }


    // Unknown character
    throw new Error(`[Ln ${line}, Col ${column}] Harf ma3rftouch: '${char}'`); // Unknown character
  }

  tokens.push({ type: 'EOF', value: null, line, column }); // End of file token
  return tokens;
}


// --- Parser (Simplified AST) ---
// Note: This is a very basic parser for demonstration. A real parser would be more complex.
interface ASTNode {
    type: string;
    [key: string]: any; // Properties vary by node type
}

// Basic parser structure - needs significant expansion for full language features
function parse(tokens: Token[]): ASTNode[] {
    const ast: ASTNode[] = [];
    let current = 0;

    const peek = () => tokens[current];
    const previous = () => tokens[current - 1];
    const advance = () => {
        if (!isAtEnd()) current++;
        return previous();
    };
    const isAtEnd = () => peek().type === 'EOF';
    const check = (type: string) => !isAtEnd() && peek().type === type;
    const match = (...types: string[]) => {
        for (const type of types) {
            if (check(type)) {
                advance();
                return true;
            }
        }
        return false;
    };
    const consume = (type: string, message: string) => {
        if (check(type)) return advance();
        const token = peek();
        throw new Error(`[Ln ${token.line}, Col ${token.column}] ${message}. Kan tsnna '${type}' walakin l9it '${token.value}' (${token.type})`);
    }

    const parseExpression = (): ASTNode => {
        // Simplified: Parses basic literals and identifiers for now
        const token = advance();
        switch (token.type) {
            case 'NUMBER':
            case 'STRING':
            case 'BOOLEAN':
                return { type: 'Literal', value: token.value };
            case 'IDENTIFIER':
                return { type: 'Identifier', name: token.value };
            // Add more expression types (binary ops, function calls, etc.)
            default:
                throw new Error(`[Ln ${token.line}, Col ${token.column}] Ma fhmtch had l'expression: '${token.value}' (${token.type})`);
        }
    }

    const parseStatement = (): ASTNode | null => {
        const token = peek();
        if (match('KEYWORD')) {
            const keyword = previous().value;
            if (keyword === 'tabit' || keyword === 'bdl') {
                const identifier = consume('IDENTIFIER', "Khass smya dyal variable wra '" + keyword + "'");
                consume('OPERATOR', "Khass '=' wra smyt l variable")?.value === '=';
                const initializer = parseExpression();
                consume('PUNCTUATION', "Khass ';' f lekher dyal declaration")?.value === ';';
                return { type: 'VariableDeclaration', kind: keyword, identifier: identifier.value, initializer };
            }
            // Add parsing for other keywords (ila, douz, etc.)
        } else if (match('BUILTIN')) {
             const builtin = previous().value;
             if (builtin === 'tba3') {
                 consume('PUNCTUATION', "Khass '(' wra 'tba3'")?.value === '(';
                 const args = [];
                 if (peek().type !== 'PUNCTUATION' || peek().value !== ')') {
                     args.push(parseExpression());
                      while(match('PUNCTUATION') && previous().value === ',') {
                          args.push(parseExpression());
                      }
                 }
                 consume('PUNCTUATION', "Khass ')' f lekher dyal 'tba3'")?.value === ')';
                 consume('PUNCTUATION', "Khass ';' f lekher dyal 'tba3'")?.value === ';';
                 return { type: 'CallExpression', callee: { type: 'Identifier', name: builtin }, arguments: args };
             }
        }

        // Handle expression statements (like simple assignments or function calls if implemented)
         // if (token.type === 'IDENTIFIER' || token.type === 'NUMBER' || token.type === 'STRING') {
         //     const expr = parseExpression();
         //     consume('PUNCTUATION', "Khass ';' f lekher dyal l'instruction")?.value === ';';
         //     return { type: 'ExpressionStatement', expression: expr };
         // }

        // If no statement matched, advance and ignore (or throw error)
        if (!isAtEnd() && token.type !== 'EOF') {
           // console.warn(`Ignoring token: ${token.type} ${token.value}`);
           // advance();
           // return null; // Or throw error for stricter parsing
           throw new Error(`[Ln ${token.line}, Col ${token.column}] Ma fhmtch had l'instruction li bdat b '${token.value}' (${token.type})`);
        }
        return null; // Reached EOF or handled unknown token
    }


    while (!isAtEnd()) {
        try {
            const statement = parseStatement();
            if (statement) {
                ast.push(statement);
            }
        } catch (e: any) {
            // Error recovery (basic): skip to next potential statement start (e.g., ';')
            console.error("Parsing Error:", e.message);
             while (!isAtEnd() && peek().type !== 'PUNCTUATION' && peek().value !== ';') {
                 advance();
             }
             if (match('PUNCTUATION') && previous().value === ';') {
                 // Successfully skipped to the end of the likely problematic statement
             } else if (!isAtEnd()) {
                advance(); // Advance past the problematic token if no semicolon found
             }
             // For a real IDE, report the error without stopping the whole parse if possible
             // For this basic version, we'll re-throw to stop execution on first parse error
             throw e;
        }
    }

    return ast;
}


// --- Evaluator / Interpreter ---
class Environment {
    private values: Map<string, any> = new Map();
    private constants: Set<string> = new Set();
    private readonly enclosing: Environment | null;

    constructor(enclosing: Environment | null = null) {
        this.enclosing = enclosing;
    }

    define(name: string, value: any, isConstant: boolean) {
        if (this.values.has(name)) {
            // Allowing re-declaration with 'bdl' but not 'tabit' or changing type
             if (this.constants.has(name)) {
                throw new Error(`Ma ymknch tbedel l variable '${name}', rah tabit.`);
             }
             if(isConstant) {
                 throw new Error(`Ma ymknch t3awed t declarer variable '${name}' b 'tabit', rah déja kayn.`);
             }
        }
        this.values.set(name, value);
        if (isConstant) {
            this.constants.add(name);
        }
    }

    assign(name: string, value: any): any {
        if (this.values.has(name)) {
            if (this.constants.has(name)) {
                throw new Error(`Ma ymknch tbedel l variable '${name}', rah tabit.`);
            }
            this.values.set(name, value);
            return value;
        }

        if (this.enclosing !== null) {
            return this.enclosing.assign(name, value);
        }

        throw new Error(`Variable '${name}' ma declaritch 9bel.`); // Undefined variable
    }

    get(name: string): any {
        if (this.values.has(name)) {
            return this.values.get(name);
        }

        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }

        throw new Error(`Variable '${name}' ma declaritch.`); // Undefined variable
    }
}

function evaluate(node: ASTNode, env: Environment, outputCollector: string[]): any {
    switch (node.type) {
        case 'Literal':
            return node.value;

        case 'Identifier':
            return env.get(node.name);

        case 'VariableDeclaration': {
            const value = node.initializer ? evaluate(node.initializer, env, outputCollector) : undefined;
            env.define(node.identifier, value, node.kind === 'tabit');
            return value; // Or return undefined? Declaration doesn't typically evaluate to a value used elsewhere immediately
        }

        case 'CallExpression': {
            const callee = node.callee;
            if (callee.type === 'Identifier' && callee.name === 'tba3') {
                const args = node.arguments.map((arg: ASTNode) => evaluate(arg, env, outputCollector));
                 const outputString = args.map(arg => {
                     if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg); // Basic object/array printing
                     return String(arg);
                 }).join(' ');
                outputCollector.push(outputString);
                return undefined; // tba3 doesn't return a value
            }
            // Handle user-defined functions later
            throw new Error(`Ma fhmtch l function اولا l built-in '${callee.name}'`);
        }

         case 'BinaryExpression': { // Needs parsing logic first
             const left = evaluate(node.left, env, outputCollector);
             const right = evaluate(node.right, env, outputCollector);
             const op = node.operator;

             // Type checking
              const checkNumberOperands = () => {
                  if (typeof left !== 'number' || typeof right !== 'number') {
                      throw new Error(`Operands khasshom ykounou ar9am bach dir l'opération '${op}'. L9it: ${typeof left} o ${typeof right}`);
                  }
              }

             switch (op) {
                 case '+':
                     // Allow string concatenation
                     if (typeof left === 'string' || typeof right === 'string') {
                         return String(left) + String(right);
                     }
                     checkNumberOperands();
                     return left + right;
                 case '-':
                     checkNumberOperands();
                     return left - right;
                 case '*':
                     checkNumberOperands();
                     return left * right;
                 case '/':
                     checkNumberOperands();
                      if (right === 0) {
                          throw new Error(`Ma ymknch t9ssem 3la zero.`);
                      }
                     return left / right;
                 // Add comparison operators (==, !=, <, >, <=, >=)
                 // Add logical operators (&&, ||)
                 default:
                     throw new Error(`L'opérateur '${op}' mam3rofch.`);
             }
         }

        // Add cases for other AST node types (IfStatement, WhileStatement, etc.)

        default:
            throw new Error(`Ma 3rftch kifach n executer had node type: ${node.type}`);
    }
}

// --- Main Interpreter Function ---
interface InterpretationResult {
    output: string[];
    error: string | null;
}

export function interpret(code: string): InterpretationResult {
    const output: string[] = [];
    const globalEnv = new Environment();

    // Add any built-in constants or functions to the global environment here
    // e.g., globalEnv.define('PI', Math.PI, true);

    try {
        const tokens = tokenize(code);
        // console.log("Tokens:", tokens); // For debugging
        const ast = parse(tokens);
        // console.log("AST:", JSON.stringify(ast, null, 2)); // For debugging

        for (const statement of ast) {
            evaluate(statement, globalEnv, output);
        }
        return { output, error: null };
    } catch (e: any) {
        console.error("Interpretation Error:", e);
        return { output, error: e.message || "Kayn chi ghalat f code." };
    }
}
