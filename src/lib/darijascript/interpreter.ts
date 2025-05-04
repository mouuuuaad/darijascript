import { ASTNode, parse } from './parser';
 
 interface Token {
@@ -56,15 +56,14 @@
       line++;
       column = 0;
       continue;
-    }
+    }    
 
-    // Boolean literals
+      // Boolean literals
     if (char === 's' && code.startsWith('s7i7', cursor)) {
       tokens.push({ type: 'BOOLEAN', value: true, line, column });
       cursor += 4; column += 4; continue;
     } else if (char === 'g' && code.startsWith('ghalat', cursor)) {
       tokens.push({ type: 'BOOLEAN', value: false, line, column });
-      cursor += 6; column += 6; continue;
     }
 
 
@@ -73,7 +72,7 @@
     const startColumn = column;
 
     // Identifiers and keywords
-    if (/[a-zA-Z_]/.test(char)) {
+      if (/[a-zA-Z_]/.test(char)) {
       let word = '';
       while (cursor < code.length && /[a-zA-Z0-9_]/.test(code[cursor])) {
         word += code[cursor];
@@ -97,8 +96,7 @@
       continue;
     }
 
-
-
+    
     else if (OPERATORS.includes(char)) {
       tokens.push({ type: 'OPERATOR', value: char, line, column });
       cursor++;
@@ -116,11 +114,5 @@
         setOutput(this.output);
         return { output: this.output };
       }
-
-      visitVariableDeclaration(node: ASTNode): any {
--         let value = null;
-+         let value = undefined; // Initialize with undefined, like JS
-       if (node.initializer) {
-           value = this.evaluate(node.initializer);
-       }
+    }
     
