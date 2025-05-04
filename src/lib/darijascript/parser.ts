
// A simplified recursive descent parser for DarijaScript
// This is a basic implementation and might need significant refinement
// based on the full language grammar and operator precedence rules.

interface Token {
  type: string;
  value: any;
  line: number;
  column: number;
}

export interface ASTNode {
  type: string;
  value?: any;
  name?: string;
  body?: ASTNode[];
  kind?: string; // 'tabit' or 'bdl' for VariableDeclaration
  initializer?: ASTNode;
  id?: ASTNode; // Identifier for VariableDeclarator
  left?: ASTNode;
  right?: ASTNode;
  operator?: string;
  argument?: ASTNode;
  prefix?: boolean; // For UpdateExpression
  callee?: ASTNode;
  arguments?: ASTNode[];
  params?: ASTNode[]; // For FunctionDeclaration
  test?: ASTNode;
  consequent?: ASTNode; // BlockStatement or single statement
  alternate?: ASTNode; // BlockStatement or single statement or IfStatement
  init?: ASTNode; // For ForStatement
  update?: ASTNode; // For ForStatement
  block?: ASTNode; // For TryStatement
  handler?: ASTNode; // CatchClause for TryStatement
  finalizer?: ASTNode; // BlockStatement for TryStatement
  param?: ASTNode; // Identifier for CatchClause
  object?: ASTNode; // For MemberExpression
  property?: ASTNode; // For MemberExpression
  computed?: boolean; // For MemberExpression
  discriminant?: ASTNode; // For SwitchStatement
  cases?: ASTNode[]; // For SwitchStatement (SwitchCase nodes)
  consequentList?: ASTNode[]; // Used internally for SwitchCase consequent

  // Error property for parser errors
  error?: string;
  line?: number;
  column?: number;
}

// --- Parser Class ---

class Parser {
  tokens: Token[];
  current: number = 0;
  errors: string[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'COMMENT'); // Assuming tokenizer provides these
  }

  parse(): ASTNode {
    const body: ASTNode[] = [];
    while (!this.isAtEnd()) {
      try {
          body.push(this.parseDeclaration() || this.parseStatement());
      } catch (error: any) {
          const errorMessage = error.message || "Erreur d'analyse inconnue.";
          this.errors.push(errorMessage);
          console.error("Parser Error:", error);
          // Attempt to synchronize - find the next semicolon or potential statement start
          this.synchronize();
          // Optionally return an error node or just continue if synchronization works
          // body.push({ type: 'ParseError', value: errorMessage, line: this.peek().line, column: this.peek().column });
          if (this.isAtEnd()) break; // Stop if synchronization leads to the end
      }
    }

     if (this.errors.length > 0) {
        // Return a special Program node indicating errors
        return {
            type: 'Program',
            body: body, // Include partially parsed body if desired
            error: `Erreurs d'analyse: ${this.errors.join('; ')}`
        };
     }


    return { type: 'Program', body };
  }

  // --- Utility Methods ---

  peek(): Token {
    return this.tokens[this.current];
  }

  previous(): Token {
    return this.tokens[this.current - 1];
  }

  isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

   checkValue(type: string, value: any): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type && this.peek().value === value;
  }

  advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  matchValue(type: string, ...values: any[]): boolean {
    for (const value of values) {
       if (this.checkValue(type, value)) {
          this.advance();
          return true;
       }
    }
    return false;
  }


  consume(type: string, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

   consumeValue(type: string, value: any, message: string): Token {
    if (this.checkValue(type, value)) return this.advance();
    throw this.error(this.peek(), message);
  }


  error(token: Token, message: string): Error {
     const loc = token.type === 'EOF' ? `la fin` : `"${token.value}" (type ${token.type})`;
     const fullMessage = `[Ln ${token.line}, Col ${token.column}] ${message}. L9it ${loc}.`;
     // Instead of directly throwing, maybe collect errors?
     // For now, throwing to stop parsing on first error.
     return new Error(fullMessage);
   }

    // Basic error recovery: Skip tokens until a potential statement boundary
    synchronize() {
        this.advance(); // Consume the token that caused the error

        while (!this.isAtEnd()) {
            // If the previous token was a semicolon, we might be at a good spot
            if (this.previous().type === 'PUNCTUATION' && this.previous().value === ';') return;

            // Check if the current token could start a new statement
            switch (this.peek().type) {
                case 'KEYWORD':
                    switch(this.peek().value) {
                        case 'tabit':
                        case 'bdl':
                        case 'dala':
                        case 'ila':
                        case 'douz':
                        case 'madamt':
                        case 'dir':
                        case 'jrb':
                        case 'rj3':
                        case 'wa9f':
                        case 'kamml':
                        case 'bdl3la':
                            return; // Likely start of a new statement
                    }
                    break;
                 case 'IDENTIFIER': // Could be a function call or assignment
                     // Heuristic: if followed by '(', it's likely a call statement.
                     // If followed by '=', it's assignment. Might be too simple.
                     // For now, just break the loop on identifier as a potential start.
                     // This might skip valid expressions if they start with identifiers.
                     // if (this.tokens[this.current + 1]?.value === '(' || this.tokens[this.current + 1]?.value === '=') {
                     //     return;
                     // }
                     // Simplifying: treat any identifier as a potential start
                     // return; // This might be too aggressive
                     break;
                 case 'PUNCTUATION':
                     if (this.peek().value === '{') return; // Start of a block
                     break;

                 // Can add more recovery points here
            }

            this.advance(); // Keep consuming tokens
        }
    }

  // --- Parsing Rules ---

  // declaration -> varDeclaration | funDeclaration | statement ;
  parseDeclaration(): ASTNode | null {
    if (this.matchValue('KEYWORD', 'tabit', 'bdl')) {
      return this.parseVariableDeclaration(this.previous().value);
    }
     if (this.matchValue('KEYWORD', 'dala')) {
      return this.parseFunctionDeclaration();
    }
    // No declaration found, return null to try parsing a statement
    return null;
  }

  // varDeclaration -> ('tabit' | 'bdl') IDENTIFIER ('=' expression)? ';' ;
  parseVariableDeclaration(kind: string): ASTNode {
    const nameToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal variable");
    let initializer: ASTNode | undefined = undefined;
    if (this.matchValue('OPERATOR', '=')) {
      initializer = this.parseExpression();
    }
    this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal declaration.");
    return {
      type: 'VariableDeclaration',
      kind: kind, // 'tabit' or 'bdl'
      id: { type: 'Identifier', name: nameToken.value },
      initializer: initializer
    };
  }

   // funDeclaration -> 'dala' IDENTIFIER '(' parameters? ')' blockStatement ;
   // parameters -> IDENTIFIER (',' IDENTIFIER)* ;
   parseFunctionDeclaration(): ASTNode {
     const name = this.consume('IDENTIFIER', "Kan tsnna smia dyal dala.");
     this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d smia dyal dala.");
     const params: ASTNode[] = [];
     if (!this.checkValue('PUNCTUATION', ')')) {
       do {
         if (params.length >= 255) {
            this.error(this.peek(), "Ma ymknch ykoun kter mn 255 arguments.");
         }
         params.push({ type: 'Identifier', name: this.consume('IDENTIFIER', "Kan tsnna smia dyal parameter.").value });
       } while (this.matchValue('PUNCTUATION', ','));
     }
     this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d parameters.");
     this.consumeValue('PUNCTUATION', '{', "Kan tsnna '{' qbel body dyal dala.");
     const body = this.parseBlockStatement();
     return { type: 'FunctionDeclaration', id: { type: 'Identifier', name: name.value }, params, body };
   }


  // statement -> exprStatement | ifStatement | whileStatement | forStatement | blockStatement | returnStatement | breakStatement | continueStatement | tryStatement | switchStatement ;
  parseStatement(): ASTNode {
     if (this.matchValue('KEYWORD', 'ila')) return this.parseIfStatement();
     if (this.matchValue('KEYWORD', 'madamt')) return this.parseWhileStatement();
      if (this.matchValue('KEYWORD', 'dir')) return this.parseDoWhileStatement();
     if (this.matchValue('KEYWORD', 'douz')) return this.parseForStatement();
      if (this.matchValue('KEYWORD', 'jrb')) return this.parseTryStatement();
      if (this.matchValue('KEYWORD', 'bdl3la')) return this.parseSwitchStatement();
      if (this.matchValue('KEYWORD', 'rj3')) return this.parseReturnStatement();
      if (this.matchValue('KEYWORD', 'wa9f')) return this.parseBreakStatement();
      if (this.matchValue('KEYWORD', 'kamml')) return this.parseContinueStatement();
     if (this.matchValue('PUNCTUATION', '{')) return this.parseBlockStatement();

    // Default to expression statement
    return this.parseExpressionStatement();
  }

  // exprStatement -> expression ';' ;
  parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    // Allow omitting semicolon for the last statement in a block or program?
    // For simplicity, require it for now.
    this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal expression.");
    return { type: 'ExpressionStatement', expression: expr }; // Wrapper node might be useful
  }

  // blockStatement -> '{' declaration* '}' ;
  parseBlockStatement(): ASTNode {
    const body: ASTNode[] = [];
    while (!this.checkValue('PUNCTUATION', '}') && !this.isAtEnd()) {
        body.push(this.parseDeclaration() || this.parseStatement());
    }
    this.consumeValue('PUNCTUATION', '}', "Kan tsnna '}' f lekher dyal block.");
    return { type: 'BlockStatement', body };
  }

  // ifStatement -> 'ila' '(' expression ')' statement ('ella' statement)? ;
  parseIfStatement(): ASTNode {
    this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'ila'.");
    const test = this.parseExpression();
    this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");

    const consequent = this.parseStatement();
    let alternate: ASTNode | undefined = undefined;
    if (this.matchValue('KEYWORD', 'ella')) {
      alternate = this.parseStatement();
    }

    return { type: 'IfStatement', test, consequent, alternate };
  }

  // whileStatement -> 'madamt' '(' expression ')' statement ;
  parseWhileStatement(): ASTNode {
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'madamt'.");
      const test = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");
      const body = this.parseStatement();
      return { type: 'WhileStatement', test, body };
  }

  // doWhileStatement -> 'dir' statement 'madamt' '(' expression ')' ';' ;
  parseDoWhileStatement(): ASTNode {
      const body = this.parseStatement();
      this.consumeValue('KEYWORD', 'madamt', "Kan tsnna 'madamt' ba3d body dyal do-while.");
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'madamt'.");
      const test = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");
      this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal do-while statement.");
      return { type: 'DoWhileStatement', body, test };
  }

  // forStatement -> 'douz' '(' (varDeclaration | exprStatement | ';') expression? ';' expression? ')' statement ;
  parseForStatement(): ASTNode {
    this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'douz'.");

    let init: ASTNode | null = null;
    if (this.matchValue('PUNCTUATION', ';')) {
      // No initializer
    } else if (this.matchValue('KEYWORD', 'tabit', 'bdl')) {
      init = this.parseVariableDeclaration(this.previous().value);
      // parseVariableDeclaration consumes the semicolon, adjust logic if needed
    } else {
      init = this.parseExpressionStatement(); // Consumes semicolon
    }
     // If init was varDecl or exprStmt, semicolon was already consumed.
     // If init was ';', we consumed it. So, proceed to condition.

    let test: ASTNode | null = null;
    if (!this.checkValue('PUNCTUATION', ';')) {
      test = this.parseExpression();
    }
    this.consumeValue('PUNCTUATION', ';', "Kan tsnna ';' ba3d loop condition.");

    let update: ASTNode | null = null;
    if (!this.checkValue('PUNCTUATION', ')')) {
      update = this.parseExpression();
    }
    this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d clauses dyal for.");

    const body = this.parseStatement();

    return { type: 'ForStatement', init, test, update, body };
  }

  // tryStatement -> 'jrb' blockStatement ( catchClause | finallyClause | catchClause finallyClause ) ;
  // catchClause -> 'msk' '(' IDENTIFIER ')' blockStatement ;
  // finallyClause -> 'fakhr' blockStatement ;
  parseTryStatement(): ASTNode {
      const block = this.parseBlockStatement();
      let handler: ASTNode | null = null;
      let finalizer: ASTNode | null = null;

      if (this.matchValue('KEYWORD', 'msk')) {
          this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'msk'.");
          const param: ASTNode = { type: 'Identifier', name: this.consume('IDENTIFIER', "Kan tsnna smia dyal error variable.").value };
          this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d error variable.");
          const catchBody = this.parseBlockStatement();
          handler = { type: 'CatchClause', param, body: catchBody };
      }

      if (this.matchValue('KEYWORD', 'fakhr')) {
          finalizer = this.parseBlockStatement();
      }

      // A try statement must have at least a catch or a finally block
      if (!handler && !finalizer) {
          throw this.error(this.peek(), "Try statement khass ykoun 3ndo 'msk' wla 'fakhr'.");
      }

      return { type: 'TryStatement', block, handler, finalizer };
  }

  // switchStatement -> 'bdl3la' '(' expression ')' '{' switchCase* '}' ;
  // switchCase -> ('7ala' expression ':' | '3adi' ':') statement* ;
  parseSwitchStatement(): ASTNode {
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'bdl3la'.");
      const discriminant = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d switch expression.");
      this.consumeValue('PUNCTUATION', '{', "Kan tsnna '{' qbel switch cases.");

      const cases: ASTNode[] = [];
      while (!this.checkValue('PUNCTUATION', '}') && !this.isAtEnd()) {
          let test: ASTNode | null = null; // null for default case
          if (this.matchValue('KEYWORD', '7ala')) {
              test = this.parseExpression();
              this.consumeValue('PUNCTUATION', ':', "Kan tsnna ':' ba3d '7ala' expression.");
          } else if (this.matchValue('KEYWORD', '3adi')) {
              this.consumeValue('PUNCTUATION', ':', "Kan tsnna ':' ba3d '3adi'.");
          } else {
               throw this.error(this.peek(), "Kan tsnna '7ala' wla '3adi' f switch block.");
          }

          const consequent: ASTNode[] = [];
          while (!this.isAtEnd() && !this.checkValue('PUNCTUATION', '}') && !this.checkValue('KEYWORD', '7ala') && !this.checkValue('KEYWORD', '3adi')) {
              // Allow declarations or statements within a case
              consequent.push(this.parseDeclaration() || this.parseStatement());
          }
          cases.push({ type: 'SwitchCase', test, consequent });
      }

      this.consumeValue('PUNCTUATION', '}', "Kan tsnna '}' f lekher dyal switch statement.");
      return { type: 'SwitchStatement', discriminant, cases };
  }


  // returnStatement -> 'rj3' expression? ';' ;
  parseReturnStatement(): ASTNode {
     let value: ASTNode | undefined = undefined;
     if (!this.checkValue('PUNCTUATION', ';')) {
       value = this.parseExpression();
     }
     this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d return value.");
     return { type: 'ReturnStatement', argument: value };
   }

    // breakStatement -> 'wa9f' ';' ;
   parseBreakStatement(): ASTNode {
       this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d 'wa9f'.");
       return { type: 'BreakStatement' };
   }

   // continueStatement -> 'kamml' ';' ;
   parseContinueStatement(): ASTNode {
        this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d 'kamml'.");
        return { type: 'ContinueStatement' };
   }

   // throwStatement -> 'rmmi' expression ';' ; // Represented by CallExpression in Interpreter
   // We don't parse 'rmmi' as a statement here, it's treated like a function call expression.
   // The interpreter handles the CallExpression for 'rmmi' by throwing.


  // expression -> assignment ;
  parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  // assignment -> IDENTIFIER '=' assignment | logic_or ;
  parseAssignment(): ASTNode {
      const expr = this.parseLogicalOr(); // Parse higher precedence first

      if (this.matchValue('OPERATOR', '=')) {
          const equals = this.previous(); // The '=' token
          const value = this.parseAssignment(); // Right-associative

          if (expr.type === 'Identifier') {
              return { type: 'AssignmentExpression', operator: equals.value, left: expr, right: value };
          } else if (expr.type === 'MemberExpression') {
               // Handle assignment to properties like obj.prop = value or arr[0] = value
              return { type: 'AssignmentExpression', operator: equals.value, left: expr, right: value };
          }
           // Invalid assignment target
           throw this.error(equals, "Assignment target ماشي valid.");
      }

      return expr; // Not an assignment
  }


  // logic_or -> logic_and ( '||' logic_and )* ;
  parseLogicalOr(): ASTNode {
      let expr = this.parseLogicalAnd();
      while (this.matchValue('OPERATOR', '||')) {
          const operator = this.previous().value;
          const right = this.parseLogicalAnd();
          expr = { type: 'BinaryExpression', operator, left: expr, right }; // Or LogicalExpression type
      }
      return expr;
  }

  // logic_and -> equality ( '&&' equality )* ;
  parseLogicalAnd(): ASTNode {
      let expr = this.parseEquality();
      while (this.matchValue('OPERATOR', '&&')) {
          const operator = this.previous().value;
          const right = this.parseEquality();
          expr = { type: 'BinaryExpression', operator, left: expr, right }; // Or LogicalExpression type
      }
      return expr;
  }

  // equality -> comparison ( ( '!=' | '==' | '!==' | '===' ) comparison )* ; // Added strict equality
  parseEquality(): ASTNode {
    let expr = this.parseComparison();
    while (this.matchValue('OPERATOR', '!=', '==', '!==', '===')) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  // comparison -> term ( ( '>' | '>=' | '<' | '<=' ) term )* ;
  parseComparison(): ASTNode {
    let expr = this.parseTerm();
    while (this.matchValue('OPERATOR', '>', '>=', '<', '<=')) {
      const operator = this.previous().value;
      const right = this.parseTerm();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  // term -> factor ( ( '-' | '+' ) factor )* ;
  parseTerm(): ASTNode {
    let expr = this.parseFactor();
    while (this.matchValue('OPERATOR', '-', '+')) {
      const operator = this.previous().value;
      const right = this.parseFactor();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  // factor -> unary ( ( '/' | '*' | '%' ) unary )* ; // Added modulo
  parseFactor(): ASTNode {
    let expr = this.parseUnary();
    while (this.matchValue('OPERATOR', '/', '*', '%')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  // unary -> ( '!' | '-' | 'no3' | '++' | '--' ) unary | update ; // Added typeof, prefix ++/--
  parseUnary(): ASTNode {
    if (this.matchValue('OPERATOR', '!', '-', '++','--') || this.matchValue('KEYWORD', 'no3')) {
      const operator = this.previous().value;
      const right = this.parseUnary(); // Recursively parse the operand
      const prefix = (operator === '++' || operator === '--'); // Mark if it's prefix update
      return { type: prefix ? 'UpdateExpression' : 'UnaryExpression', operator, argument: right, prefix: prefix };
    }
    return this.parseUpdate(); // Or callExpression if update handles postfix
  }

  // update -> call ( '++' | '--' )? ; // Handles postfix ++/--
  parseUpdate(): ASTNode {
      let expr = this.parseCall();

      if (this.matchValue('OPERATOR', '++', '--')) {
          const operator = this.previous().value;
          // Ensure the target is assignable (Identifier or MemberExpression)
          if (expr.type !== 'Identifier' && expr.type !== 'MemberExpression') {
               throw this.error(this.previous(), `L'opérateur '${operator}' khass ykoun m3a variable wla property.`);
          }
          expr = { type: 'UpdateExpression', operator, argument: expr, prefix: false };
      }

      return expr;
  }

  // call -> primary ( '(' arguments? ')' | '.' IDENTIFIER | '[' expression ']' )* ;
  // arguments -> expression ( ',' expression )* ;
  parseCall(): ASTNode {
      let expr = this.parsePrimary();

      while (true) {
          if (this.matchValue('PUNCTUATION', '(')) { // Function call
              expr = this.finishCall(expr);
          } else if (this.matchValue('PUNCTUATION', '.')) { // Member access
              const name = this.consume('IDENTIFIER', "Kan tsnna smia dyal property ba3d '.'.");
              // Check if the name is a keyword that represents a property or method
              const propertyType = this.isBuiltinPropertyOrMethod(name.value)
              expr = { type: 'MemberExpression', object: expr, property: { type: propertyType, name: name.value }, computed: false };
          } else if (this.matchValue('PUNCTUATION', '[')) { // Computed member access
               const property = this.parseExpression();
               this.consumeValue('PUNCTUATION', ']', "Kan tsnna ']' ba3d index.");
               expr = { type: 'MemberExpression', object: expr, property: property, computed: true };
          }
          else {
              break; // Not a call or member access
          }
      }

      return expr;
  }

    finishCall(callee: ASTNode): ASTNode {
        const args: ASTNode[] = [];
        if (!this.checkValue('PUNCTUATION', ')')) {
            do {
                // Allow up to 255 arguments
                 if (args.length >= 255) {
                    this.error(this.peek(), "Ma ymknch tnadi b kter mn 255 arguments.");
                 }
                args.push(this.parseExpression());
            } while (this.matchValue('PUNCTUATION', ','));
        }
        this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' f lekher dyal arguments.");
        return { type: 'CallExpression', callee, arguments: args };
    }

     isBuiltinPropertyOrMethod(name: string): string {
         // This is a simplification. Ideally, the tokenizer marks these.
         const builtins = [
           'tbe3', 'nadi', 'sowel', 'tsawal', 'ghlat', 'nbehh', 'rmmi',
           't7t', 'fo9', 'dour', 'tsarraf', 'kbar', 'sghar', 'mnfi', 'rf3', 'jdr',
           'ns', 'kbr7rf', 'sghr7rf', 'kayn', 'twil',
           'zid', '7yed', '7yedmnlwla', 'zidfllwla', 'dwr', 'n9i', 'lfech', 'l9a', 'lmmaj',
           'mfatih', 'qiyam',
           'daba', 'wa9t', '3am', 'chhr', 'nhar',
           'sta9', 'krr'
         ];
         if (builtins.includes(name)) return 'BUILTIN_METHOD'; // Assume method for now
         // Check for properties like 'twil'
         if (name === 'twil') return 'BUILTIN_PROPERTY';

         return 'IDENTIFIER'; // Default to regular identifier
     }


  // primary -> NUMBER | STRING | 's7i7' | 'ghalat' | 'farkha' | 'mchmcha' | 'hadi'
  //         | IDENTIFIER | '(' expression ')' | 'jdid' call ;
  parsePrimary(): ASTNode {
    if (this.match('NUMBER')) return { type: 'NumericLiteral', value: this.previous().value };
    if (this.match('STRING')) return { type: 'StringLiteral', value: this.previous().value };
    if (this.match('BOOLEAN')) return { type: 'BooleanLiteral', value: this.previous().value };

     if (this.matchValue('KEYWORD', 'farkha')) return { type: 'NullLiteral' };
     if (this.matchValue('KEYWORD', 'mchmcha')) return { type: 'UndefinedLiteral' };
     if (this.matchValue('KEYWORD', 'hadi')) return { type: 'ThisExpression' }; // Represent 'hadi'

    if (this.match('IDENTIFIER') || this.match('BUILTIN_FUNCTION')) { // Treat built-in function names as identifiers at this stage
        // Check if it's 'rmmi' which acts like throw
       // if (this.previous().value === 'rmmi') {
           // This might be complex. 'rmmi(error)' looks like a CallExpression.
           // Let parseCall handle it. If rmmi is used without (), it's an error later.
       // }
       return { type: 'Identifier', name: this.previous().value };
    }

    if (this.matchValue('PUNCTUATION', '(')) {
      const expr = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d expression.");
      return { type: 'GroupingExpression', expression: expr }; // Maybe just return expr directly
    }

     if (this.matchValue('KEYWORD', 'jdid')) { // Handle 'jdid' keyword for 'new'
         const callee = this.parsePrimary(); // Expecting constructor name (Identifier)
         // `parseCall` will handle the arguments if present
         if (this.checkValue('PUNCTUATION', '(')) {
            const callExpr = this.finishCall(callee);
             return { type: 'NewExpression', callee: callExpr.callee, arguments: callExpr.arguments };
         } else {
              // Allow `jdid ConstructorName` without arguments? JS does.
              return { type: 'NewExpression', callee: callee, arguments: [] };
         }
     }

    // If none of the above match, it's an error
    throw this.error(this.peek(), "Kan tsnna chi expression.");
  }
}

// --- Exported Parse Function ---

export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens);
  return parser.parse();
}

    