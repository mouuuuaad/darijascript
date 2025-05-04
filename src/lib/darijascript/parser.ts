

// A simplified recursive descent parser for DarijaScript
// Aims to generate an Abstract Syntax Tree (AST) representing the code structure.

// --- Token Interface ---
// (Assumed to be provided by the tokenizer)
interface Token {
  type: string; // e.g., 'KEYWORD', 'IDENTIFIER', 'NUMBER', 'OPERATOR', 'PUNCTUATION', 'EOF', 'ERROR'
  value: any;   // The actual text or parsed value (e.g., 'bdl', 'x', 10, '+', ';')
  line: number; // Line number where the token starts
  column: number; // Column number where the token starts
}

// --- AST Node Interface ---
// Defines the structure of nodes in the Abstract Syntax Tree
export interface ASTNode {
  type: string; // Node type, e.g., 'Program', 'VariableDeclaration', 'BinaryExpression'
  line: number;   // Line number corresponding to the start of the node/token
  column: number; // Column number corresponding to the start of the node/token

  // Common properties (optional based on node type)
  body?: ASTNode[];        // For Program, BlockStatement, FunctionDeclaration/Expression
  expression?: ASTNode;    // For ExpressionStatement, GroupingExpression
  declarations?: ASTNode[];// For VariableDeclaration (if parsing multiple vars at once)
  id?: ASTNode;            // Identifier node (for variables, functions, parameters)
  name?: string;           // Shortcut for Identifier's name
  kind?: string;           // 'tabit' or 'bdl' for VariableDeclaration
  initializer?: ASTNode;   // Initial value expression for VariableDeclarator
  left?: ASTNode;          // Left operand for Binary/Assignment/Logical Expressions
  right?: ASTNode;         // Right operand for Binary/Assignment/Logical Expressions
  operator?: string;       // Operator symbol (e.g., '+', '=', '&&')
  argument?: ASTNode;      // Operand for Unary/Update/Return/Throw Expressions
  prefix?: boolean;        // For prefix vs. postfix UpdateExpression (++x vs x++)
  callee?: ASTNode;        // Function being called in CallExpression or NewExpression
  arguments?: ASTNode[];   // Arguments in CallExpression or NewExpression
  params?: ASTNode[];      // Parameters in FunctionDeclaration/Expression
  test?: ASTNode;          // Condition in IfStatement, WhileStatement, ForStatement, ConditionalExpression
  consequent?: ASTNode;    // Main block/statement for IfStatement, SwitchCase
  alternate?: ASTNode;     // Else block for IfStatement, alternate for ConditionalExpression
  init?: ASTNode;          // Initializer in ForStatement
  update?: ASTNode;        // Update expression in ForStatement
  block?: ASTNode;         // Main block for TryStatement
  handler?: ASTNode;       // CatchClause node for TryStatement (msk block)
  finalizer?: ASTNode;     // Finally BlockStatement for TryStatement (fakhr block)
  param?: ASTNode;         // Error parameter Identifier for CatchClause
  object?: ASTNode;        // Object being accessed in MemberExpression
  property?: ASTNode;      // Property being accessed in MemberExpression
  computed?: boolean;      // True if MemberExpression uses `[]`, false for `.`
  discriminant?: ASTNode;  // Expression being switched on in SwitchStatement
  cases?: ASTNode[];       // Array of SwitchCase nodes for SwitchStatement
  value?: any;             // Literal value for NumericLiteral, StringLiteral, BooleanLiteral

  // Special property for parser errors within the Program node
  error?: string;
}


// --- Parser Class ---

class Parser {
  tokens: Token[];
  current: number = 0; // Index of the next token to process
  errors: string[] = []; // Collect multiple errors? For now, usually stops on first.

  constructor(tokens: Token[]) {
    // Filter out non-essential tokens like whitespace and comments if the tokenizer includes them
    this.tokens = tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'COMMENT' && t.type !== 'ERROR');
     // If tokenizer produces ERROR tokens, maybe handle them here or expect pre-filtered tokens.
     const errorToken = tokens.find(t => t.type === 'ERROR');
     if (errorToken) {
          // Immediately report tokenizer error and stop parsing
          this.errors.push(`Ghalat men Tokenizer [Ln ${errorToken.line}, Col ${errorToken.column}]: ${errorToken.value}`);
     }
  }

  // --- Entry Point ---
  // parse() -> Program Node
  parse(): ASTNode {
     // Check for tokenizer errors before starting
     if (this.errors.length > 0) {
         return {
             type: 'Program',
             body: [],
             error: this.errors[0], // Report the first tokenizer error
             line: 1, column: 0 // Default position for program error
         };
     }


    const body: ASTNode[] = [];
    const startToken = this.peek(); // Get position of the first token

    while (!this.isAtEnd()) {
      try {
          // Attempt to parse a declaration first, then fallback to a statement
          const node = this.parseDeclaration() || this.parseStatement();
          if (node) { // Ensure a node was actually parsed
              body.push(node);
          } else if (!this.isAtEnd()) {
             // This should ideally not happen if parseStatement covers all cases or throws
              throw this.error(this.peek(), "Expression wella statement mam fahmouch.");
          }
      } catch (error: any) {
          const errorMessage = error.message || "Erreur d'analyse inconnue.";
          this.errors.push(errorMessage);
          console.error("Parser Error:", error); // Log for debugging

          // Attempt to recover from the error to potentially find more errors
          this.synchronize();

          // Optionally, stop parsing after the first error for simplicity
          // break;
          if (this.isAtEnd()) break; // Stop if synchronization leads to the end
      }
    }

     // Return the Program node
     const programNode: ASTNode = {
         type: 'Program',
         body,
         line: startToken.line,
         column: startToken.column
     };

     // If errors occurred during parsing, attach the first one to the Program node
     if (this.errors.length > 0) {
        programNode.error = `Erreurs d'analyse: ${this.errors.join('; ')}`;
     }

    return programNode;
  }

  // --- Parsing Rules (Methods) ---

  // declaration -> varDeclaration | funDeclaration | statement ;
  // Returns the parsed declaration node or null if it's not a declaration start.
  parseDeclaration(): ASTNode | null {
    const currentToken = this.peek();
    if (this.matchValue('KEYWORD', 'tabit', 'bdl')) {
      return this.parseVariableDeclaration(this.previous().value); // Pass 'tabit' or 'bdl'
    }
     if (this.matchValue('KEYWORD', 'dala')) { // Keyword for function
      return this.parseFunctionDeclaration();
    }
    // If it doesn't start with a declaration keyword, it's likely a statement.
    return null;
  }

  // statement -> exprStatement | blockStatement | ifStatement | whileStatement | doWhileStatement
  //           | forStatement | tryStatement | switchStatement | returnStatement
  //           | breakStatement | continueStatement ;
  // Parses any type of statement.
  parseStatement(): ASTNode {
     const currentToken = this.peek();
     // Check keywords that start specific statements
     if (this.matchValue('KEYWORD', 'ila')) return this.parseIfStatement();
     if (this.matchValue('KEYWORD', 'madamt')) return this.parseWhileStatement();
     if (this.matchValue('KEYWORD', 'dir')) return this.parseDoWhileStatement();
     if (this.matchValue('KEYWORD', 'douz')) return this.parseForStatement();
     if (this.matchValue('KEYWORD', 'jrb')) return this.parseTryStatement();
     if (this.matchValue('KEYWORD', 'bdl3la')) return this.parseSwitchStatement();
     if (this.matchValue('KEYWORD', 'rj3')) return this.parseReturnStatement();
     if (this.matchValue('KEYWORD', 'wa9f')) return this.parseBreakStatement();
     if (this.matchValue('KEYWORD', 'kamml')) return this.parseContinueStatement();
     // Check for block statement start
     if (this.checkValue('PUNCTUATION', '{')) return this.parseBlockStatement();

     // If none of the above, assume it's an expression statement
     return this.parseExpressionStatement();
  }

  // blockStatement -> '{' (declaration | statement)* '}' ;
  parseBlockStatement(): ASTNode {
    const startToken = this.consumeValue('PUNCTUATION', '{', "Kan tsnna '{' bach nbda block.");
    const body: ASTNode[] = [];
    while (!this.checkValue('PUNCTUATION', '}') && !this.isAtEnd()) {
        // Inside a block, parse declarations or statements
         const node = this.parseDeclaration() || this.parseStatement();
         if (node) {
              body.push(node);
         } else if (!this.isAtEnd()){
              throw this.error(this.peek(), "Kan tsnna declaration wella statement f west block.");
         }
    }
    this.consumeValue('PUNCTUATION', '}', "Kan tsnna '}' f lekher dyal block.");
    return { type: 'BlockStatement', body, line: startToken.line, column: startToken.column };
  }

  // exprStatement -> expression ';' ;
  parseExpressionStatement(): ASTNode {
    const startToken = this.peek();
    const expr = this.parseExpression();
    this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal statement.");
    return { type: 'ExpressionStatement', expression: expr, line: startToken.line, column: startToken.column };
  }


  // varDeclaration -> ('tabit' | 'bdl') VariableDeclarator (',' VariableDeclarator)* ';' ;
  // VariableDeclarator -> IDENTIFIER ('=' expression)?
  parseVariableDeclaration(kind: string): ASTNode {
      const startToken = this.previous(); // The 'tabit' or 'bdl' token
      const declarations: ASTNode[] = [];

      do {
          const nameToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal variable.");
          let initializer: ASTNode | undefined = undefined;
          if (this.matchValue('OPERATOR', '=')) {
              initializer = this.parseExpression();
          }
          declarations.push({
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: nameToken.value, line: nameToken.line, column: nameToken.column },
              initializer: initializer,
              line: nameToken.line, // Line/col of the identifier
              column: nameToken.column
          });
      } while (this.matchValue('PUNCTUATION', ',')); // Allow multiple declarations like bdl x = 1, y = 2;

      this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal declaration dyal variable.");

      // Return a single VariableDeclaration node containing the list of declarators
      return {
          type: 'VariableDeclaration',
          kind: kind, // 'tabit' or 'bdl'
          declarations: declarations,
          line: startToken.line,
          column: startToken.column
      };
  }


   // funDeclaration -> 'dala' IDENTIFIER '(' parameters? ')' blockStatement ;
   // parameters -> IDENTIFIER (',' IDENTIFIER)* ;
   parseFunctionDeclaration(): ASTNode {
     const startToken = this.previous(); // The 'dala' token
     const name = this.consume('IDENTIFIER', "Kan tsnna smia dyal dala.");
     const identifierNode: ASTNode = { type: 'Identifier', name: name.value, line: name.line, column: name.column };

     this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d smia dyal dala.");
     const params: ASTNode[] = [];
     if (!this.checkValue('PUNCTUATION', ')')) {
       do {
         // Basic argument limit check
         if (params.length >= 255) {
             // Use error method for consistency
            this.error(this.peek(), "Ma ymknch ykoun kter mn 255 arguments.");
         }
         const paramToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal parameter.");
         params.push({ type: 'Identifier', name: paramToken.value, line: paramToken.line, column: paramToken.column });
       } while (this.matchValue('PUNCTUATION', ','));
     }
     this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d parameters.");

     // Expecting a block statement for the body
     const body = this.parseBlockStatement();
     if (body.type !== 'BlockStatement') { // Should be guaranteed by parseBlockStatement
          throw this.error(this.peek(), "Kan tsnna '{' l body dyal dala."); // Should not happen if parseBlockStatement works
     }

     return {
         type: 'FunctionDeclaration',
         id: identifierNode,
         params,
         body,
         line: startToken.line,
         column: startToken.column
     };
   }


  // ifStatement -> 'ila' '(' expression ')' statement ('ella' statement)? ;
  parseIfStatement(): ASTNode {
    const startToken = this.previous(); // 'ila' token
    this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'ila'.");
    const test = this.parseExpression();
    this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");

    const consequent = this.parseStatement(); // Parse the 'then' block/statement
    let alternate: ASTNode | undefined = undefined;
    if (this.matchValue('KEYWORD', 'ella')) { // Check for 'else'
      alternate = this.parseStatement(); // Parse the 'else' block/statement
    }

    return { type: 'IfStatement', test, consequent, alternate, line: startToken.line, column: startToken.column };
  }

  // whileStatement -> 'madamt' '(' expression ')' statement ;
  parseWhileStatement(): ASTNode {
       const startToken = this.previous(); // 'madamt' token
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'madamt'.");
      const test = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");
      const body = this.parseStatement();
      return { type: 'WhileStatement', test, body, line: startToken.line, column: startToken.column };
  }

  // doWhileStatement -> 'dir' statement 'madamt' '(' expression ')' ';' ;
  parseDoWhileStatement(): ASTNode {
      const startToken = this.previous(); // 'dir' token
      const body = this.parseStatement(); // Parse the body first
      this.consumeValue('KEYWORD', 'madamt', "Kan tsnna 'madamt' ba3d body dyal do-while.");
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'madamt'.");
      const test = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");
      this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal do-while statement.");
      return { type: 'DoWhileStatement', body, test, line: startToken.line, column: startToken.column };
  }

  // forStatement -> 'douz' '(' (varDeclaration | exprStatement | ';') expression? ';' expression? ')' statement ;
  // This structure mirrors the C-style for loop.
  parseForStatement(): ASTNode {
    const startToken = this.previous(); // 'douz' token
    this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'douz'.");

    // Parse Initializer
    let init: ASTNode | null = null;
    if (this.matchValue('PUNCTUATION', ';')) {
      // No initializer, consume the semicolon.
    } else if (this.matchValue('KEYWORD', 'tabit', 'bdl')) {
      // Initializer is a variable declaration (without the trailing semicolon)
      init = this.parseVariableDeclarationForLoop(this.previous().value);
    } else {
      // Initializer is an expression statement (without the trailing semicolon)
      init = this.parseExpressionStatementForLoop();
    }
     // Semicolon after initializer is consumed by the respective parsing functions above or the initial ';' match

    // Parse Condition
    let test: ASTNode | null = null;
    if (!this.checkValue('PUNCTUATION', ';')) { // If there's something before the next semicolon
      test = this.parseExpression();
    }
    this.consumeValue('PUNCTUATION', ';', "Kan tsnna ';' ba3d loop condition.");

    // Parse Update
    let update: ASTNode | null = null;
    if (!this.checkValue('PUNCTUATION', ')')) { // If there's something before the closing parenthesis
      update = this.parseExpression();
    }
    this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d clauses dyal for.");

    // Parse Body
    const body = this.parseStatement();

    return { type: 'ForStatement', init, test, update, body, line: startToken.line, column: startToken.column };
  }

  // Helper for parsing variable declaration inside a for loop initializer (doesn't consume trailing ';')
  parseVariableDeclarationForLoop(kind: string): ASTNode {
      const startToken = this.previous(); // keyword token
       const declarations: ASTNode[] = [];
        do {
            const nameToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal variable f for loop init.");
            let initializer: ASTNode | undefined = undefined;
            if (this.matchValue('OPERATOR', '=')) {
                initializer = this.parseExpression();
            }
            declarations.push({
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: nameToken.value, line: nameToken.line, column: nameToken.column },
                initializer: initializer,
                line: nameToken.line,
                column: nameToken.column
            });
        } while (this.matchValue('PUNCTUATION', ','));

       // Consume the semicolon separating init from condition
       this.consumeValue('PUNCTUATION', ';', "Kan tsnna ';' ba3d variable declaration f for loop init.");

        return {
            type: 'VariableDeclaration',
            kind: kind,
            declarations: declarations,
            line: startToken.line,
            column: startToken.column
        };
  }
  // Helper for parsing expression statement inside a for loop initializer (doesn't consume trailing ';')
  parseExpressionStatementForLoop(): ASTNode {
       const startToken = this.peek();
       const expr = this.parseExpression();
       // Consume the semicolon separating init from condition
       this.consumeValue('PUNCTUATION', ';', "Kan tsnna ';' ba3d expression f for loop init.");
       return { type: 'ExpressionStatement', expression: expr, line: startToken.line, column: startToken.column };
  }


  // tryStatement -> 'jrb' blockStatement ( catchClause | finallyClause | catchClause finallyClause ) ;
  // catchClause -> 'msk' ('(' IDENTIFIER ')')? blockStatement ; // Optional error parameter
  // finallyClause -> 'fakhr' blockStatement ;
  parseTryStatement(): ASTNode {
      const startToken = this.previous(); // 'jrb' token
      const block = this.parseBlockStatement(); // Parse the 'try' block

      let handler: ASTNode | null = null; // Catch clause node
      let finalizer: ASTNode | null = null; // Finally clause node

      // Check for 'msk' (catch)
      if (this.matchValue('KEYWORD', 'msk')) {
          const catchStartToken = this.previous();
          let param: ASTNode | null = null;
          // Optional error parameter binding
          if (this.matchValue('PUNCTUATION', '(')) {
              const paramToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal error variable f 'msk'.");
              param = { type: 'Identifier', name: paramToken.value, line: paramToken.line, column: paramToken.column };
              this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d error variable.");
          }
          const catchBody = this.parseBlockStatement();
          handler = { type: 'CatchClause', param, body: catchBody, line: catchStartToken.line, column: catchStartToken.column };
      }

      // Check for 'fakhr' (finally)
      if (this.matchValue('KEYWORD', 'fakhr')) {
          const finallyStartToken = this.previous();
          finalizer = this.parseBlockStatement(); // Finally clause is just a block
          // Add line/col info to the finally block node itself if needed
           if (finalizer.type === 'BlockStatement') {
               finalizer.line = finallyStartToken.line;
               finalizer.column = finallyStartToken.column;
           }
      }

      // A 'try' statement must have at least a 'catch' or a 'finally' block
      if (!handler && !finalizer) {
          throw this.error(this.peek(), "Try statement khass ykoun 3ndo 'msk' wla 'fakhr' block wa7d 3la la9al.");
      }

      return { type: 'TryStatement', block, handler, finalizer, line: startToken.line, column: startToken.column };
  }

  // switchStatement -> 'bdl3la' '(' expression ')' '{' switchCase* '}' ;
  // switchCase -> ('7ala' expression | '3adi') ':' statement* ;
  parseSwitchStatement(): ASTNode {
      const startToken = this.previous(); // 'bdl3la' token
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'bdl3la'.");
      const discriminant = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d switch expression.");
      this.consumeValue('PUNCTUATION', '{', "Kan tsnna '{' qbel switch cases.");

      const cases: ASTNode[] = [];
      while (!this.checkValue('PUNCTUATION', '}') && !this.isAtEnd()) {
          let test: ASTNode | null = null; // null signifies the 'default' case
          let caseStartToken: Token;

          if (this.matchValue('KEYWORD', '7ala')) { // 'case' keyword
              caseStartToken = this.previous();
              test = this.parseExpression(); // Parse the case value expression
          } else if (this.matchValue('KEYWORD', '3adi')) { // 'default' keyword
               caseStartToken = this.previous();
              test = null; // Mark as default
          } else {
               throw this.error(this.peek(), "Kan tsnna '7ala' wla '3adi' f switch block.");
          }

          this.consumeValue('PUNCTUATION', ':', "Kan tsnna ':' ba3d '7ala'/'3adi'.");

          // Parse consequent statements for this case
          const consequent: ASTNode[] = [];
          // Keep parsing statements until the next 'case', 'default', or '}'
          while (!this.isAtEnd() && !this.checkValue('PUNCTUATION', '}') && !this.checkValue('KEYWORD', '7ala') && !this.checkValue('KEYWORD', '3adi')) {
              // Allow declarations or statements within a case block
              const stmt = this.parseDeclaration() || this.parseStatement();
              if (stmt) {
                  consequent.push(stmt);
              } else if (!this.isAtEnd()) {
                   throw this.error(this.peek(), "Statement machi s7i7 f west case dyal switch.");
              }
          }
          cases.push({ type: 'SwitchCase', test, consequent, line: caseStartToken.line, column: caseStartToken.column });
      }

      this.consumeValue('PUNCTUATION', '}', "Kan tsnna '}' f lekher dyal switch statement.");
      return { type: 'SwitchStatement', discriminant, cases, line: startToken.line, column: startToken.column };
  }


  // returnStatement -> 'rj3' expression? ';' ;
  parseReturnStatement(): ASTNode {
     const startToken = this.previous(); // 'rj3' token
     let argument: ASTNode | undefined = undefined;
     // Check if there is an expression to return (if not followed immediately by ';')
     if (!this.checkValue('PUNCTUATION', ';')) {
       argument = this.parseExpression();
     }
     this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d return statement.");
     return { type: 'ReturnStatement', argument, line: startToken.line, column: startToken.column };
   }

    // breakStatement -> 'wa9f' ';' ;
   parseBreakStatement(): ASTNode {
       const startToken = this.previous(); // 'wa9f' token
       this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d 'wa9f'.");
       return { type: 'BreakStatement', line: startToken.line, column: startToken.column };
   }

   // continueStatement -> 'kamml' ';' ;
   parseContinueStatement(): ASTNode {
        const startToken = this.previous(); // 'kamml' token
        this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d 'kamml'.");
        return { type: 'ContinueStatement', line: startToken.line, column: startToken.column };
   }

   // --- Expression Parsing (Operator Precedence) ---

   // expression -> assignment ; (Lowest precedence)
   parseExpression(): ASTNode {
     return this.parseAssignment();
   }

   // assignment -> ( call '.' IDENTIFIER | IDENTIFIER ) ( '=' | '+=' | '-=' | '*=' | '/=' | '%=' ) assignment | logical_or ;
   // Handles assignment operators (=, +=, -= etc.) - right-associative.
   parseAssignment(): ASTNode {
       const startToken = this.peek();
       // Parse the left-hand side, which could be a variable or a property access
       const expr = this.parseLogicalOr(); // Parse higher precedence first

       // Check if an assignment operator follows
       if (this.matchValue('OPERATOR', '=', '+=', '-=', '*=', '/=', '%=')) { // Add other compound operators if needed
           const operatorToken = this.previous(); // The assignment operator token
           const value = this.parseAssignment(); // Recursively parse the right-hand side (right-associativity)

           // Check if the left-hand side is a valid assignment target
           if (expr.type === 'Identifier') {
               // Assigning to a variable: x = 1
               return { type: 'AssignmentExpression', operator: operatorToken.value, left: expr, right: value, line: startToken.line, column: startToken.column };
           } else if (expr.type === 'MemberExpression') {
               // Assigning to a property: obj.prop = 1 or arr[0] = 1
               return { type: 'AssignmentExpression', operator: operatorToken.value, left: expr, right: value, line: startToken.line, column: startToken.column };
           } else {
               // Invalid assignment target (e.g., 1 = 2, (a+b) = 3)
               throw this.error(operatorToken, "Assignment target ماشي valid. Khass ykoun variable wla property.");
           }
       }

       // If no assignment operator, just return the parsed expression (logical_or result)
       return expr;
   }

   // logical_or -> logical_and ( '||' logical_and )* ; (Logical OR)
   parseLogicalOr(): ASTNode {
       const startToken = this.peek();
       let expr = this.parseLogicalAnd();
       while (this.matchValue('OPERATOR', '||')) {
           const operator = this.previous().value;
           const right = this.parseLogicalAnd();
           expr = { type: 'LogicalExpression', operator, left: expr, right, line: startToken.line, column: startToken.column };
       }
       return expr;
   }

   // logical_and -> equality ( '&&' equality )* ; (Logical AND)
   parseLogicalAnd(): ASTNode {
       const startToken = this.peek();
       let expr = this.parseEquality();
       while (this.matchValue('OPERATOR', '&&')) {
           const operator = this.previous().value;
           const right = this.parseEquality();
           expr = { type: 'LogicalExpression', operator, left: expr, right, line: startToken.line, column: startToken.column };
       }
       return expr;
   }

   // equality -> comparison ( ( '!=' | '==' | '!==' | '===' ) comparison )* ; (Equality operators)
   parseEquality(): ASTNode {
     const startToken = this.peek();
     let expr = this.parseComparison();
     while (this.matchValue('OPERATOR', '!=', '==', '!==', '===')) {
       const operator = this.previous().value;
       const right = this.parseComparison();
       expr = { type: 'BinaryExpression', operator, left: expr, right, line: startToken.line, column: startToken.column };
     }
     return expr;
   }

   // comparison -> term ( ( '>' | '>=' | '<' | '<=' ) term )* ; (Comparison operators)
   parseComparison(): ASTNode {
     const startToken = this.peek();
     let expr = this.parseTerm();
     while (this.matchValue('OPERATOR', '>', '>=', '<', '<=')) {
       const operator = this.previous().value;
       const right = this.parseTerm();
       expr = { type: 'BinaryExpression', operator, left: expr, right, line: startToken.line, column: startToken.column };
     }
     return expr;
   }

   // term -> factor ( ( '-' | '+' ) factor )* ; (Addition/Subtraction)
   parseTerm(): ASTNode {
     const startToken = this.peek();
     let expr = this.parseFactor();
     while (this.matchValue('OPERATOR', '-', '+')) {
       const operator = this.previous().value;
       const right = this.parseFactor();
       expr = { type: 'BinaryExpression', operator, left: expr, right, line: startToken.line, column: startToken.column };
     }
     return expr;
   }

   // factor -> unary ( ( '/' | '*' | '%' ) unary )* ; (Multiplication/Division/Modulo)
   parseFactor(): ASTNode {
     const startToken = this.peek();
     let expr = this.parseUnary();
     while (this.matchValue('OPERATOR', '/', '*', '%')) {
       const operator = this.previous().value;
       const right = this.parseUnary();
       expr = { type: 'BinaryExpression', operator, left: expr, right, line: startToken.line, column: startToken.column };
     }
     return expr;
   }

   // unary -> ( '!' | '-' | '+' | 'no3' | '++' | '--' ) unary | update ; (Unary operators, prefix increment/decrement)
   parseUnary(): ASTNode {
     const startToken = this.peek();
     // Check for prefix unary operators
     if (this.matchValue('OPERATOR', '!', '-', '+') || this.matchValue('KEYWORD', 'no3')) {
       const operator = this.previous().value;
       const argument = this.parseUnary(); // Recursively parse the operand
       return { type: 'UnaryExpression', operator, argument, prefix: true, line: startToken.line, column: startToken.column }; // prefix: true for unary ops
     }
      // Check for prefix increment/decrement
      if (this.matchValue('OPERATOR', '++', '--')) {
          const operator = this.previous().value;
          const argument = this.parseUpdate(); // Argument for update should be assignable (call/member/id)
           // Validate argument type for update expression
          if (argument.type !== 'Identifier' && argument.type !== 'MemberExpression') {
               throw this.error(startToken, `L'opérateur préfixé '${operator}' khass ykoun 9bel variable wla property.`);
          }
          return { type: 'UpdateExpression', operator, argument, prefix: true, line: startToken.line, column: startToken.column };
      }

     // If no prefix operator, parse postfix update expressions or higher precedence
     return this.parseUpdate();
   }

   // update -> call ( '++' | '--' )? ; (Postfix increment/decrement)
   parseUpdate(): ASTNode {
       const startToken = this.peek();
       // Parse the base expression (could be a call, member access, identifier, etc.)
       let expr = this.parseCall();

       // Check for postfix increment/decrement operators
       if (this.matchValue('OPERATOR', '++', '--')) {
           const operator = this.previous().value;
           // Validate that the base expression is assignable
           if (expr.type !== 'Identifier' && expr.type !== 'MemberExpression') {
               throw this.error(this.previous(), `L'opérateur postfixé '${operator}' khass yji ba3d variable wla property.`);
           }
           // Create UpdateExpression node for postfix operation
           expr = { type: 'UpdateExpression', operator, argument: expr, prefix: false, line: startToken.line, column: startToken.column };
       }

       return expr; // Return either the base expression or the UpdateExpression
   }


   // call -> primary ( '(' arguments? ')' | '.' IDENTIFIER | '[' expression ']' )* ;
   // Handles function calls, property access (.), and computed property access ([]).
   parseCall(): ASTNode {
       let expr = this.parsePrimary(); // Start with the highest precedence primary expression

       // Loop to handle chained calls and accesses: obj.prop().method()[index]
       while (true) {
           const loopStartToken = this.peek(); // Token at the start of the potential call/access
           if (this.matchValue('PUNCTUATION', '(')) { // Function call: expr(...)
               expr = this.finishCall(expr); // finishCall consumes ')'
           } else if (this.matchValue('PUNCTUATION', '.')) { // Member access: expr.ident
               const name = this.consume('IDENTIFIER', "Kan tsnna smia dyal property ba3d '.'.");
               const propertyNode: ASTNode = { type: 'Identifier', name: name.value, line: name.line, column: name.column };
               expr = { type: 'MemberExpression', object: expr, property: propertyNode, computed: false, line: expr.line, column: expr.column }; // Use expr's position
           } else if (this.matchValue('PUNCTUATION', '[')) { // Computed member access: expr[...]
               const propertyExpr = this.parseExpression();
               this.consumeValue('PUNCTUATION', ']', "Kan tsnna ']' ba3d index expression.");
               expr = { type: 'MemberExpression', object: expr, property: propertyExpr, computed: true, line: expr.line, column: expr.column }; // Use expr's position
           } else {
               break; // No more calls or accesses in the chain
           }
       }

       return expr;
   }

     // Helper for finishing a function call, parsing arguments.
     // Assumes '(' has already been consumed.
     finishCall(callee: ASTNode): ASTNode {
         const args: ASTNode[] = [];
         if (!this.checkValue('PUNCTUATION', ')')) { // Check if there are arguments
             do {
                 // Argument limit check (optional, for sanity)
                  if (args.length >= 255) {
                     this.error(this.peek(), "Ma ymknch tnadi b kter mn 255 arguments.");
                  }
                 // Parse each argument expression
                 args.push(this.parseExpression());
             } while (this.matchValue('PUNCTUATION', ',')); // Continue if there's a comma
         }
         // Consume the closing parenthesis
         this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' f lekher dyal arguments dyal function call.");

         // Return the CallExpression node
         return { type: 'CallExpression', callee, arguments: args, line: callee.line, column: callee.column }; // Use callee's position
     }


   // primary -> NUMBER | STRING | 's7i7' | 'kdb' | 'ghalat' | 'farkha' | 'mchmcha' | 'hadi'
   //         | IDENTIFIER | '(' expression ')' | 'jdid' call | functionExpression ;
   // Highest precedence: literals, identifiers, grouping, new expressions, function expressions.
   parsePrimary(): ASTNode {
     const token = this.peek();

     // Literals
     if (this.match('NUMBER')) return { type: 'NumericLiteral', value: this.previous().value, line: token.line, column: token.column };
     if (this.match('STRING')) return { type: 'StringLiteral', value: this.previous().value, line: token.line, column: token.column };
     if (this.match('BOOLEAN')) return { type: 'BooleanLiteral', value: this.previous().value, line: token.line, column: token.column };

     // Language Constants
     if (this.matchValue('KEYWORD', 'farkha')) return { type: 'NullLiteral', line: token.line, column: token.column };
     if (this.matchValue('KEYWORD', 'mchmcha')) return { type: 'UndefinedLiteral', line: token.line, column: token.column };
     if (this.matchValue('KEYWORD', 'hadi')) return { type: 'ThisExpression', line: token.line, column: token.column };

     // Identifier (could be variable, function name, etc.)
     if (this.match('IDENTIFIER')) {
        return { type: 'Identifier', name: this.previous().value, line: token.line, column: token.column };
     }

     // Grouping with Parentheses
     if (this.matchValue('PUNCTUATION', '(')) {
       const startLine = token.line;
       const startCol = token.column;
       const expr = this.parseExpression();
       this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d expression f west parentheses.");
       // Could return a 'GroupingExpression' node or just the inner expression directly.
       // Returning the inner expression is often simpler. Add line/col?
       // expr.line = startLine; expr.column = startCol; // Attach position to inner expr?
       return expr; // Return inner expression directly
     }

      // 'new' Expression
      if (this.matchValue('KEYWORD', 'jdid')) { // Handle 'jdid' keyword
          const startToken = this.previous();
          // Expecting the constructor (Identifier or MemberExpression) followed by arguments
          const callee = this.parseCall(); // Parse the constructor part (might include member access)

           // Check if it was followed by arguments (a CallExpression was parsed by parseCall)
           // Or if it was just the constructor name/expression.
           let args: ASTNode[] = [];
           let constructorCallee = callee;

            // If parseCall resulted in a CallExpression because of '()', extract args.
           // This logic is a bit tricky. Assumes `jdid Constructor()` structure.
            if (callee.type === 'CallExpression') {
                 args = callee.arguments ?? [];
                 constructorCallee = callee.callee!; // The actual constructor before the call ()
            } else {
                 // Handle `jdid Constructor` without arguments - check if '(' follows
                  if (this.checkValue('PUNCTUATION', '(')) {
                      // This suggests `jdid someExpr (args)` where someExpr wasn't parsed as a call initially.
                      // Re-parse as a call expression starting from the callee?
                      // Simpler: Assume `parseCall` correctly handles `Constructor()` part.
                      // If `parseCall` returned something other than CallExpression, and '(' follows,
                      // maybe it should be an error or needs refinement in `parseCall`.
                      // For now, assume `jdid Constructor` or `jdid Constructor()` are parsed correctly by parseCall.
                      // If `jdid Constructor` is valid, `args` remain empty.
                  }
            }


          return { type: 'NewExpression', callee: constructorCallee, arguments: args, line: startToken.line, column: startToken.column };
      }

       // Anonymous Function Expression
       if (this.matchValue('KEYWORD', 'dala')) {
           return this.parseFunctionExpression();
       }


     // If none of the primary expressions match, it's an error.
     throw this.error(token, "Expression mam fahmouch wella ma kamlch.");
   }

   // Parses an anonymous function expression: 'dala' '(' parameters? ')' blockStatement
   parseFunctionExpression(): ASTNode {
       const startToken = this.previous(); // 'dala' token
       // Anonymous functions don't have required names like declarations
       // Optional name: if (this.match('IDENTIFIER')) { name = ... }

       this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' l function expression.");
       const params: ASTNode[] = [];
       if (!this.checkValue('PUNCTUATION', ')')) {
           do {
               if (params.length >= 255) { this.error(this.peek(), "Kter mn 255 arguments."); }
               const paramToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal parameter.");
               params.push({ type: 'Identifier', name: paramToken.value, line: paramToken.line, column: paramToken.column });
           } while (this.matchValue('PUNCTUATION', ','));
       }
       this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d parameters.");

       const body = this.parseBlockStatement();
       if (body.type !== 'BlockStatement') { // Sanity check
            throw this.error(this.peek(), "Kan tsnna '{' l body dyal function expression.");
       }

       return {
           type: 'FunctionExpression', // Different type from FunctionDeclaration
           id: null, // Anonymous, or potentially an optional Identifier if supported
           params,
           body,
           line: startToken.line,
           column: startToken.column
       };
   }


  // --- Utility Methods ---

  // Checks if the current token is EOF.
  isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === 'EOF';
  }

  // Returns the current token without consuming it.
  peek(): Token {
     // Handle potential out-of-bounds access if current is at or beyond the end
     if (this.current >= this.tokens.length) {
         // Return a synthetic EOF token if needed, or rely on isAtEnd checks before calling peek.
         // Returning the last actual token might be misleading. Let's return EOF.
          const lastToken = this.tokens[this.tokens.length - 1]; // Get the actual EOF or last valid token
         return { type: 'EOF', value: null, line: lastToken?.line ?? 0, column: lastToken?.column ?? 0 };
     }
    return this.tokens[this.current];
  }

  // Returns the previous token.
  previous(): Token {
      // Should only be called after advance(), so current > 0.
      if (this.current === 0) {
          // This case should ideally not happen in normal parsing flow.
           // Return the first token or a dummy token?
           return this.tokens[0] || { type: 'ERROR', value: 'No previous token', line:0, column: 0 };
      }
    return this.tokens[this.current - 1];
  }

  // Consumes the current token and returns it.
  advance(): Token {
    if (!this.isAtEnd()) {
        this.current++;
    }
    return this.previous(); // Return the token that was just consumed
  }

  // Checks if the current token matches any of the given types.
  check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

   // Checks if the current token matches the given type and value.
   checkValue(type: string, value: any): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === type && token.value === value;
  }

  // Checks if the current token matches any of the given types. If yes, consumes it and returns true.
  match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

   // Checks if the current token matches the type and any of the given values. If yes, consumes it and returns true.
   matchValue(type: string, ...values: any[]): boolean {
    for (const value of values) {
       if (this.checkValue(type, value)) {
          this.advance();
          return true;
       }
    }
    return false;
  }


  // Consumes the current token if it matches the expected type, otherwise throws an error.
  consume(type: string, message: string): Token {
    if (this.check(type)) {
        return this.advance();
    }
    throw this.error(this.peek(), message); // Throw parser error
  }

   // Consumes the current token if it matches the expected type and value, otherwise throws an error.
   consumeValue(type: string, value: any, message: string): Token {
    if (this.checkValue(type, value)) {
        return this.advance();
    }
    throw this.error(this.peek(), message); // Throw parser error
  }


  // Creates and returns a parser error object (doesn't throw immediately here).
  // The caller (usually in the catch block) decides whether to throw or collect.
  error(token: Token, message: string): Error {
     const location = token.type === 'EOF' ? `la fin dyal code` : `"${String(token.value)}" (type ${token.type})`;
     const fullMessage = `Ghalat f Parser [Ln ${token.line}, Col ${token.column}]: ${message}. L9it ${location}.`;
     // Returning an Error object allows the caller to decide how to handle it.
     return new Error(fullMessage);
   }

    // Basic error recovery: Advance tokens until a likely statement boundary is found.
    synchronize() {
        this.advance(); // Consume the token that caused the error

        while (!this.isAtEnd()) {
            // If the previous token was a semicolon, we might be at a safe point to resume.
            if (this.previous().type === 'PUNCTUATION' && this.previous().value === ';') {
                return;
            }

            // Check if the current token could potentially start a new statement or declaration.
            switch (this.peek().type) {
                case 'KEYWORD':
                    // Keywords that reliably start statements/declarations
                    switch(this.peek().value) {
                        case 'tabit':
                        case 'bdl':
                        case 'dala': // Function declaration
                        case 'ila': // If statement
                        case 'douz': // For loop
                        case 'madamt': // While loop
                        case 'dir': // Do-while loop start
                        case 'jrb': // Try statement
                        case 'bdl3la': // Switch statement
                        case 'rj3': // Return statement
                        case 'wa9f': // Break statement
                        case 'kamml': // Continue statement
                            return; // Good recovery point
                    }
                    break;
                 case 'PUNCTUATION':
                     // A closing brace might end a block, potentially a recovery point? Risky.
                     // An opening brace always starts a block statement.
                     if (this.peek().value === '{') return;
                     break;

                 // Other potential recovery points could be added, but keywords are often the safest.
            }

            this.advance(); // Keep consuming tokens until a recovery point or EOF is found.
        }
    }
}

// --- Exported Parse Function ---
// Takes tokens from the tokenizer and returns the root AST node (Program).

export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens);
  return parser.parse();
}
