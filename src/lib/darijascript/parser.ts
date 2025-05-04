
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
  consequent?: ASTNode[] | ASTNode; // Main block/statement for IfStatement, SwitchCase - Changed to allow single node for If
  alternate?: ASTNode;     // Else block for IfStatement, alternate for ConditionalExpression
  init?: ASTNode | null;   // Initializer in ForStatement (can be null)
  update?: ASTNode | null; // Update expression in ForStatement (can be null)
  block?: ASTNode;         // Main block for TryStatement
  handler?: ASTNode | null;// CatchClause node for TryStatement (msk block) (can be null)
  finalizer?: ASTNode | null;// Finally BlockStatement for TryStatement (fakhr block) (can be null)
  param?: ASTNode | null;  // Error parameter Identifier for CatchClause (can be null)
  object?: ASTNode;        // Object being accessed in MemberExpression
  property?: ASTNode;      // Property being accessed in MemberExpression
  computed?: boolean;      // True if MemberExpression uses `[]`, false for `.`
  discriminant?: ASTNode;  // Expression being switched on in SwitchStatement
  cases?: ASTNode[];       // Array of SwitchCase nodes for SwitchStatement
  value?: any;             // Literal value for NumericLiteral, StringLiteral, BooleanLiteral
  elements?: (ASTNode | null)[]; // Elements in an ArrayExpression (can have empty slots)

  // Special property for parser errors within the Program node
  error?: string;
}


// --- Parser Class ---

class Parser {
  tokens: Token[];
  current: number = 0; // Index of the next token to process
  errors: string[] = []; // Collect multiple errors? For now, usually stops on first.

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'COMMENT' && t.type !== 'ERROR');
     const errorToken = tokens.find(t => t.type === 'ERROR');
     if (errorToken) {
          this.errors.push(`Ghalat men Tokenizer [Ln ${errorToken.line}, Col ${errorToken.column}]: ${errorToken.value}`);
     }
  }

  // --- Entry Point ---
  parse(): ASTNode {
     if (this.errors.length > 0) {
         return { type: 'Program', body: [], error: this.errors[0], line: 1, column: 0 };
     }
    const body: ASTNode[] = [];
    const startToken = this.peek();
    while (!this.isAtEnd()) {
      try {
          const node = this.parseDeclaration() || this.parseStatement();
          if (node) {
              body.push(node);
          } else if (!this.isAtEnd()) {
              throw this.error(this.peek(), "Expression wella statement mam fahmouch.");
          }
      } catch (error: any) {
          const errorMessage = error.message || "Erreur d'analyse inconnue.";
          this.errors.push(errorMessage);
          console.error("Parser Error:", error);
          this.synchronize();
          if (this.isAtEnd()) break;
      }
    }
     const programNode: ASTNode = { type: 'Program', body, line: startToken.line, column: startToken.column };
     if (this.errors.length > 0) {
        programNode.error = `Erreurs d'analyse: ${this.errors.join('; ')}`;
     }
    return programNode;
  }

  // --- Parsing Rules (Methods) ---

  parseDeclaration(): ASTNode | null {
    const currentToken = this.peek();
    if (this.matchValue('KEYWORD', 'tabit', 'bdl')) {
      return this.parseVariableDeclaration(this.previous().value);
    }
     if (this.matchValue('KEYWORD', 'dala')) {
      return this.parseFunctionDeclaration();
    }
    return null;
  }

  parseStatement(): ASTNode {
     const currentToken = this.peek();
     if (this.matchValue('KEYWORD', 'ila')) return this.parseIfStatement();
     if (this.matchValue('KEYWORD', 'madamt')) return this.parseWhileStatement();
     if (this.matchValue('KEYWORD', 'dir')) return this.parseDoWhileStatement();
     if (this.matchValue('KEYWORD', 'douz')) return this.parseForStatement();
     if (this.matchValue('KEYWORD', 'jrb')) return this.parseTryStatement();
     if (this.matchValue('KEYWORD', 'bdl3la')) return this.parseSwitchStatement();
     if (this.matchValue('KEYWORD', 'rj3')) return this.parseReturnStatement();
     if (this.matchValue('KEYWORD', 'wa9f')) return this.parseBreakStatement();
     if (this.matchValue('KEYWORD', 'kamml')) return this.parseContinueStatement();
     if (this.checkValue('PUNCTUATION', '{')) return this.parseBlockStatement();
     return this.parseExpressionStatement();
  }

  parseBlockStatement(): ASTNode {
    const startToken = this.consumeValue('PUNCTUATION', '{', "Kan tsnna '{' bach nbda block.");
    const body: ASTNode[] = [];
    while (!this.checkValue('PUNCTUATION', '}') && !this.isAtEnd()) {
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

  parseExpressionStatement(requireSemicolon: boolean = true): ASTNode {
    const startToken = this.peek();
    const expr = this.parseExpression();
    if (requireSemicolon) {
        this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal statement.");
    } else {
        this.matchValue('PUNCTUATION', ';'); // Optionally consume semicolon
    }
    return { type: 'ExpressionStatement', expression: expr, line: startToken.line, column: startToken.column };
  }

  parseVariableDeclaration(kind: string): ASTNode {
      const startToken = this.previous();
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
              line: nameToken.line,
              column: nameToken.column
          });
      } while (this.matchValue('PUNCTUATION', ','));
      this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal declaration dyal variable.");
      return { type: 'VariableDeclaration', kind, declarations, line: startToken.line, column: startToken.column };
  }

   parseFunctionDeclaration(): ASTNode {
     const startToken = this.previous();
     const name = this.consume('IDENTIFIER', "Kan tsnna smia dyal dala.");
     const identifierNode: ASTNode = { type: 'Identifier', name: name.value, line: name.line, column: name.column };
     this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d smia dyal dala.");
     const params: ASTNode[] = [];
     if (!this.checkValue('PUNCTUATION', ')')) {
       do {
         if (params.length >= 255) { this.error(this.peek(), "Ma ymknch ykoun kter mn 255 arguments."); }
         const paramToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal parameter.");
         params.push({ type: 'Identifier', name: paramToken.value, line: paramToken.line, column: paramToken.column });
       } while (this.matchValue('PUNCTUATION', ','));
     }
     this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d parameters.");
     const body = this.parseBlockStatement();
     if (body.type !== 'BlockStatement') {
          throw this.error(this.peek(), "Kan tsnna '{' l body dyal dala.");
     }
     return { type: 'FunctionDeclaration', id: identifierNode, params, body, line: startToken.line, column: startToken.column };
   }

  parseIfStatement(): ASTNode {
    const startToken = this.previous(); // 'ila' or 'wa9ila' token
    this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'ila'/'wa9ila'.");
    const test = this.parseExpression();
    this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");
    const consequent = this.parseStatement(); // Consequent can be single statement or block

    let alternate: ASTNode | undefined = undefined;
    if (this.matchValue('KEYWORD', 'ella')) {
      alternate = this.parseStatement();
      // After an 'ella', we shouldn't have a 'wa9ila' immediately following
      if (this.checkValue('KEYWORD', 'wa9ila')) {
          throw this.error(this.peek(), "'wa9ila' ma ymknch tji mora 'ella'.");
      }
    } else if (this.matchValue('KEYWORD', 'wa9ila')) { // Handle 'else if' (wa9ila)
        // Recursively parse the next 'if' statement started by 'wa9ila'
        alternate = this.parseIfStatement();
    }

    return { type: 'IfStatement', test, consequent, alternate, line: startToken.line, column: startToken.column };
}


  parseWhileStatement(): ASTNode {
       const startToken = this.previous();
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'madamt'.");
      const test = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");
      const body = this.parseStatement();
      return { type: 'WhileStatement', test, body, line: startToken.line, column: startToken.column };
  }

  parseDoWhileStatement(): ASTNode {
      const startToken = this.previous();
      const body = this.parseStatement();
      this.consumeValue('KEYWORD', 'madamt', "Kan tsnna 'madamt' ba3d body dyal do-while.");
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'madamt'.");
      const test = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d condition.");
      this.consumeValue('PUNCTUATION', ';', "Khass ';' f lekher dyal do-while statement.");
      return { type: 'DoWhileStatement', body, test, line: startToken.line, column: startToken.column };
  }

  parseForStatement(): ASTNode {
    const startToken = this.previous();
    this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'douz'.");
    let init: ASTNode | null = null;
    if (this.matchValue('PUNCTUATION', ';')) {}
    else if (this.matchValue('KEYWORD', 'tabit', 'bdl')) { init = this.parseVariableDeclarationForLoop(this.previous().value); }
    else { init = this.parseExpressionStatementForLoop(); }
    let test: ASTNode | null = null;
    if (!this.checkValue('PUNCTUATION', ';')) { test = this.parseExpression(); }
    this.consumeValue('PUNCTUATION', ';', "Kan tsnna ';' ba3d loop condition.");
    let update: ASTNode | null = null;
    if (!this.checkValue('PUNCTUATION', ')')) { update = this.parseExpression(); }
    this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d clauses dyal for.");
    const body = this.parseStatement();
    return { type: 'ForStatement', init, test, update, body, line: startToken.line, column: startToken.column };
  }

  parseVariableDeclarationForLoop(kind: string): ASTNode {
      const startToken = this.previous();
       const declarations: ASTNode[] = [];
        do {
            const nameToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal variable f for loop init.");
            let initializer: ASTNode | undefined = undefined;
            if (this.matchValue('OPERATOR', '=')) { initializer = this.parseExpression(); }
            declarations.push({
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: nameToken.value, line: nameToken.line, column: nameToken.column },
                initializer, line: nameToken.line, column: nameToken.column
            });
        } while (this.matchValue('PUNCTUATION', ','));
       this.consumeValue('PUNCTUATION', ';', "Kan tsnna ';' ba3d variable declaration f for loop init.");
        return { type: 'VariableDeclaration', kind, declarations, line: startToken.line, column: startToken.column };
  }

  parseExpressionStatementForLoop(): ASTNode {
       const startToken = this.peek();
       const expr = this.parseExpression();
       this.consumeValue('PUNCTUATION', ';', "Kan tsnna ';' ba3d expression f for loop init.");
       return { type: 'ExpressionStatement', expression: expr, line: startToken.line, column: startToken.column };
  }

  parseTryStatement(): ASTNode {
      const startToken = this.previous();
      const block = this.parseBlockStatement();
      let handler: ASTNode | null = null;
      let finalizer: ASTNode | null = null;
      if (this.matchValue('KEYWORD', 'msk')) {
          const catchStartToken = this.previous();
          let param: ASTNode | null = null;
          if (this.matchValue('PUNCTUATION', '(')) {
              const paramToken = this.consume('IDENTIFIER', "Kan tsnna smia dyal error variable f 'msk'.");
              param = { type: 'Identifier', name: paramToken.value, line: paramToken.line, column: paramToken.column };
              this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d error variable.");
          }
          const catchBody = this.parseBlockStatement();
          handler = { type: 'CatchClause', param, body: catchBody, line: catchStartToken.line, column: catchStartToken.column };
      }
      if (this.matchValue('KEYWORD', 'fakhr')) {
          const finallyStartToken = this.previous();
          finalizer = this.parseBlockStatement();
           if (finalizer.type === 'BlockStatement') {
               finalizer.line = finallyStartToken.line;
               finalizer.column = finallyStartToken.column;
           }
      }
      if (!handler && !finalizer) {
          throw this.error(this.peek(), "Try statement khass ykoun 3ndo 'msk' wla 'fakhr' block wa7d 3la la9al.");
      }
      return { type: 'TryStatement', block, handler, finalizer, line: startToken.line, column: startToken.column };
  }

  parseSwitchStatement(): ASTNode {
      const startToken = this.previous(); // 'bdl3la' token
      this.consumeValue('PUNCTUATION', '(', "Kan tsnna '(' ba3d 'bdl3la'.");
      const discriminant = this.parseExpression();
      this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d switch expression.");
      this.consumeValue('PUNCTUATION', '{', "Kan tsnna '{' qbel switch cases.");
      const cases: ASTNode[] = [];
      while (!this.checkValue('PUNCTUATION', '}') && !this.isAtEnd()) {
          let test: ASTNode | null = null;
          let caseStartToken: Token;
          if (this.matchValue('KEYWORD', '7ala')) {
              caseStartToken = this.previous();
              test = this.parseExpression();
          } else if (this.matchValue('KEYWORD', '3adi')) {
               caseStartToken = this.previous();
              test = null;
          } else {
               throw this.error(this.peek(), "Kan tsnna '7ala' wla '3adi' f switch block.");
          }
          this.consumeValue('PUNCTUATION', ':', "Kan tsnna ':' ba3d '7ala'/'3adi'.");
          const consequent: ASTNode[] = [];
          while (!this.isAtEnd() && !this.checkValue('PUNCTUATION', '}') && !this.checkValue('KEYWORD', '7ala') && !this.checkValue('KEYWORD', '3adi')) {
              const stmt = this.parseDeclaration() || this.parseStatement();
              if (stmt) { consequent.push(stmt); }
              else if (!this.isAtEnd()) { throw this.error(this.peek(), "Statement machi s7i7 f west case dyal switch."); }
          }
          cases.push({ type: 'SwitchCase', test, consequent, line: caseStartToken.line, column: caseStartToken.column });
      }
      this.consumeValue('PUNCTUATION', '}', "Kan tsnna '}' f lekher dyal switch statement.");
      return { type: 'SwitchStatement', discriminant, cases, line: startToken.line, column: startToken.column };
  }

  parseReturnStatement(): ASTNode {
     const startToken = this.previous();
     let argument: ASTNode | undefined = undefined;
     if (!this.checkValue('PUNCTUATION', ';')) { argument = this.parseExpression(); }
     this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d return statement.");
     return { type: 'ReturnStatement', argument, line: startToken.line, column: startToken.column };
   }

   parseBreakStatement(): ASTNode {
       const startToken = this.previous();
       this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d wa9f."); // Make semicolon mandatory
       return { type: 'BreakStatement', line: startToken.line, column: startToken.column };
   }

   parseContinueStatement(): ASTNode {
        const startToken = this.previous();
       this.consumeValue('PUNCTUATION', ';', "Khass ';' ba3d kamml."); // Make semicolon mandatory
        return { type: 'ContinueStatement', line: startToken.line, column: startToken.column };
   }

   // --- Expression Parsing (Operator Precedence) ---

   parseExpression(): ASTNode {
     return this.parseAssignment();
   }

   parseAssignment(): ASTNode {
       const startToken = this.peek();
       const expr = this.parseLogicalOr();
       if (this.matchValue('OPERATOR', '=', '+=', '-=', '*=', '/=', '%=')) {
           const operatorToken = this.previous();
           const value = this.parseAssignment();
           if (expr.type === 'Identifier' || expr.type === 'MemberExpression') {
               return { type: 'AssignmentExpression', operator: operatorToken.value, left: expr, right: value, line: startToken.line, column: startToken.column };
           } else {
               throw this.error(operatorToken, "Assignment target ماشي valid. Khass ykoun variable wla property.");
           }
       }
       return expr;
   }

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

   parseUnary(): ASTNode {
     const startToken = this.peek();
     if (this.matchValue('OPERATOR', '!', '-', '+') || this.matchValue('KEYWORD', 'no3')) {
       const operator = this.previous().value;
       const argument = this.parseUnary();
       return { type: 'UnaryExpression', operator, argument, prefix: true, line: startToken.line, column: startToken.column };
     }
      if (this.matchValue('OPERATOR', '++', '--')) {
          const operator = this.previous().value;
          const argument = this.parseUpdate();
          if (argument.type !== 'Identifier' && argument.type !== 'MemberExpression') {
               throw this.error(startToken, `L'opérateur préfixé '${operator}' khass ykoun 9bel variable wla property.`);
          }
          return { type: 'UpdateExpression', operator, argument, prefix: true, line: startToken.line, column: startToken.column };
      }
     return this.parseUpdate();
   }

   parseUpdate(): ASTNode {
       const startToken = this.peek();
       let expr = this.parseCall();
       if (this.matchValue('OPERATOR', '++', '--')) {
           const operator = this.previous().value;
           if (expr.type !== 'Identifier' && expr.type !== 'MemberExpression') {
               throw this.error(this.previous(), `L'opérateur postfixé '${operator}' khass yji ba3d variable wla property.`);
           }
           expr = { type: 'UpdateExpression', operator, argument: expr, prefix: false, line: startToken.line, column: startToken.column };
       }
       return expr;
   }

   parseCall(): ASTNode {
       let expr = this.parsePrimary();
       while (true) {
           const loopStartToken = this.peek();
           if (this.matchValue('PUNCTUATION', '(')) {
               expr = this.finishCall(expr);
           } else if (this.matchValue('PUNCTUATION', '.')) {
               const name = this.consume('IDENTIFIER', "Kan tsnna smia dyal property ba3d '.'.");
               const propertyNode: ASTNode = { type: 'Identifier', name: name.value, line: name.line, column: name.column };
               expr = { type: 'MemberExpression', object: expr, property: propertyNode, computed: false, line: expr.line, column: expr.column };
           } else if (this.matchValue('PUNCTUATION', '[')) {
               const propertyExpr = this.parseExpression();
               this.consumeValue('PUNCTUATION', ']', "Kan tsnna ']' ba3d index expression.");
               expr = { type: 'MemberExpression', object: expr, property: propertyExpr, computed: true, line: expr.line, column: expr.column };
           } else {
               break;
           }
       }
       return expr;
   }

     finishCall(callee: ASTNode): ASTNode {
         const args: ASTNode[] = [];
         if (!this.checkValue('PUNCTUATION', ')')) {
             do {
                  if (args.length >= 255) { this.error(this.peek(), "Ma ymknch tnadi b kter mn 255 arguments."); }
                 args.push(this.parseExpression());
             } while (this.matchValue('PUNCTUATION', ','));
         }
         this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' f lekher dyal arguments dyal function call.");
         return { type: 'CallExpression', callee, arguments: args, line: callee.line, column: callee.column };
     }

   parsePrimary(): ASTNode {
     const token = this.peek();
     if (this.match('NUMBER')) return { type: 'NumericLiteral', value: this.previous().value, line: token.line, column: token.column };
     if (this.match('STRING')) return { type: 'StringLiteral', value: this.previous().value, line: token.line, column: token.column };
     if (this.match('BOOLEAN')) return { type: 'BooleanLiteral', value: this.previous().value, line: token.line, column: token.column };
     if (this.matchValue('KEYWORD', 'farkha')) return { type: 'NullLiteral', line: token.line, column: token.column };
     if (this.matchValue('KEYWORD', 'mchmcha')) return { type: 'UndefinedLiteral', line: token.line, column: token.column };
     if (this.matchValue('KEYWORD', 'hadi')) return { type: 'ThisExpression', line: token.line, column: token.column };
     if (this.match('IDENTIFIER')) {
        return { type: 'Identifier', name: this.previous().value, line: token.line, column: token.column };
     }
     if (this.matchValue('PUNCTUATION', '(')) {
       const startLine = token.line; const startCol = token.column;
       const expr = this.parseExpression();
       this.consumeValue('PUNCTUATION', ')', "Kan tsnna ')' ba3d expression f west parentheses.");
       return expr;
     }
      if (this.matchValue('KEYWORD', 'jdid')) {
          const startToken = this.previous();
          const callee = this.parseCall();
           let args: ASTNode[] = [];
           let constructorCallee = callee;
            if (callee.type === 'CallExpression') {
                 args = callee.arguments ?? [];
                 constructorCallee = callee.callee!;
            }
          return { type: 'NewExpression', callee: constructorCallee, arguments: args, line: startToken.line, column: startToken.column };
      }
       if (this.matchValue('KEYWORD', 'dala')) {
           return this.parseFunctionExpression();
       }
       // Array Literal Expression
       if (this.matchValue('PUNCTUATION', '[')) {
           return this.parseArrayExpression();
       }
     throw this.error(token, "Expression mam fahmouch wella ma kamlch.");
   }

   parseFunctionExpression(): ASTNode {
       const startToken = this.previous();
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
       if (body.type !== 'BlockStatement') {
            throw this.error(this.peek(), "Kan tsnna '{' l body dyal function expression.");
       }
       return { type: 'FunctionExpression', id: null, params, body, line: startToken.line, column: startToken.column };
   }

   // Parses array literal: '[' (expression (',' expression)* ','?)? ']'
   parseArrayExpression(): ASTNode {
       const startToken = this.previous(); // The '[' token
       const elements: (ASTNode | null)[] = []; // Can contain null for sparse arrays [, ,]

       if (!this.checkValue('PUNCTUATION', ']')) { // Check if array is not empty
           do {
               // Handle potential elision (empty slot like [1, , 3])
               if (this.checkValue('PUNCTUATION', ',')) {
                   elements.push(null); // Represent empty slot with null
                   continue; // Continue to check for comma after elision
               }
               if (this.checkValue('PUNCTUATION', ']')) { // Handle trailing comma before closing ]
                   break;
               }

               // Parse the element expression
               elements.push(this.parseExpression()); // Add the parsed expression

               // Handle trailing comma case specifically
               if (this.checkValue('PUNCTUATION', ']')) {
                   break;
               }

           } while (this.matchValue('PUNCTUATION', ',')); // Continue if comma follows
       }

       this.consumeValue('PUNCTUATION', ']', "Kan tsnna ']' f lekher dyal array literal.");
       return { type: 'ArrayExpression', elements, line: startToken.line, column: startToken.column };
   }


  // --- Utility Methods ---

  isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === 'EOF';
  }

  peek(): Token {
     if (this.current >= this.tokens.length) {
          const lastToken = this.tokens[this.tokens.length - 1];
         return { type: 'EOF', value: null, line: lastToken?.line ?? 0, column: lastToken?.column ?? 0 };
     }
    return this.tokens[this.current];
  }

  previous(): Token {
      if (this.current === 0) {
           return this.tokens[0] || { type: 'ERROR', value: 'No previous token', line:0, column: 0 };
      }
    return this.tokens[this.current - 1];
  }

  advance(): Token {
    if (!this.isAtEnd()) { this.current++; }
    return this.previous();
  }

  check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

   checkValue(type: string, value: any): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return token.type === type && token.value === value;
  }

  match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) { this.advance(); return true; }
    }
    return false;
  }

   matchValue(type: string, ...values: any[]): boolean {
    for (const value of values) {
       if (this.checkValue(type, value)) { this.advance(); return true; }
    }
    return false;
  }

  consume(type: string, message: string): Token {
    if (this.check(type)) { return this.advance(); }
    throw this.error(this.peek(), message);
  }

   consumeValue(type: string, value: any, message: string): Token {
    if (this.checkValue(type, value)) { return this.advance(); }
    throw this.error(this.peek(), message);
  }

  error(token: Token, message: string): Error {
     const location = token.type === 'EOF' ? `la fin dyal code` : `"${String(token.value)}" (type ${token.type})`;
     const fullMessage = `Ghalat f Parser [Ln ${token.line}, Col ${token.column}]: ${message}. L9it ${location}.`;
     return new Error(fullMessage);
   }

    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type === 'PUNCTUATION' && this.previous().value === ';') return;
            switch (this.peek().type) {
                case 'KEYWORD':
                    switch(this.peek().value) {
                        case 'tabit': case 'bdl': case 'dala': case 'ila': case 'wa9ila': case 'douz':
                        case 'madamt': case 'dir': case 'jrb': case 'bdl3la':
                        case 'rj3': case 'wa9f': case 'kamml': case '7ala': case '3adi':
                            return;
                    } break;
                 case 'PUNCTUATION':
                     if (this.peek().value === '{' || this.peek().value === '}') return;
                     break;
            }
            this.advance();
        }
    }
}

// --- Exported Parse Function ---
export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens);
  return parser.parse();
}
