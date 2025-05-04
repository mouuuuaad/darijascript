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
     // Check for multi-character operators first (e.g., '==', '>=')
     for (let len = 2; len >= 1; len--) {
         if (cursor + len <= code.length) {
             potentialOp = code.substring(cursor, cursor + len);
             if (OPERATORS.includes(potentialOp) || PUNCTUATION.includes(potentialOp)) {
                 matchedOp = potentialOp;
                 break; // Found the longest match
             }
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


// --- Parser (Recursive Descent) ---
// Grammar (Simplified):
// program     -> statement* EOF
// statement   -> declaration | expressionStatement | printStatement | blockStatement | ifStatement | whileStatement
// declaration -> ("tabit" | "bdl") IDENTIFIER "=" expression ";"
// printStatement -> "tba3" "(" arguments? ")" ";"
// expressionStatement -> expression ";"
// expression  -> term ( ( "+" | "-" ) term )*
// term        -> factor ( ( "*" | "/" ) factor )*
// factor      -> primary | unary
// unary       -> ( "!" | "-" ) factor // Not implemented yet
// primary     -> NUMBER | STRING | BOOLEAN | IDENTIFIER | "(" expression ")" | callExpression
// callExpression -> IDENTIFIER "(" arguments? ")" // Simplified for now
// arguments   -> expression ( "," expression )*

interface ASTNode {
    type: string;
    line: number; // For better error reporting during evaluation
    column: number; // For better error reporting during evaluation
    [key: string]: any; // Properties vary by node type
}

// Basic parser structure - needs significant expansion for full language features
function parse(tokens: Token[]): ASTNode[] {
    const ast: ASTNode[] = [];
    let current = 0;

    const peek = () => tokens[current];
    const previous = () => tokens[current - 1];
    const advance = (): Token => {
        if (!isAtEnd()) current++;
        return previous();
    };
    const isAtEnd = () => peek().type === 'EOF';
    const check = (type: string, value?: string | number | boolean | null) => {
        if (isAtEnd()) return false;
        const token = peek();
        return token.type === type && (value === undefined || token.value === value);
    };
    const match = (...types: string[]): boolean => {
        for (const type of types) {
            if (check(type)) {
                advance();
                return true;
            }
        }
        return false;
    };
     const matchOperator = (...values: string[]): boolean => {
        if(check('OPERATOR') && values.includes(peek().value as string)) {
            advance();
            return true;
        }
        return false;
     }
     const matchPunctuation = (...values: string[]): boolean => {
        if(check('PUNCTUATION') && values.includes(peek().value as string)) {
            advance();
            return true;
        }
        return false;
     }
    const consume = (type: string, message: string, value?: string | number | boolean | null): Token => {
        if (check(type, value)) return advance();
        const token = peek();
        let expected = `'${type}'`;
        if (value !== undefined) expected += ` with value '${value}'`;
        throw new Error(`[Ln ${token.line}, Col ${token.column}] ${message}. Kan tsnna ${expected} walakin l9it '${token.value}' (${token.type})`);
    }
    const error = (token: Token, message: string): Error => {
        return new Error(`[Ln ${token.line}, Col ${token.column}] Ghalat 3nd '${token.value}': ${message}`);
    }

    // --- Parsing Functions ---

    const parsePrimary = (): ASTNode => {
        const token = peek();
        if (match('NUMBER', 'STRING', 'BOOLEAN')) {
             const prev = previous();
            return { type: 'Literal', value: prev.value, line: prev.line, column: prev.column };
        }
        if (match('IDENTIFIER')) {
            const prev = previous();
            // Check if it's a function call
            // if (check('PUNCTUATION', '(')) {
            //     advance(); // Consume '('
            //     const args = [];
            //     if (!check('PUNCTUATION', ')')) {
            //         do {
            //             args.push(parseExpression());
            //         } while (matchPunctuation(','));
            //     }
            //     const closingParen = consume('PUNCTUATION', "Khass ')' wra l arguments dyal function call", ')');
            //     return { type: 'CallExpression', callee: { type: 'Identifier', name: prev.value, line: prev.line, column: prev.column }, arguments: args, line: prev.line, column: prev.column };
            // }
            // Otherwise, it's a variable identifier
            return { type: 'Identifier', name: prev.value, line: prev.line, column: prev.column };
        }
        if (matchPunctuation('(')) {
            const expr = parseExpression();
            consume('PUNCTUATION', "Khass ')' wra l'expression f groups", ')');
            return { type: 'Grouping', expression: expr, line: token.line, column: token.column }; // Grouping node might be useful
        }

        throw error(peek(), "Kan tsnna expression.");
    }

    const parseFactor = (): ASTNode => {
        // Add unary operators here if needed (-) (!)
        return parsePrimary();
    }

    const parseTerm = (): ASTNode => {
        let expr = parseFactor();
        const startToken = previous(); // Token that started this expression part

        while (matchOperator('*', '/')) {
            const operator = previous();
            const right = parseFactor();
            expr = { type: 'BinaryExpression', left: expr, operator: operator.value, right: right, line: startToken.line, column: startToken.column };
        }
        return expr;
    }

    const parseExpression = (): ASTNode => {
        let expr = parseTerm();
         const startToken = previous(); // Token that started this expression part

        while (matchOperator('+', '-')) {
            const operator = previous();
            const right = parseTerm();
            expr = { type: 'BinaryExpression', left: expr, operator: operator.value, right: right, line: startToken.line, column: startToken.column };
        }
        return expr;
    }

    const parseStatement = (): ASTNode | null => {
        const token = peek(); // For line/column info if needed
        if (match('KEYWORD')) {
            const keywordToken = previous();
            const keyword = keywordToken.value;
            if (keyword === 'tabit' || keyword === 'bdl') {
                const identifier = consume('IDENTIFIER', `Khass smya dyal variable wra '${keyword}'`);
                consume('OPERATOR', "Khass '=' wra smyt l variable", '=');
                const initializer = parseExpression();
                consume('PUNCTUATION', "Khass ';' f lekher dyal declaration", ';');
                return { type: 'VariableDeclaration', kind: keyword, identifier: identifier.value, initializer, line: keywordToken.line, column: keywordToken.column };
            }
            // Add parsing for other keywords (ila, douz, etc.) here
            throw error(keywordToken, `Keyword '${keyword}' mam supporitch f statements hna daba.`);
        }

        if (match('BUILTIN')) {
             const builtinToken = previous();
             const builtin = builtinToken.value;
             if (builtin === 'tba3') {
                 consume('PUNCTUATION', "Khass '(' wra 'tba3'", '(');
                 const args = [];
                 if (!check('PUNCTUATION', ')')) {
                     do {
                        // Ensure we parse the full expression for each argument
                        args.push(parseExpression());
                     } while (matchPunctuation(','));
                 }
                 consume('PUNCTUATION', "Khass ')' f lekher dyal l arguments dyal 'tba3'", ')');
                 consume('PUNCTUATION', "Khass ';' f lekher dyal l'instruction 'tba3'", ';');
                 return { type: 'CallExpression', callee: { type: 'Identifier', name: builtin, line: builtinToken.line, column: builtinToken.column }, arguments: args, line: builtinToken.line, column: builtinToken.column };
             }
             throw error(builtinToken, `Built-in '${builtin}' mam supporitch f statements hna daba.`);
        }

        // Handle expression statements (like assignments `a = 5;` or just `5;`)
         // Need assignment parsing first:
         // if (check('IDENTIFIER') && tokens[current + 1]?.type === 'OPERATOR' && tokens[current + 1]?.value === '=') { ... }

        // If it's none of the above, try parsing it as a standalone expression followed by a semicolon
        // This handles cases like `5 + 10;` (though often useless) or future function calls `myFunc();`
        try {
            const expr = parseExpression();
            consume('PUNCTUATION', "Khass ';' f lekher dyal l'instruction", ';');
            return { type: 'ExpressionStatement', expression: expr, line: token.line, column: token.column };
        } catch (e) {
            // If parsing expression failed, it wasn't a valid start of a statement
            // Rewind? Or rely on the main loop's error handling.
            // For now, let the error propagate from parseExpression or consume
             throw e;
        }

        // If no statement matched, it's an error unless EOF
        // if (!isAtEnd()) {
        //      throw error(peek(), "Ma fhmtch had l'instruction.");
        // }
        // return null;
    }


     const synchronize = () => {
        advance(); // Consume the token that caused the error

        while (!isAtEnd()) {
            if (previous().type === 'PUNCTUATION' && previous().value === ';') return; // Found end of a statement

            switch (peek().type) {
                case 'KEYWORD': // Keywords often start new statements
                     if (['tabit', 'bdl', 'ila', 'douz', 'mnin', 'dala', 'rj3'].includes(peek().value as string)) {
                         return;
                     }
                    break;
                 case 'BUILTIN':
                     if (['tba3'].includes(peek().value as string)) {
                          return;
                     }
                     break;
                // Add other potential statement starting points if needed
            }
            advance();
        }
    };


    while (!isAtEnd()) {
        try {
            const statement = parseStatement();
            if (statement) {
                ast.push(statement);
            }
        } catch (e: any) {
            // Error recovery: Log and attempt to synchronize
            console.error("Parsing Error:", e.message);
            // Report the error properly in an IDE context here
            synchronize();
            // For this basic interpreter, we'll stop parsing on the first error.
            // Remove the re-throw if you want to attempt parsing the rest of the file.
            throw e; // Re-throw to stop execution
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

    get(token: Token): any { // Pass token for error reporting
        const name = token.value as string;
        if (this.values.has(name)) {
            return this.values.get(name);
        }

        if (this.enclosing !== null) {
            return this.enclosing.get(token);
        }

        throw new Error(`[Ln ${token.line}, Col ${token.column}] Variable '${name}' ma declaritch.`); // Undefined variable
    }
}

// Helper to report runtime errors with line/column
function runtimeError(node: ASTNode, message: string): Error {
    return new Error(`[Ln ${node.line}, Col ${node.column}] Runtime Ghalat: ${message}`);
}


function evaluate(node: ASTNode, env: Environment, outputCollector: string[]): any {
    try {
        switch (node.type) {
            case 'Literal':
                return node.value;

            case 'Identifier': {
                 // We need the original token for error reporting if undefined
                 // The parser should ideally attach the token to the node or pass coords
                 // For now, create a placeholder token if coords are missing
                 const pseudoToken: Token = { type: 'IDENTIFIER', value: node.name, line: node.line ?? 0, column: node.column ?? 0 };
                return env.get(pseudoToken);
            }

            case 'Grouping':
                return evaluate(node.expression, env, outputCollector);


            case 'VariableDeclaration': {
                const value = node.initializer ? evaluate(node.initializer, env, outputCollector) : undefined;
                env.define(node.identifier, value, node.kind === 'tabit');
                return value; // Declaration evaluates to the assigned value (like JS)
            }

             case 'ExpressionStatement':
                return evaluate(node.expression, env, outputCollector); // Evaluate the expression, discard result

            case 'CallExpression': {
                const calleeNode = node.callee;
                // For now, only handle built-in 'tba3' called via Identifier
                if (calleeNode.type === 'Identifier' && calleeNode.name === 'tba3') {
                    const args = node.arguments.map((arg: ASTNode) => evaluate(arg, env, outputCollector));
                    const outputString = args.map(arg => {
                        if (arg === undefined) return 'undefined'; // Handle undefined explicitly
                        if (arg === null) return 'null';
                        if (typeof arg === 'object') {
                             try {
                                 return JSON.stringify(arg); // Basic object/array printing
                             } catch {
                                 return '[Object]'; // Handle circular or complex objects
                             }
                        }
                        return String(arg);
                    }).join(' ');
                    outputCollector.push(outputString);
                    return undefined; // tba3 doesn't return a value
                }
                 // Handle user-defined functions later
                 // const callee = evaluate(calleeNode, env, outputCollector); // Evaluate the callee expression
                 // if (typeof callee !== 'function') { // Or check for custom Function object type
                 //     throw runtimeError(calleeNode, "Kan tsnna function bach n 3iyto liha.");
                 // }
                 // const evaluatedArgs = node.arguments.map((arg: ASTNode) => evaluate(arg, env, outputCollector));
                 // Call the function: callee(...evaluatedArgs); - needs proper environment handling for closures

                throw runtimeError(calleeNode, `Ma ymknch t3iye6 l had l7aja '${calleeNode.name || node.type}', machi function.`);
            }

             case 'BinaryExpression': {
                 const left = evaluate(node.left, env, outputCollector);
                 const right = evaluate(node.right, env, outputCollector);
                 const op = node.operator;

                 // Type checking helper
                  const checkNumberOperands = () => {
                      if (typeof left !== 'number' || typeof right !== 'number') {
                          throw runtimeError(node, `Operands khasshom ykounou ar9am bach dir l'opération '${op}'. L9it: ${typeof left} o ${typeof right}`);
                      }
                  }

                 switch (op) {
                     case '+':
                         // Allow string concatenation or number addition
                         if (typeof left === 'string' || typeof right === 'string') {
                             return String(left) + String(right);
                         }
                          if (typeof left === 'number' && typeof right === 'number') {
                              return left + right;
                          }
                          throw runtimeError(node, `L'opération '+' kat khdem ghi m3a ar9am اولا strings. L9it: ${typeof left} o ${typeof right}`);
                     case '-':
                         checkNumberOperands();
                         return left - right;
                     case '*':
                         checkNumberOperands();
                         return left * right;
                     case '/':
                         checkNumberOperands();
                          if (right === 0) {
                              throw runtimeError(node, `Ma ymknch t9ssem 3la zero.`);
                          }
                         return left / right;
                     // Add comparison operators (==, !=, <, >, <=, >=)
                     case '==': return left === right; // Basic equality
                     case '!=': return left !== right;
                     case '<':
                         checkNumberOperands();
                         return left < right;
                     case '<=':
                         checkNumberOperands();
                         return left <= right;
                     case '>':
                         checkNumberOperands();
                         return left > right;
                     case '>=':
                         checkNumberOperands();
                         return left >= right;
                     // Add logical operators (&&, ||) - implement short-circuiting if needed
                     default:
                         throw runtimeError(node, `L'opérateur '${op}' mam3rofch.`);
                 }
             }

            // Add cases for other AST node types (IfStatement, WhileStatement, AssignmentExpression, etc.)

            default:
                throw new Error(`[Ln ${node.line}, Col ${node.column}] Ma 3rftch kifach n executer had node type: ${node.type}`);
        }
     } catch (error: any) {
        // If the error doesn't already have line/col, add them from the node
        if (error instanceof Error && !error.message.startsWith('[')) {
           throw runtimeError(node, error.message);
        }
        throw error; // Re-throw if it's already a runtimeError or parse error
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
        // Return the error message, potentially already formatted with line/col
        return { output, error: e.message || "Kayn chi ghalat f code." };
    }
}
