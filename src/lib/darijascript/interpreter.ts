
// DarijaScript Interpreter (Basic Implementation)

// --- Tokenizer ---
interface Token {
  type: string;
  value: string | number | boolean | null | undefined; // Added undefined
  line: number;
  column: number;
}

const KEYWORDS: Record<string, string> = {
  // Declarations & Scope
  'bdl': 'VARIABLE_DECLARATION', // let / var
  'tabit': 'CONSTANT_DECLARATION', // const
  'khdma': 'FUNCTION_DECLARATION', // function (alternative: dala)
  'dala': 'FUNCTION_DECLARATION', // function
  'rj3': 'RETURN', // return

  // Literals & Values
  's7i7': 'BOOLEAN_TRUE', // true
  'true': 'BOOLEAN_TRUE', // English true
  'ghalat': 'BOOLEAN_FALSE', // false (alternative: kdb)
  'kdb': 'BOOLEAN_FALSE', // false
  'false': 'BOOLEAN_FALSE', // English false
  'farkha': 'NULL', // null
  'null': 'NULL', // English null
  'mchmcha': 'UNDEFINED', // undefined
  'undefined': 'UNDEFINED', // English undefined
  'jdid': 'NEW', // new
  'hadi': 'THIS', // this

  // Operators & Types
  'no3': 'TYPEOF', // typeof

  // Control Flow
  'ila': 'IF', // if
  'ella': 'ELSE', // else
  'wa9ila': 'ELSE_IF', // else if
  'bdl3la': 'SWITCH', // switch
  '7ala': 'CASE', // case
  '3adi': 'DEFAULT', // default
  'douz': 'FOR', // for
  'madamt': 'WHILE', // while
  'dir': 'DO', // do...while
  'wa9f': 'BREAK', // break
  'kamml': 'CONTINUE', // continue

  // Error Handling
  'jrb': 'TRY', // try
  'msk': 'CATCH', // catch
  'fakhr': 'FINALLY', // finally

   // Loop Helpers (Potentially part of FOR syntax)
   'mnin': 'FOR_IN', // Potentially for 'for...in' or part of 'for' loop syntax 'mnin i=0 hta 5'
   'hta': 'FOR_TO', // Potentially 'to' in a for loop 'mnin i=0 hta 5'
};


const BUILTINS: Record<string, string> = {
    // Console & I/O
    'tbe3': 'CONSOLE_LOG', // console.log()
    'nadi': 'ALERT', // alert()
    'sowel': 'PROMPT', // prompt()
    'tsawal': 'CONFIRM', // confirm()
    'ghlat': 'CONSOLE_ERROR', // console.error()
    'nbehh': 'CONSOLE_WARN', // console.warn()

    // Math Functions
    't7t': 'MATH_FLOOR', // Math.floor()
    'fo9': 'MATH_CEIL', // Math.ceil()
    'dour': 'MATH_ROUND', // Math.round()
    'tsarraf': 'MATH_RANDOM', // Math.random()
    'kbar': 'MATH_MAX', // Math.max()
    'sghar': 'MATH_MIN', // Math.min()
    'mnfi': 'MATH_ABS', // Math.abs()
    'rf3': 'MATH_POW', // Math.pow()
    'jdr': 'MATH_SQRT', // Math.sqrt()

    // String Functions & Properties
    'ns': 'STRING_CONSTRUCTOR', // String()
    'kbr7rf': 'STRING_TOUPPERCASE', // .toUpperCase()
    'sghr7rf': 'STRING_TOLOWERCASE', // .toLowerCase()
    'kayn': 'ARRAY_INCLUDES', // .includes() (could be string or array)
    'twil': 'PROPERTY_LENGTH', // .length

    // Array Functions
    'zid': 'ARRAY_PUSH', // push()
    '7yed': 'ARRAY_POP', // pop()
    '7yedmnlwla': 'ARRAY_SHIFT', // shift()
    'zidfllwla': 'ARRAY_UNSHIFT', // unshift()
    'dwr': 'ARRAY_MAP', // map()
    'n9i': 'ARRAY_FILTER', // filter()
    'lfech': 'ARRAY_FOREACH', // forEach()
    'l9a': 'ARRAY_FIND', // find()
    'lmmaj': 'ARRAY_REDUCE', // reduce()

    // Object Functions
    'mfatih': 'OBJECT_KEYS', // Object.keys()
    'qiyam': 'OBJECT_VALUES', // Object.values()

    // Date Functions
    'daba': 'DATE_NOW', // Date.now()
    'wa9t': 'DATE_CONSTRUCTOR', // new Date()
    '3am': 'DATE_GETFULLYEAR', // getFullYear()
    'chhr': 'DATE_GETMONTH', // getMonth()
    'nhar': 'DATE_GETDATE', // getDate()

     // Timers
    'sta9': 'SET_TIMEOUT', // setTimeout()
    'krr': 'SET_INTERVAL', // setInterval()

    // Error Throwing
    'rmmi': 'THROW', // throw() - treated like a builtin function call
};

const OPERATORS = ['+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '.', '=>']; // Added ., =>, %
const PUNCTUATION = ['(', ')', '{', '}', '[', ']', ';', ',', ':']; // Added [], :,


function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let column = 1;
  let cursor = 0;

  while (cursor < code.length) {
    let char = code[cursor];
    const startColumn = column; // Capture column at the beginning of the token

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

    // Skip comments (single line)
    if (char === '/' && code[cursor + 1] === '/') {
        while(code[cursor] !== '\n' && cursor < code.length) {
            cursor++;
            column++;
        }
        continue;
    }
     // Skip block comments /* ... */ (basic, no nesting)
     if (char === '/' && code[cursor + 1] === '*') {
         cursor += 2; // Skip /*
         column += 2;
         while (!(code[cursor] === '*' && code[cursor + 1] === '/') && cursor < code.length) {
             if (code[cursor] === '\n') {
                 line++;
                 column = 1;
             } else {
                 column++;
             }
             cursor++;
         }
         if (code[cursor] === '*' && code[cursor + 1] === '/') {
             cursor += 2; // Skip */
             column += 2;
         } else {
              // Unterminated block comment - handle as error or ignore till EOF
              console.warn(`[Ln ${line}, Col ${startColumn}] Block comment bla tkml.`);
              // Decide whether to throw or just continue tokenizing rest of file
              // throw new Error(`[Ln ${line}, Col ${startColumn}] Block comment bla tkml.`);
         }
         continue;
     }


    // Numbers (integer and float)
    if (/\d/.test(char)) {
      let numStr = '';
      while (/\d/.test(code[cursor])) {
        numStr += code[cursor];
        cursor++;
        column++;
      }
       if (code[cursor] === '.' && /\d/.test(code[cursor + 1])) {
          numStr += '.';
          cursor++;
          column++;
          while (/\d/.test(code[cursor])) {
             numStr += code[cursor];
             cursor++;
             column++;
          }
       }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr), line, column: startColumn });
      continue;
    }

    // Strings (double quotes)
    if (char === '"') {
      let strValue = '';
      cursor++; // Skip opening quote
      column++;
      while (code[cursor] !== '"' && cursor < code.length) {
         // Handle escape sequences like \" or \\
         if (code[cursor] === '\\' && cursor + 1 < code.length) {
            strValue += code[cursor] + code[cursor+1]; // Add escaped char
            cursor += 2;
            column += 2;
         } else {
             strValue += code[cursor];
             cursor++;
             column++;
         }
      }
       if (code[cursor] !== '"') {
           throw new Error(`[Ln ${line}, Col ${column}] String bla tkml ("")`); // Unterminated string
       }
      cursor++; // Skip closing quote
      column++;
      tokens.push({ type: 'STRING', value: strValue, line, column: startColumn });
      continue;
    }
     // Strings (single quotes) - similar logic
     if (char === "'") {
       let strValue = '';
       cursor++; column++;
       while (code[cursor] !== "'" && cursor < code.length) {
          if (code[cursor] === '\\' && cursor + 1 < code.length) {
             strValue += code[cursor] + code[cursor+1];
             cursor += 2; column += 2;
          } else {
              strValue += code[cursor];
              cursor++; column++;
          }
       }
        if (code[cursor] !== "'") {
            throw new Error(`[Ln ${line}, Col ${column}] String bla tkml ('')`);
        }
       cursor++; column++;
       tokens.push({ type: 'STRING', value: strValue, line, column: startColumn });
       continue;
     }


    // Keywords, Identifiers, Built-ins, Literals
    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (/[a-zA-Z0-9_]/.test(code[cursor]) && cursor < code.length) {
        word += code[cursor];
        cursor++;
        column++;
      }

      if (KEYWORDS.hasOwnProperty(word)) {
          const tokenType = KEYWORDS[word];
          let tokenValue: any = word;
           if (tokenType === 'BOOLEAN_TRUE') tokenValue = true;
           else if (tokenType === 'BOOLEAN_FALSE') tokenValue = false;
           else if (tokenType === 'NULL') tokenValue = null;
           else if (tokenType === 'UNDEFINED') tokenValue = undefined;
           // Keep others as string representation of the keyword? Or specific type?
           // For now, use the keyword string itself as value for most, and specific values for literals
          tokens.push({ type: tokenType, value: tokenValue, line, column: startColumn });
      } else if (BUILTINS.hasOwnProperty(word)) {
          tokens.push({ type: 'BUILTIN_FUNCTION', value: word, line, column: startColumn }); // Or BUILTIN_IDENTIFIER if it can be other things
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word, line, column: startColumn });
      }
      continue;
    }

    // Operators and Punctuation
     let potentialMultiChar = '';
     let matchedToken = '';
     let tokenType = '';

     // Check for 3-char operators first (if any, e.g., '===', '!==')
     // ...

     // Check for 2-char operators (=>, ==, !=, <=, >=, &&, ||, ++, --, +=, etc.)
      if (cursor + 1 < code.length) {
          potentialMultiChar = char + code[cursor+1];
          if (OPERATORS.includes(potentialMultiChar)) {
              matchedToken = potentialMultiChar;
              tokenType = 'OPERATOR';
          } else if (PUNCTUATION.includes(potentialMultiChar)) {
              // Currently no 2-char punctuation
              // matchedToken = potentialMultiChar;
              // tokenType = 'PUNCTUATION';
          }
      }


     // If no 2-char matched, check for 1-char
     if (!matchedToken) {
         if (OPERATORS.includes(char)) {
             matchedToken = char;
             tokenType = 'OPERATOR';
         } else if (PUNCTUATION.includes(char)) {
             matchedToken = char;
             tokenType = 'PUNCTUATION';
         }
     }


     if (matchedToken) {
         tokens.push({ type: tokenType, value: matchedToken, line, column: startColumn });
         cursor += matchedToken.length;
         column += matchedToken.length;
         continue;
     }


    // Unknown character
    throw new Error(`[Ln ${line}, Col ${column}] Harf ma3rftouch: '${char}'`); // Unknown character
  }

  tokens.push({ type: 'EOF', value: null, line, column }); // End of file token
  return tokens;
}


// --- Parser (Recursive Descent) ---
// Grammar needs significant expansion based on DarijaScript features.
// program     -> statement* EOF
// statement   -> declaration | expressionStatement | printStatement | blockStatement | ifStatement | whileStatement | forStatement | functionDeclaration | tryStatement | returnStatement | breakStatement | continueStatement | throwStatement | ...
// declaration -> (CONSTANT_DECLARATION | VARIABLE_DECLARATION) IDENTIFIER ("=" expression)? ";"
// functionDeclaration -> FUNCTION_DECLARATION IDENTIFIER "(" parameters? ")" blockStatement
// parameters  -> IDENTIFIER ( "," IDENTIFIER )*
// blockStatement -> "{" statement* "}"
// ifStatement -> IF "(" expression ")" statement ( ELSE statement )?
// whileStatement -> WHILE "(" expression ")" statement
// doWhileStatement -> DO statement WHILE "(" expression ")" ";"
// forStatement -> FOR "(" (declaration | expression)? ";" expression? ";" expression? ")" statement
//               | FOR "(" IDENTIFIER "mnin" expression "hta" expression ")" statement // Custom loop
// tryStatement -> TRY blockStatement ( CATCH "(" IDENTIFIER ")" blockStatement )? ( FINALLY blockStatement )?
// returnStatement -> RETURN expression? ";"
// breakStatement -> BREAK ";"
// continueStatement -> CONTINUE ";"
// throwStatement -> THROW expression ";" // Assuming 'rmmi' acts like 'throw' keyword + expression
// printStatement -> BUILTIN_FUNCTION<tbe3> "(" arguments? ")" ";"
// expressionStatement -> expression ";"
// expression  -> assignment
// assignment  -> ( call "." )? IDENTIFIER "=" assignment | logicalOr // Simplified, needs proper left-hand side handling
// logicalOr   -> logicalAnd ( "||" logicalAnd )*
// logicalAnd  -> equality ( "&&" equality )*
// equality    -> comparison ( ( "!=" | "==" ) comparison )*
// comparison  -> term ( ( ">" | ">=" | "<" | "<=" ) term )*
// term        -> factor ( ( "-" | "+" ) factor )*
// factor      -> unary ( ( "/" | "*" | "%" ) unary )*
// unary       -> ( "!" | "-" ) unary | postfix
// postfix     -> primary ( "++" | "--" )?
// primary     -> NUMBER | STRING | BOOLEAN_TRUE | BOOLEAN_FALSE | NULL | UNDEFINED | THIS
//              | IDENTIFIER | "(" expression ")" | callExpression | memberExpression | newExpression | arrayLiteral | objectLiteral
// callExpression -> primary "(" arguments? ")"
// memberExpression -> primary ( "." IDENTIFIER | "[" expression "]" )
// newExpression -> NEW IDENTIFIER ("(" arguments? ")")?
// arrayLiteral -> "[" (expression ("," expression)* )? "]"
// objectLiteral -> "{" (property ("," property)* )? "}"
// property -> (IDENTIFIER | STRING) ":" expression
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

    const peek = (ahead = 0): Token => tokens[current + ahead];
    const previous = (): Token => tokens[current - 1];
    const advance = (): Token => {
        if (!isAtEnd()) current++;
        return previous();
    };
    const isAtEnd = (): boolean => peek().type === 'EOF';
    const check = (type: string, ahead = 0): boolean => {
        if (isAtEnd()) return false;
        return peek(ahead).type === type;
    };
    const checkValue = (type: string, value: string | number | boolean | null | undefined, ahead = 0): boolean => {
         if (isAtEnd()) return false;
         const token = peek(ahead);
         return token.type === type && token.value === value;
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
     const matchValue = (type: string, ...values: (string | number | boolean | null | undefined)[]): boolean => {
         for (const value of values) {
             if (checkValue(type, value)) {
                 advance();
                 return true;
             }
         }
         return false;
     };
     const consume = (type: string, message: string, value?: string | number | boolean | null | undefined): Token => {
         if (checkValue(type, value)) return advance(); // Use checkValue if value is provided
         if (value === undefined && check(type)) return advance(); // Use check if no value is provided

         const token = peek();
         let expected = `'${type}'`;
         if (value !== undefined) expected += ` b l value '${value}'`;
         throw new Error(`[Ln ${token.line}, Col ${token.column}] ${message}. Kan tsnna ${expected} walakin l9it '${token.value}' (${token.type})`);
     }
    const error = (token: Token, message: string): Error => {
        return new Error(`[Ln ${token.line}, Col ${token.column}] Ghalat 3nd '${token.value}': ${message}`);
    }

    // --- Parsing Functions (Placeholder - needs full implementation) ---

    const parsePrimary = (): ASTNode => {
        const token = peek();
        if (match('NUMBER', 'STRING', 'BOOLEAN_TRUE', 'BOOLEAN_FALSE', 'NULL', 'UNDEFINED')) {
             const prev = previous();
            return { type: 'Literal', value: prev.value, line: prev.line, column: prev.column };
        }
         if (match('THIS')) {
             const prev = previous();
             return { type: 'ThisExpression', line: prev.line, column: prev.column };
         }
        if (match('IDENTIFIER')) {
            const prev = previous();
            // Potential start of a call or member access
            return { type: 'Identifier', name: prev.value, line: prev.line, column: prev.column };
        }
        if (matchValue('PUNCTUATION','(')) {
            const expr = parseExpression();
            consume('PUNCTUATION', "Khass ')' wra l'expression f groups", ')');
            return { type: 'Grouping', expression: expr, line: token.line, column: token.column };
        }
         if (matchValue('PUNCTUATION','[')) {
            // Parse Array Literal
            // ... implementation needed ...
            const elements = [];
             if (!checkValue('PUNCTUATION', ']')) {
                 do {
                     elements.push(parseExpression());
                 } while (matchValue('PUNCTUATION', ','));
             }
            consume('PUNCTUATION', "Khass ']' f lekher dyal array literal", ']');
            return { type: 'ArrayLiteral', elements, line: token.line, column: token.column };
         }
        if (matchValue('PUNCTUATION','{')) {
           // Parse Object Literal
           // ... implementation needed ...
            const properties = [];
            if (!checkValue('PUNCTUATION', '}')) {
                do {
                    const keyToken = advance(); // Expect IDENTIFIER or STRING
                    let key;
                    if(keyToken.type === 'IDENTIFIER' || keyToken.type === 'STRING'){
                        key = { type: 'Literal', value: keyToken.value, line: keyToken.line, column: keyToken.column };
                    } else {
                        throw error(keyToken, "Khass smya (identifier awla string) dyal property f object literal.");
                    }
                    consume('PUNCTUATION', "Khass ':' bin smya o l value dyal property", ':');
                    const value = parseExpression();
                    properties.push({ type: 'Property', key, value, line: keyToken.line, column: keyToken.column });
                } while (matchValue('PUNCTUATION', ','));
            }
           consume('PUNCTUATION', "Khass '}' f lekher dyal object literal", '}');
           return { type: 'ObjectLiteral', properties, line: token.line, column: token.column };
        }


        // Handle built-in calls like tbe3(), ns(), etc. as potential primary if they are followed by '('
        if (check('BUILTIN_FUNCTION') && checkValue('PUNCTUATION','(', 1)) {
           const calleeToken = advance(); // Consume the builtin name
           consume('PUNCTUATION', `Khass '(' wra '${calleeToken.value}'`, '(');
           const args = parseArguments();
           consume('PUNCTUATION', `Khass ')' f lekher dyal l arguments dyal '${calleeToken.value}'`, ')');
            // Need to decide if this is just CallExpression or a specific BuiltinCallExpression
           return { type: 'CallExpression', callee: { type: 'Identifier', name: calleeToken.value, line: calleeToken.line, column: calleeToken.column }, arguments: args, line: calleeToken.line, column: calleeToken.column };
        }
        // Handle 'rmmi' (throw) - might be a statement or expression depending on language design
         if (checkValue('BUILTIN_FUNCTION', 'rmmi')) {
             const throwToken = advance();
             const argument = parseExpression(); // Throw needs an expression
              // In many languages, throw is a statement, not an expression.
              // If DarijaScript allows `x = rmmi("error");`, it's an expression.
              // If only `rmmi("error");` is allowed, it should be parsed in parseStatement.
              // Assuming it's like a function call for now.
              return { type: 'CallExpression', callee: { type: 'Identifier', name: throwToken.value, line: throwToken.line, column: throwToken.column }, arguments: [argument], line: throwToken.line, column: throwToken.column };
         }


        throw error(peek(), "Kan tsnna expression (ra9m, string, variable, ...).");
    }

    const parseArguments = (): ASTNode[] => {
        const args = [];
         if (!checkValue('PUNCTUATION', ')')) {
            do {
                // Add check for spread operator (...) if supported
                args.push(parseExpression());
            } while (matchValue('PUNCTUATION', ','));
        }
        return args;
    }

     const finishCall = (callee: ASTNode): ASTNode => {
         const args = parseArguments();
         const closingParen = consume('PUNCTUATION', "Khass ')' wra l arguments dyal function call", ')');
         return { type: 'CallExpression', callee, arguments: args, line: callee.line, column: callee.column }; // Use callee's line/col
     };

    const parsePostfix = (): ASTNode => {
        let expr = parsePrimary();

        while (true) {
             if (matchValue('PUNCTUATION','(')) { // Function Call
                 expr = finishCall(expr);
             } else if (matchValue('OPERATOR','.')) { // Member Access .
                 const name = consume('IDENTIFIER', "Khass smya dyal property wra '.'");
                 expr = { type: 'MemberExpression', object: expr, property: { type: 'Identifier', name: name.value, line: name.line, column: name.column }, computed: false, line: expr.line, column: expr.column };
             } else if (matchValue('PUNCTUATION','[')) { // Member Access []
                 const index = parseExpression();
                 consume('PUNCTUATION', "Khass ']' wra l'index", ']');
                 expr = { type: 'MemberExpression', object: expr, property: index, computed: true, line: expr.line, column: expr.column };
             } else if (matchValue('OPERATOR','++') || matchValue('OPERATOR','--')) {
                const operator = previous();
                // In JS, postfix ++/-- has lower precedence than calls/members
                // but let's keep it simple for now.
                expr = { type: 'UpdateExpression', operator: operator.value, argument: expr, prefix: false, line: expr.line, column: expr.column };
             }
             else {
                 break;
             }
        }
        return expr;
    };


    const parseUnary = (): ASTNode => {
        if (matchValue('OPERATOR', '!', '-')) {
            const operator = previous();
            const right = parseUnary(); // Unary operators can chain (e.g., !-x)
            return { type: 'UnaryExpression', operator: operator.value, right: right, prefix: true, line: operator.line, column: operator.column };
        }
        // Handle prefix ++ and -- if needed
        // if (matchValue('OPERATOR', '++', '--')) { ... }

        return parsePostfix();
    };


    const parseFactor = (): ASTNode => {
        let expr = parseUnary();
        const startTokenPos = { line: previous().line, column: previous().column }; // Approx start

        while (matchValue('OPERATOR', '*', '/', '%')) {
            const operator = previous();
            const right = parseUnary();
            expr = { type: 'BinaryExpression', left: expr, operator: operator.value, right: right, line: startTokenPos.line, column: startTokenPos.column };
        }
        return expr;
    }

    const parseTerm = (): ASTNode => {
        let expr = parseFactor();
         const startTokenPos = { line: previous().line, column: previous().column }; // Approx start

        while (matchValue('OPERATOR', '+', '-')) {
            const operator = previous();
            const right = parseFactor();
            expr = { type: 'BinaryExpression', left: expr, operator: operator.value, right: right, line: startTokenPos.line, column: startTokenPos.column };
        }
        return expr;
    }

    const parseComparison = (): ASTNode => {
       let expr = parseTerm();
        const startTokenPos = { line: previous().line, column: previous().column }; // Approx start

       while (matchValue('OPERATOR', '>', '>=', '<', '<=')) {
           const operator = previous();
           const right = parseTerm();
           expr = { type: 'BinaryExpression', left: expr, operator: operator.value, right: right, line: startTokenPos.line, column: startTokenPos.column };
       }
       return expr;
    };

     const parseEquality = (): ASTNode => {
         let expr = parseComparison();
         const startTokenPos = { line: previous().line, column: previous().column }; // Approx start

         while (matchValue('OPERATOR', '!=', '==')) { // Add ===, !== if needed
             const operator = previous();
             const right = parseComparison();
             expr = { type: 'LogicalExpression', left: expr, operator: operator.value, right: right, line: startTokenPos.line, column: startTokenPos.column }; // Note: Often BinaryExpression, but Logical makes sense too
         }
         return expr;
     };

     const parseLogicalAnd = (): ASTNode => {
         let expr = parseEquality();
         const startTokenPos = { line: previous().line, column: previous().column };

         while (matchValue('OPERATOR', '&&')) {
             const operator = previous();
             const right = parseEquality();
             expr = { type: 'LogicalExpression', left: expr, operator: operator.value, right: right, line: startTokenPos.line, column: startTokenPos.column };
         }
         return expr;
     };

      const parseLogicalOr = (): ASTNode => {
          let expr = parseLogicalAnd();
          const startTokenPos = { line: previous().line, column: previous().column };

          while (matchValue('OPERATOR', '||')) {
              const operator = previous();
              const right = parseLogicalAnd();
              expr = { type: 'LogicalExpression', left: expr, operator: operator.value, right: right, line: startTokenPos.line, column: startTokenPos.column };
          }
          return expr;
      };

       const parseAssignment = (): ASTNode => {
           const expr = parseLogicalOr(); // Parse potential left-hand side

           if (matchValue('OPERATOR', '=')) { // Simple assignment
               const equals = previous();
               const value = parseAssignment(); // Right-associativity: a = b = 5

               // Check if left-hand side is a valid target (Identifier or MemberExpression)
               if (expr.type === 'Identifier') {
                   return { type: 'AssignmentExpression', operator: '=', left: expr, right: value, line: equals.line, column: equals.column };
               } else if (expr.type === 'MemberExpression') {
                   return { type: 'AssignmentExpression', operator: '=', left: expr, right: value, line: equals.line, column: equals.column };
               }
               // Add checks for other valid assignment targets if needed

               throw error(equals, "Lmouhtar dyal l assignment ma shihesh."); // Invalid assignment target
           }
            // Handle compound assignment (+=, -=, etc.)
             else if (matchValue('OPERATOR', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '|=', '^=')) {
                 const operator = previous();
                 const value = parseAssignment();
                 if (expr.type === 'Identifier' || expr.type === 'MemberExpression') {
                     return { type: 'AssignmentExpression', operator: operator.value, left: expr, right: value, line: operator.line, column: operator.column };
                 }
                 throw error(operator, "Lmouhtar dyal l assignment ma shihesh.");
             }


           return expr; // Not an assignment, just return the expression parsed
       };


    const parseExpression = (): ASTNode => {
        return parseAssignment(); // Start parsing from the lowest precedence (assignment)
    }


    const parseBlock = (): ASTNode[] => {
        const statements: ASTNode[] = [];
        while (!checkValue('PUNCTUATION', '}') && !isAtEnd()) {
            const stmt = parseStatement();
            if (stmt) statements.push(stmt);
        }
        consume('PUNCTUATION', "Khass '}' f lekher dyal l block.", '}');
        return statements;
    }


    const parseStatement = (): ASTNode | null => {
        const token = peek(); // For line/column info if needed

        // --- Control Flow & Blocks ---
        if (match('IF')) {
            const ifToken = previous();
            consume('PUNCTUATION', "Khass '(' wra 'ila'", '(');
            const condition = parseExpression();
            consume('PUNCTUATION', "Khass ')' wra condition dyal 'ila'", ')');
            const thenBranch = parseStatement(); // Can be single statement or block
            let elseBranch = null;
            if (match('ELSE')) {
                elseBranch = parseStatement();
            }
            // Add 'wa9ila' (else if) handling here if needed, requires more lookahead or different structure
            return { type: 'IfStatement', condition, thenBranch, elseBranch, line: ifToken.line, column: ifToken.column };
        }
        if (match('WHILE')) {
            const whileToken = previous();
            consume('PUNCTUATION', "Khass '(' wra 'madamt'", '(');
            const condition = parseExpression();
            consume('PUNCTUATION', "Khass ')' wra condition dyal 'madamt'", ')');
            const body = parseStatement();
            return { type: 'WhileStatement', condition, body, line: whileToken.line, column: whileToken.column };
        }
        if (match('DO')) {
            const doToken = previous();
            const body = parseStatement();
            consume('WHILE', "Khass 'madamt' wra l body dyal 'dir'", 'madamt');
            consume('PUNCTUATION', "Khass '(' wra 'madamt' f do-while", '(');
            const condition = parseExpression();
            consume('PUNCTUATION', "Khass ')' wra condition dyal do-while", ')');
            consume('PUNCTUATION', "Khass ';' f lekher dyal do-while", ';');
             return { type: 'DoWhileStatement', condition, body, line: doToken.line, column: doToken.column };
        }
        if (match('FOR')) { // Needs more complex parsing for C-style and potentially custom loops
             const forToken = previous();
             consume('PUNCTUATION', "Khass '(' wra 'douz'", '(');

             // Placeholder for C-style loop: for (init; cond; update)
             // Placeholder for custom 'mnin i=0 hta 5' style loop
             // This requires more robust parsing logic based on DarijaScript's specific syntax

             // Simplistic placeholder assuming expression statements for now
             let initializer = null;
             if (!checkValue('PUNCTUATION', ';')) {
                 if (match('VARIABLE_DECLARATION', 'CONSTANT_DECLARATION')) {
                     // Parse full declaration (reuse declaration logic)
                     // initializer = parseVariableDeclaration(); // Needs to be adapted
                      const kindToken = previous();
                      const identifier = consume('IDENTIFIER', `Khass smya dyal variable wra '${kindToken.value}'`);
                      let initExpr = null;
                       if (matchValue('OPERATOR', '=')) {
                           initExpr = parseExpression();
                       }
                      initializer = { type: 'VariableDeclaration', kind: kindToken.value, identifier: identifier.value, initializer: initExpr, line: kindToken.line, column: kindToken.column, isForLoopInit: true };

                 } else {
                      initializer = parseExpression(); // Assume expression
                 }
             }
              consume('PUNCTUATION', "Khass ';' wra l'initializer f loop 'douz'", ';');

              let condition = null;
              if (!checkValue('PUNCTUATION', ';')) {
                  condition = parseExpression();
              }
             consume('PUNCTUATION', "Khass ';' wra condition f loop 'douz'", ';');

             let increment = null;
             if (!checkValue('PUNCTUATION', ')')) {
                 increment = parseExpression();
             }
             consume('PUNCTUATION', "Khass ')' wra l parts dyal loop 'douz'", ')');
             const body = parseStatement();

             return { type: 'ForStatement', initializer, condition, increment, body, line: forToken.line, column: forToken.column };
        }
        if (matchValue('PUNCTUATION', '{')) {
            const blockToken = previous();
            const body = parseBlock();
            return { type: 'BlockStatement', body, line: blockToken.line, column: blockToken.column };
        }
        if (match('TRY')) {
             const tryToken = previous();
             const tryBlock = parseStatement(); // Should be block
             let catchClause = null;
             let finallyBlock = null;
             if (match('CATCH')) {
                 consume('PUNCTUATION', "Khass '(' wra 'msk'", '(');
                 const param = consume('IDENTIFIER', "Khass smya l error variable f 'msk'");
                 consume('PUNCTUATION', "Khass ')' wra l variable dyal 'msk'", ')');
                 const catchBlock = parseStatement(); // Should be block
                 catchClause = { type: 'CatchClause', param: { type: 'Identifier', name: param.value, line: param.line, column: param.column }, body: catchBlock, line: param.line, column: param.column } // Line/col approximate
             }
              if (match('FINALLY')) {
                  finallyBlock = parseStatement(); // Should be block
              }
              if (!catchClause && !finallyBlock) {
                  throw error(tryToken, "Khass 'msk' awla 'fakhr' wra 'jrb'");
              }
              return { type: 'TryStatement', block: tryBlock, handler: catchClause, finalizer: finallyBlock, line: tryToken.line, column: tryToken.column };
        }


        // --- Declarations & Return ---
        if (match('CONSTANT_DECLARATION', 'VARIABLE_DECLARATION')) {
            const kindToken = previous();
            const kind = kindToken.value;
            const identifier = consume('IDENTIFIER', `Khass smya dyal variable wra '${kind}'`);
            let initializer = null;
            if (matchValue('OPERATOR', '=')) {
                 initializer = parseExpression();
            }
            consume('PUNCTUATION', `Khass ';' f lekher dyal declaration dyal '${kind}'`, ';');
            return { type: 'VariableDeclaration', kind, identifier: identifier.value, initializer, line: kindToken.line, column: kindToken.column };
        }
        if (match('FUNCTION_DECLARATION')) {
            const funcToken = previous();
            const name = consume('IDENTIFIER', "Khass smya dyal function wra 'dala'/'khdma'");
            consume('PUNCTUATION', "Khass '(' wra smyt function", '(');
            const params = [];
            if (!checkValue('PUNCTUATION', ')')) {
                do {
                    params.push(consume('IDENTIFIER', "Khass smya dyal parameter"));
                } while (matchValue('PUNCTUATION', ','));
            }
            consume('PUNCTUATION', "Khass ')' wra parameters", ')');
            consume('PUNCTUATION', "Khass '{' bach tbda l body dyal function", '{');
            const body = parseBlock(); // Re-use block parsing
            return { type: 'FunctionDeclaration', id: { type: 'Identifier', name: name.value, line: name.line, column: name.column }, params: params.map(p => ({type: 'Identifier', name: p.value, line: p.line, column: p.column})), body: { type: 'BlockStatement', body, line: name.line, column: name.column+1 }, line: funcToken.line, column: funcToken.column };
        }
        if (match('RETURN')) {
            const returnToken = previous();
            let argument = null;
            if (!checkValue('PUNCTUATION', ';')) { // Return can have an optional expression
                argument = parseExpression();
            }
            consume('PUNCTUATION', "Khass ';' f lekher dyal 'rj3'", ';');
            return { type: 'ReturnStatement', argument, line: returnToken.line, column: returnToken.column };
        }

        // --- Loop Control & Throw ---
        if (match('BREAK')) {
            const breakToken = previous();
            consume('PUNCTUATION', "Khass ';' wra 'wa9f'", ';');
            return { type: 'BreakStatement', line: breakToken.line, column: breakToken.column };
        }
        if (match('CONTINUE')) {
             const continueToken = previous();
             consume('PUNCTUATION', "Khass ';' wra 'kamml'", ';');
             return { type: 'ContinueStatement', line: continueToken.line, column: continueToken.column };
        }
         // Handle 'rmmi' (throw) as a statement
         if (checkValue('BUILTIN_FUNCTION', 'rmmi') && !checkValue('PUNCTUATION','(', 1)) {
             // If 'rmmi' is followed by an expression but not '(', treat it as throw statement
             const throwToken = advance();
             const argument = parseExpression();
             consume('PUNCTUATION', "Khass ';' f lekher dyal 'rmmi'", ';');
             return { type: 'ThrowStatement', argument, line: throwToken.line, column: throwToken.column };
         }


        // --- Expression Statement ---
        // If none of the above matched, try parsing as an expression statement.
        // This handles assignments (`a = 5;`), function calls (`tbe3('hi');`), etc.
        try {
            const expr = parseExpression();
            consume('PUNCTUATION', "Khass ';' f lekher dyal l'instruction", ';');
            return { type: 'ExpressionStatement', expression: expr, line: token.line, column: token.column };
        } catch (e: any) {
            // If parsing expression failed AND we haven't matched any other statement type,
            // it's likely an error at the current token.
             if (!isAtEnd() && current === tokens.indexOf(token)) { // Check if 'current' advanced
                 throw error(peek(), "Ma fhmtch had l'instruction.");
             } else {
                 throw e; // Re-throw error from deeper parsing levels
             }
        }
    }


     const synchronize = () => {
        advance(); // Consume the token that caused the error

        while (!isAtEnd()) {
            if (previous().type === 'PUNCTUATION' && previous().value === ';') return; // Found end of a statement

            // Check for tokens that typically start a new statement
            switch (peek().type) {
                 case 'CONSTANT_DECLARATION':
                 case 'VARIABLE_DECLARATION':
                 case 'FUNCTION_DECLARATION':
                 case 'IF':
                 case 'WHILE':
                 case 'DO':
                 case 'FOR':
                 case 'RETURN':
                 case 'BREAK':
                 case 'CONTINUE':
                 case 'TRY':
                 case 'SWITCH':
                 // Add other statement-starting keywords/builtins
                     return;
                case 'PUNCTUATION':
                    if (peek().value === '{') return; // Start of a block often indicates new scope/statement
                    break;
                 case 'BUILTIN_FUNCTION': // Builtins like tbe3 might start a statement
                      if (!checkValue('PUNCTUATION', '(', 1)) { // If not followed by '(', likely a statement like rmmi expr;
                          return;
                      }
                      // Otherwise, it might be part of an expression, continue synchronizing
                      break;
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
            console.error("Parsing Error:", e.message);
            // Report the error properly
            synchronize(); // Attempt to recover and parse the rest
            // In a simple interpreter, maybe stop on first error:
            // throw e;
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
             if (this.constants.has(name)) {
                throw new Error(`Ma ymknch tbedel l variable '${name}', rah tabit.`);
             }
             if(isConstant && !this.constants.has(name)) { // Trying to declare const over existing let/var
                 throw new Error(`Ma ymknch t3awed t declarer variable '${name}' b 'tabit', rah déja kayn.`);
             }
             // Allow re-declaring 'bdl' over existing 'bdl' (shadowing in same scope not ideal, but common in JS)
              console.warn(`Warning: Variable '${name}' is already declared in this scope.`);
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

     // Assign value at a specific environment distance (for closures)
     assignAt(distance: number, name: string, value: any): any {
         this.ancestor(distance).assign(name, value); // No need for error checking, resolver ensures it exists
     }


    get(token: Token): any { // Pass token for error reporting
        const name = token.value as string;
        if (this.values.has(name)) {
            return this.values.get(name);
        }

        if (this.enclosing !== null) {
            // Look up in enclosing environments
            // This doesn't handle proper lexical scope resolution for closures yet.
            // A resolver pass would be needed to determine the scope depth.
            // For now, basic chain lookup.
            return this.enclosing.get(token);
        }

        throw runtimeError(token, `Variable '${name}' ma declaritch.`); // Undefined variable
    }

     // Get value from a specific environment distance (for closures)
     getAt(distance: number, name: string): any {
         // Simplified: assumes ancestor(distance) correctly finds the environment.
         // Real implementation might use a direct link stored by the resolver.
         return this.ancestor(distance).values.get(name);
     }

      // Helper to find an ancestor environment
      ancestor(distance: number): Environment {
          let environment: Environment = this;
          for (let i = 0; i < distance; i++) {
              if (!environment.enclosing) {
                  // This should not happen if the resolver worked correctly
                  throw new Error("Resolver error: Invalid scope distance.");
              }
              environment = environment.enclosing;
          }
          return environment;
      }
}

// --- Callable Interface/Class ---
interface DarijaCallable {
    arity(): number; // Number of expected arguments
    call(interpreter: Interpreter, args: any[], callToken?: Token): any; // Pass interpreter for context, token for errors
}

// --- Darija Function Class ---
class DarijaFunction implements DarijaCallable {
     constructor(private readonly declaration: ASTNode, private readonly closure: Environment) {} // Capture closure

     arity(): number {
         return this.declaration.params.length;
     }

     call(interpreter: Interpreter, args: any[], callToken?: Token): any {
          // Create a new environment for the function execution, enclosing the closure
          const environment = new Environment(this.closure);

          // Bind arguments to parameters
          for (let i = 0; i < this.declaration.params.length; i++) {
              environment.define(this.declaration.params[i].name, args[i], false); // Parameters are like 'bdl'
          }


           // Execute the function body
           try {
                interpreter.executeBlock(this.declaration.body.body, environment); // Pass the new environment
           } catch (returnValue) {
               // Handle 'return' exception
                if (returnValue instanceof ReturnValue) {
                   return returnValue.value;
                }
                throw returnValue; // Re-throw other errors
           }

          // Implicit return undefined if no return statement was hit
          return undefined; // Or should it be 'mchmcha'? Consistent literal handling needed.
     }

     toString(): string {
         return `<dala ${this.declaration.id.name}>`;
     }
}

// --- Custom Exception for Return Values ---
class ReturnValue extends Error {
    constructor(public readonly value: any) {
        super("Return value"); // Message is not typically shown
        this.name = "ReturnValue";
    }
}


// Helper to report runtime errors with line/column from AST Node
function runtimeError(node: ASTNode | Token, message: string): Error {
    const line = node?.line ?? '?';
    const col = node?.column ?? '?';
    let context = '';
     if ('type' in node && node.type !== 'Literal' && node.value !== undefined && typeof node.value === 'string') {
        context = ` 3nd '${node.value}'`;
     } else if ('name' in node && typeof node.name === 'string') {
         context = ` 3nd '${node.name}'`;
     }
    return new Error(`[Ln ${line}, Col ${col}] Runtime Ghalat${context}: ${message}`);
}

// --- Interpreter Class ---
class Interpreter {
     public readonly globals = new Environment();
     private environment = this.globals;
     private outputCollector: string[] = []; // Store output here

     constructor() {
         // Define native/built-in functions and constants
         this.globals.define('tbe3', new class implements DarijaCallable {
             arity() { return Infinity; } // Variable arguments
             call(interpreter: Interpreter, args: any[]): any {
                 interpreter.outputCollector.push(args.map(arg => interpreter.stringify(arg)).join(' '));
                 return undefined; // tbe3 returns nothing
             }
             toString() { return "<native dala tbe3>"; }
         }(), true); // true = constant

          this.globals.define('daba', new class implements DarijaCallable {
              arity() { return 0; }
              call(): any { return Date.now(); }
              toString() { return "<native dala daba>"; }
          }(), true);

         // Define other builtins (nadi, sowel, Math functions, etc.) here
         // Example: Math.random -> tsarraf
         this.globals.define('tsarraf', new class implements DarijaCallable {
              arity() { return 0; }
              call(): any { return Math.random(); }
              toString() { return "<native dala tsarraf>"; }
          }(), true);

         // Example: console.error -> ghlat
          this.globals.define('ghlat', new class implements DarijaCallable {
              arity() { return Infinity; }
              call(interpreter: Interpreter, args: any[], callToken?: Token): any {
                   const errorMessage = args.map(arg => interpreter.stringify(arg)).join(' ');
                   // In a real app, you might write to stderr or a dedicated error log
                   interpreter.outputCollector.push(`GHALAT: ${errorMessage}`);
                   console.error(...args); // Also log to actual console.error
                   return undefined;
              }
              toString() { return "<native dala ghlat>"; }
          }(), true);

         // Example: String constructor -> ns
         this.globals.define('ns', new class implements DarijaCallable {
              arity() { return 1; } // String() takes one optional arg
              call(interpreter: Interpreter, args: any[]): any {
                  return interpreter.stringify(args.length > 0 ? args[0] : '');
              }
              toString() { return "<native dala ns>"; }
          }(), true);

           // Define 'undefined' and 'null' as global constants
            this.globals.define('mchmcha', undefined, true);
            this.globals.define('farkha', null, true);
            this.globals.define('undefined', undefined, true); // Allow English keyword too
            this.globals.define('null', null, true); // Allow English keyword too

     }

     interpret(statements: ASTNode[]): { output: string[], error: string | null } {
         this.outputCollector = []; // Reset output for each run
         try {
             for (const statement of statements) {
                 this.execute(statement);
             }
             return { output: this.outputCollector, error: null };
         } catch (error: any) {
             // console.error("Interpretation Error:", error);
             // Return the error message, hopefully formatted with line/col
              return { output: this.outputCollector, error: error.message || "Kayn chi ghalat f code." };
         }
     }

     // Stringify for output (like console.log)
      stringify(value: any): string {
         if (value === null) return "farkha"; // Use Darija literal for null
         if (value === undefined) return "mchmcha"; // Use Darija literal for undefined
         if (typeof value === 'number' && isNaN(value)) return "NaN"; // Handle NaN
         if (typeof value === 'number' && !isFinite(value)) return value > 0 ? "Infinity" : "-Infinity"; // Handle Infinity
         if (typeof value === 'function' || typeof value?.call === 'function') {
             // For DarijaFunction or native callables
             if (value.toString) return value.toString();
             return "<dala>";
         }
         if (typeof value === 'object') {
             // Basic object/array printing, could be improved
             try {
                 // Detect circular references? Not easily without tracking visited objects.
                 // Simple JSON stringify is often good enough for basic cases.
                 return JSON.stringify(value, null, 2); // Pretty print objects/arrays
             } catch {
                 return "[Object]"; // Fallback for complex/circular objects
             }
         }
         return String(value);
     }

     // --- Execution Methods for AST Nodes ---

      execute(node: ASTNode): any {
         // Visitor pattern: Call the appropriate method based on node type
          // e.g., return this.visitExpressionStatement(node);
          // This requires creating visitX methods for each node type.
          // Direct switch is simpler for fewer node types.
         switch (node.type) {
              case 'ExpressionStatement': return this.visitExpressionStatement(node);
              case 'VariableDeclaration': return this.visitVariableDeclaration(node);
              case 'BlockStatement': return this.visitBlockStatement(node);
              case 'IfStatement': return this.visitIfStatement(node);
              case 'WhileStatement': return this.visitWhileStatement(node);
              case 'FunctionDeclaration': return this.visitFunctionDeclaration(node);
              case 'ReturnStatement': return this.visitReturnStatement(node);
              case 'BreakStatement': return this.visitBreakStatement(node); // Need error for outside loop
              case 'ContinueStatement': return this.visitContinueStatement(node); // Need error for outside loop
               case 'ThrowStatement': return this.visitThrowStatement(node);
               case 'TryStatement': return this.visitTryStatement(node);
              // Add cases for all other statement types
              default:
                  // Assume it's an expression if no other statement matches
                  // This might hide errors if parseStatement returns expressions directly
                  // It's better if parseStatement only returns statement nodes.
                  return this.evaluate(node); // Evaluate as expression (potentially discarding result)
                  // throw new Error(`[Ln ${node.line}, Col ${node.column}] Ma 3rftch kifach n executer had statement type: ${node.type}`);
         }
     }

     executeBlock(statements: ASTNode[], environment: Environment): void {
         const previous = this.environment; // Save current environment
         try {
             this.environment = environment; // Set new environment for the block
             for (const statement of statements) {
                 this.execute(statement);
             }
         } finally {
             this.environment = previous; // Restore previous environment
         }
     }

      visitExpressionStatement(node: ASTNode): any {
         this.evaluate(node.expression); // Evaluate for side effects, discard result
         return null; // Statements don't produce values directly
     }

     visitVariableDeclaration(node: ASTNode): any {
          let value = null;
          if (node.initializer) {
              value = this.evaluate(node.initializer);
          }
          this.environment.define(node.identifier, value, node.kind === 'tabit');
          return null;
     }

      visitBlockStatement(node: ASTNode): any {
         this.executeBlock(node.body, new Environment(this.environment)); // Create new scope
         return null;
      }

       visitIfStatement(node: ASTNode): any {
          const conditionValue = this.evaluate(node.condition);
          if (this.isTruthy(conditionValue)) {
              this.execute(node.thenBranch);
          } else if (node.elseBranch) {
              this.execute(node.elseBranch);
          }
           return null;
       }

       visitWhileStatement(node: ASTNode): any {
            while (this.isTruthy(this.evaluate(node.condition))) {
                 try {
                     this.execute(node.body);
                 } catch (error) {
                     if (error instanceof BreakException) break; // Handle break
                     if (error instanceof ContinueException) continue; // Handle continue (though usually implicit)
                     throw error; // Re-throw other errors
                 }
            }
           return null;
       }

        visitFunctionDeclaration(node: ASTNode): any {
            const func = new DarijaFunction(node, this.environment); // Capture current environment (closure)
            this.environment.define(node.id.name, func, false); // Functions are typically like 'bdl' (can be reassigned)
            return null;
        }

         visitReturnStatement(node: ASTNode): any {
             const value = node.argument ? this.evaluate(node.argument) : undefined; // Use undefined for empty return
             throw new ReturnValue(value); // Throw special exception
         }

          visitBreakStatement(node: ASTNode): any {
             throw new BreakException(); // Throw special exception for break
          }
          visitContinueStatement(node: ASTNode): any {
              throw new ContinueException(); // Throw special exception for continue
          }
           visitThrowStatement(node: ASTNode): any {
               const valueToThrow = this.evaluate(node.argument);
               throw runtimeError(node, `Mskna ghalat: ${this.stringify(valueToThrow)}`); // Wrap the value in a runtime error
               // Or just throw the value itself: throw valueToThrow;
           }

           visitTryStatement(node: ASTNode): any {
                try {
                    this.execute(node.block);
                } catch (error) {
                    if (node.handler) { // If there's a catch block
                        if (error instanceof BreakException || error instanceof ContinueException || error instanceof ReturnValue){
                            // Don't catch control flow exceptions unless finally handles them
                            if(!node.finalizer) throw error;
                        } else {
                             // Execute catch block
                             const catchEnv = new Environment(this.environment);
                             // Define the error variable in the catch scope
                             catchEnv.define(node.handler.param.name, error, false); // Error variable is like 'bdl'
                             this.executeBlock(node.handler.body.body, catchEnv); // Assuming body is block
                             // Error is considered "handled" if catch executed without throwing again
                             error = null; // Clear error so finally doesn't re-throw it implicitly
                        }
                    } else if (!node.finalizer) {
                         // No catch and no finally, re-throw
                         throw error;
                    }
                    // If error occurred and there was no catch OR if catch re-threw,
                    // 'error' variable still holds the error for the finally block.
                } finally {
                    if (node.finalizer) {
                        this.execute(node.finalizer); // Always execute finally
                    }
                     // If an error occurred that wasn't handled by catch, re-throw it after finally.
                     // This logic is complex. If finally throws, it supersedes the original error.
                     // If finally returns/breaks/continues, it also supersedes.
                     // Simplified: Just execute finally. More robust handling needed for edge cases.
                }
               return null;
           }

     // --- Evaluation Methods for Expression Nodes ---

     evaluate(node: ASTNode): any {
         try {
              // Visitor pattern or switch for expressions
             switch (node.type) {
                 case 'Literal': return node.value;
                 case 'Identifier': return this.visitIdentifierExpression(node);
                 case 'ThisExpression': return this.visitThisExpression(node); // Needs 'this' binding context
                 case 'Grouping': return this.evaluate(node.expression);
                 case 'UnaryExpression': return this.visitUnaryExpression(node);
                 case 'BinaryExpression': return this.visitBinaryExpression(node);
                 case 'LogicalExpression': return this.visitLogicalExpression(node);
                 case 'AssignmentExpression': return this.visitAssignmentExpression(node);
                 case 'CallExpression': return this.visitCallExpression(node);
                 case 'MemberExpression': return this.visitMemberExpression(node);
                 case 'UpdateExpression': return this.visitUpdateExpression(node); // ++ --
                 case 'ArrayLiteral': return this.visitArrayLiteral(node);
                 case 'ObjectLiteral': return this.visitObjectLiteral(node);
                  case 'NewExpression': return this.visitNewExpression(node);
                 // Add cases for all expression types
                 default:
                     throw runtimeError(node, `Ma 3rftch kifach n7seb had l'expression type: ${node.type}`);
             }
         } catch (error: any) {
              // If it's already a runtime error with line/col, re-throw
             if (error instanceof Error && error.message.startsWith('[')) {
                 throw error;
             }
              // Otherwise, wrap it with location info from the current node
             throw runtimeError(node, error.message || "Ghalat ma expectedch.");
         }
     }

      // Helper for truthiness check (like JavaScript)
     isTruthy(value: any): boolean {
         if (value === null || value === undefined) return false;
         if (value === false) return false; // Explicit false
         if (value === 0) return false; // Number 0
         if (value === '') return false; // Empty string
         return true; // Everything else is truthy
     }

      visitIdentifierExpression(node: ASTNode): any {
          // Need to handle resolved locals if using a resolver pass
          // return this.lookupVariable(node.name, node);
         return this.environment.get(node); // Basic environment lookup
      }

      visitThisExpression(node: ASTNode): any {
           // Requires proper handling of 'this' binding based on call context (methods, etc.)
           // For simple global scope, 'this' might be undefined or refer to globals.
           console.warn("Warning: 'hadi' (this) behaviour is not fully implemented yet.");
            try {
                 // Attempt to get 'hadi' from the innermost scope that might define it (likely globals for now)
                 return this.environment.get({ type: 'THIS', value: 'hadi', line: node.line, column: node.column });
             } catch {
                 return undefined; // Or throw if 'this' must be bound
             }
      }


     visitUnaryExpression(node: ASTNode): any {
         const right = this.evaluate(node.right);
         switch (node.operator) {
             case '-':
                 this.checkNumberOperand(node.right, right);
                 return -Number(right);
             case '!':
                 return !this.isTruthy(right);
         }
         // Unreachable
         return null;
     }

     visitBinaryExpression(node: ASTNode): any {
          const left = this.evaluate(node.left);
          const right = this.evaluate(node.right);
          const op = node.operator;

          switch (op) {
              // Arithmetic
              case '+':
                   if (typeof left === 'number' && typeof right === 'number') { return left + right; }
                   if (typeof left === 'string' || typeof right === 'string') { return this.stringify(left) + this.stringify(right); } // String concatenation
                   throw runtimeError(node, `L'opération '+' kat khdem ghi m3a ar9am awla strings.`);
              case '-':
                   this.checkNumberOperands(node, left, right);
                   return Number(left) - Number(right);
              case '*':
                   this.checkNumberOperands(node, left, right);
                   return Number(left) * Number(right);
              case '/':
                   this.checkNumberOperands(node, left, right);
                   if (Number(right) === 0) throw runtimeError(node, "Ma ymknch t9ssem 3la zero.");
                   return Number(left) / Number(right);
               case '%':
                   this.checkNumberOperands(node, left, right);
                    if (Number(right) === 0) throw runtimeError(node, "Ma ymknch t9ssem 3la zero f modulo.");
                   return Number(left) % Number(right);

               // Comparisons (handle types carefully, similar to JS loose comparison for ==/!= maybe?)
              case '>':
                   this.checkNumberOperands(node, left, right); // Or allow string comparison?
                   return Number(left) > Number(right);
              case '>=':
                    this.checkNumberOperands(node, left, right);
                   return Number(left) >= Number(right);
              case '<':
                    this.checkNumberOperands(node, left, right);
                   return Number(left) < Number(right);
              case '<=':
                    this.checkNumberOperands(node, left, right);
                   return Number(left) <= Number(right);

              // Equality (Mimic JS == loose equality for simplicity, or enforce strict ===?)
               case '==': return left == right; // Loose equality
               case '!=': return left != right; // Loose inequality

               // Add strict equality '===' / '!==' if tokenized and parsed
          }
          // Unreachable
          return null;
      }

      visitLogicalExpression(node: ASTNode): any {
         const left = this.evaluate(node.left);

         if (node.operator === '||') {
             if (this.isTruthy(left)) return left; // Short-circuit OR
         } else { // operator === '&&'
             if (!this.isTruthy(left)) return left; // Short-circuit AND
         }

         return this.evaluate(node.right); // Evaluate right only if needed
      }


      visitAssignmentExpression(node: ASTNode): any {
         const value = this.evaluate(node.right);

         // Handle assignment to identifier vs. member
         if (node.left.type === 'Identifier') {
             const name = node.left.name;
             // Need to handle scope resolution if using resolver
             // this.environment.assignAt(distance, name, value);
             this.environment.assign(name, value); // Basic assignment
         } else if (node.left.type === 'MemberExpression') {
             const objectNode = node.left.object;
             const propertyNode = node.left.property;
             const obj = this.evaluate(objectNode);

             // Check if object is valid for assignment (object, array maybe?)
              if (obj === null || typeof obj !== 'object') {
                  throw runtimeError(node.left, "Ma ymknch t assigner l property dyal chi 7aja machi object.");
              }


             if (node.left.computed) { // Assignment like obj[index] = value
                 const propertyKey = this.evaluate(propertyNode);
                 // Basic property setting, might need more checks (e.g., readonly properties)
                 obj[propertyKey] = value;
             } else { // Assignment like obj.property = value
                  const propertyName = propertyNode.name; // Property is an Identifier here
                  obj[propertyName] = value;
             }
         } else {
             throw runtimeError(node.left, "Lmouhtar dyal l assignment ma shihesh.");
         }

         return value; // Assignment expression evaluates to the assigned value
      }

       visitCallExpression(node: ASTNode): any {
           const callee = this.evaluate(node.callee); // Evaluate the function/method itself

            // Handle built-in methods like .toUpperCase(), .push(), etc.
             if (node.callee.type === 'MemberExpression') {
                 const object = this.evaluate(node.callee.object);
                 const methodName = node.callee.property.name; // Assuming non-computed access

                 // Array methods
                  if (Array.isArray(object)) {
                      const args = node.arguments.map((arg: ASTNode) => this.evaluate(arg));
                       switch (methodName) {
                           case 'zid': return object.push(...args); // push()
                           case '7yed': return object.pop(); // pop()
                           case '7yedmnlwla': return object.shift(); // shift()
                           case 'zidfllwla': return object.unshift(...args); // unshift()
                           case 'kayn': return object.includes(args[0]); // includes() - simplified
                           // map, filter, reduce, find, forEach need function arguments
                           case 'dwr': // map
                               if (args.length < 1 || typeof args[0]?.call !== 'function') throw runtimeError(node.arguments[0] || node, "'dwr' khassha function parameter.");
                               return object.map((item, index, arr) => args[0].call(this, [item, index, arr], node)); // Pass 'this' context?
                           case 'n9i': // filter
                                if (args.length < 1 || typeof args[0]?.call !== 'function') throw runtimeError(node.arguments[0] || node, "'n9i' khassha function parameter.");
                               return object.filter((item, index, arr) => args[0].call(this, [item, index, arr], node));
                           case 'lfech': // forEach
                                if (args.length < 1 || typeof args[0]?.call !== 'function') throw runtimeError(node.arguments[0] || node, "'lfech' khassha function parameter.");
                               object.forEach((item, index, arr) => args[0].call(this, [item, index, arr], node)); return undefined;
                           case 'l9a': // find
                                if (args.length < 1 || typeof args[0]?.call !== 'function') throw runtimeError(node.arguments[0] || node, "'l9a' khassha function parameter.");
                               return object.find((item, index, arr) => args[0].call(this, [item, index, arr], node));
                           case 'lmmaj': // reduce
                                if (args.length < 1 || typeof args[0]?.call !== 'function') throw runtimeError(node.arguments[0] || node, "'lmmaj' khassha function parameter (callback).");
                               const initialValue = args.length > 1 ? args[1] : undefined; // Optional initial value
                               if (initialValue !== undefined) {
                                   return object.reduce((acc, item, index, arr) => args[0].call(this, [acc, item, index, arr], node), initialValue);
                               } else {
                                    if(object.length === 0) throw runtimeError(node, "'lmmaj' dyal array khawia bla initial value ma khddamach.");
                                   return object.reduce((acc, item, index, arr) => args[0].call(this, [acc, item, index, arr], node));
                               }
                           default:
                                throw runtimeError(node.callee.property, `Method '${methodName}' ma kaynach f arrays.`);
                       }
                  }
                  // String methods
                   else if (typeof object === 'string') {
                       const args = node.arguments.map((arg: ASTNode) => this.evaluate(arg));
                       switch (methodName) {
                           case 'kbr7rf': return object.toUpperCase();
                           case 'sghr7rf': return object.toLowerCase();
                           case 'kayn': return object.includes(args[0]); // includes()
                           // Add other string methods (slice, replace, split, etc.)
                           default:
                               throw runtimeError(node.callee.property, `Method '${methodName}' ma kaynach f strings.`);
                       }
                   }
                   // Add Date methods (3am, chhr, nhar)
                    else if (object instanceof Date) {
                         const args = node.arguments.map((arg: ASTNode) => this.evaluate(arg));
                        switch (methodName) {
                            case '3am': return object.getFullYear();
                            case 'chhr': return object.getMonth(); // 0-indexed
                            case 'nhar': return object.getDate();
                            // Add other date methods
                            default:
                                throw runtimeError(node.callee.property, `Method '${methodName}' ma kaynach f Date objects.`);
                        }
                    }

                   // Could be a user-defined method on an object
                   // Look up method on object, check if callable, then call with 'this' bound to 'object'
                   if (typeof object === 'object' && object !== null && typeof object[methodName]?.call === 'function') {
                        const method = object[methodName];
                        const evaluatedArgs = node.arguments.map((arg: ASTNode) => this.evaluate(arg));
                        // Check arity?
                         if (typeof method.arity === 'function' && method.arity() !== Infinity && evaluatedArgs.length !== method.arity()) {
                              throw runtimeError(node, `Kan tsnna ${method.arity()} arguments walakin 3titih ${evaluatedArgs.length} l '${methodName}'.`);
                          }
                         // Need to bind 'this' correctly when calling the method
                          return method.call(object, evaluatedArgs, node); // Pass object as 'this' context
                   }


                 throw runtimeError(node.callee, `Kan tsnna function awla method bach n 3iyto liha, walakin l9it type '${typeof object}'.`);
            }


            // Regular function call (not a method)
            if (typeof callee?.call !== 'function') { // Check if it's a DarijaCallable (native or user func)
               throw runtimeError(node.callee, `Kan tsnna function bach n 3iyto liha, walakin l9it type '${typeof callee}'.`);
            }

           const callable = callee as DarijaCallable;
           const evaluatedArgs = node.arguments.map((arg: ASTNode) => this.evaluate(arg));

            // Check arity (number of arguments)
            if (callable.arity() !== Infinity && evaluatedArgs.length !== callable.arity()) {
                throw runtimeError(node, `Kan tsnna ${callable.arity()} arguments walakin 3titih ${evaluatedArgs.length}.`);
            }

           return callable.call(this, evaluatedArgs, node); // Pass interpreter context
       }

       visitMemberExpression(node: ASTNode): any {
            const object = this.evaluate(node.object);

             // Handle .length ('twil') property
              if (!node.computed && node.property.name === 'twil') {
                  if (typeof object === 'string' || Array.isArray(object)) {
                      return object.length;
                  }
                  throw runtimeError(node.property, `Property '.twil' (length) kayn ghi f strings o arrays.`);
              }


            // Check if object is suitable for member access
            if (object === null || (typeof object !== 'object' && typeof object !== 'string')) { // Allow string member access e.g., "abc"[1]
                 if(typeof object === 'number') {
                     // Allow number methods if defined? (e.g., .toString()) - requires extending object prototype or wrapper
                     throw runtimeError(node.object, "Ma ymknch t acceder l property dyal ra9m.");
                 }
                throw runtimeError(node.object, `Ma ymknch t acceder l property dyal '${this.stringify(object)}'.`);
            }

            let propertyKey;
            if (node.computed) { // obj[key]
                propertyKey = this.evaluate(node.property);
            } else { // obj.key
                propertyKey = node.property.name; // Property name is stored in the identifier node
            }

            // Return property value. Need to handle undefined properties, potentially methods.
            // If the property is a function, we might need to bind 'this' if it's called later.
            // For simple property access, just return the value.
             try {
                let value = object[propertyKey];
                 // If accessing a method, return it bound to the object?
                 // This allows obj.method() to work later.
                 if (typeof value === 'function' && typeof object === 'object' && object !== null) {
                      // Basic binding (might not cover all edge cases like arrow functions)
                      // return value.bind(object);
                      // Or return a wrapper that calls with the correct 'this'
                       return new class implements DarijaCallable {
                           arity() { return Infinity; } // Or get arity from original function if possible
                           call(interpreter: Interpreter, args: any[], callToken?: Token): any {
                               // Call the original function with 'object' as 'this'
                               return value.apply(object, args);
                           }
                           toString() { return `<native method ${propertyKey}>`;} // Or better representation
                       }();
                 }
                 // Handle case where property might not exist
                 if (value === undefined && !(propertyKey in object)) {
                     // Return 'mchmcha' (undefined) or throw? JS returns undefined.
                     return undefined;
                 }

                return value;
             } catch (e) {
                  // Handle potential errors during property access (e.g., on prototypes)
                  throw runtimeError(node, `Ghalat fach kan accedi l property '${propertyKey}': ${e.message}`);
             }
       }

        visitUpdateExpression(node: ASTNode): any { // ++ --
             const argumentNode = node.argument;
             // Evaluate the argument to know where to update
             // This is tricky because we need the *reference* not just the value
             // For Identifier: Get name and assign back
             // For MemberExpression: Get object and property key, assign back

             let oldValue;
             let newValue;
             const value = this.evaluate(argumentNode); // Get current value
              this.checkNumberOperand(argumentNode, value); // Ensure it's a number
             oldValue = Number(value);

             if (node.operator === '++') {
                 newValue = oldValue + 1;
             } else { // '--'
                 newValue = oldValue - 1;
             }

              // Assign the new value back
             if (argumentNode.type === 'Identifier') {
                 this.environment.assign(argumentNode.name, newValue);
             } else if (argumentNode.type === 'MemberExpression') {
                  const obj = this.evaluate(argumentNode.object);
                   if (obj === null || typeof obj !== 'object') {
                       throw runtimeError(argumentNode.object, "Ma ymknch t incrementer/decrementer property dyal chi 7aja machi object.");
                   }
                  if (argumentNode.computed) {
                      const key = this.evaluate(argumentNode.property);
                      obj[key] = newValue;
                  } else {
                      obj[argumentNode.property.name] = newValue;
                  }
             } else {
                 throw runtimeError(argumentNode, "Lmouhtar dyal ++/-- ma shihesh.");
             }


             // Return old value for postfix, new value for prefix
             return node.prefix ? newValue : oldValue;
         }

          visitArrayLiteral(node: ASTNode): any {
             return node.elements.map((element: ASTNode) => this.evaluate(element));
          }

          visitObjectLiteral(node: ASTNode): any {
              const obj: { [key: string]: any } = {};
              node.properties.forEach((propNode: ASTNode) => {
                   // Key is already evaluated/extracted by parser (Literal Identifier/String)
                  const key = propNode.key.value;
                  const value = this.evaluate(propNode.value);
                  obj[key] = value;
              });
              return obj;
          }

           visitNewExpression(node: ASTNode): any {
                const callee = this.evaluate(node.callee); // Evaluate the constructor identifier

                 // Handle built-in 'wa9t' (new Date())
                 if (node.callee.type === 'Identifier' && node.callee.name === 'wa9t') {
                      const args = node.arguments.map((arg: ASTNode) => this.evaluate(arg));
                     try {
                         // @ts-ignore - Spread arguments into Date constructor
                         return new Date(...args);
                     } catch (e: any) {
                          throw runtimeError(node, `Ghalat f l constructor dyal Date: ${e.message}`);
                     }
                 }

                // Handle user-defined constructors (requires class implementation)
                if (typeof callee?.call !== 'function' /* || !callee.isConstructor */) {
                     throw runtimeError(node.callee, `'${node.callee.name}' machi constructor.`);
                 }

                 // Placeholder for actual class instantiation
                 console.warn(`Warning: 'jdid' (new) for user types is not fully implemented.`);
                 const instance = {}; // Create a plain object for now
                 const evaluatedArgs = node.arguments.map((arg: ASTNode) => this.evaluate(arg));

                 // Call the constructor function with 'this' bound to the new instance
                 // Need mechanism to bind 'this' before calling.
                 // callee.call(instance, evaluatedArgs, node); // Simplified

                 return instance; // Return the new object
           }

      // --- Helpers ---
       checkNumberOperand(node: ASTNode, operand: any) {
          if (typeof operand === 'number') return;
          throw runtimeError(node, `Operand khasso ykoun ra9m.`);
       }
        checkNumberOperands(node: ASTNode, left: any, right: any) {
            if (typeof left === 'number' && typeof right === 'number') return;
            throw runtimeError(node, `Operands khasshom ykounou ar9am.`);
        }

} // End Interpreter Class


// --- Custom Exceptions for Control Flow ---
class BreakException extends Error {
    constructor() { super("Break"); this.name = "BreakException"; }
}
class ContinueException extends Error {
     constructor() { super("Continue"); this.name = "ContinueException"; }
}


// --- Main Interpreter Function ---
interface InterpretationResult {
    output: string[];
    error: string | null;
}

export function interpret(code: string): InterpretationResult {
    const interpreter = new Interpreter();
    try {
        const tokens = tokenize(code);
        // console.log("Tokens:", tokens.map(t => `${t.type}<${t.value}>`).join(' '));
        const ast = parse(tokens);
         // console.log("AST:", JSON.stringify(ast, null, 2));
        return interpreter.interpret(ast);
    } catch (e: any) {
        // console.error("Interpreter Init Error:", e);
        // Catch errors during tokenization or parsing
        return { output: [], error: e.message || "Kayn chi ghalat f code 9bel l execution." };
    }
}

