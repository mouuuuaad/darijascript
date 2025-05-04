

import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

export function setupDarijaScriptLanguage(monaco: typeof monacoEditor) {
  const languageId = 'darijascript';

  // Register the language
  monaco.languages.register({ id: languageId });

  // Register a tokens provider for the language
  monaco.languages.setMonarchTokensProvider(languageId, {
    // Base Keywords (Control Flow, Declarations)
    keywords: [
      'tabit', 'bdl', 'ila', 'ella', 'wa9ila', 'douz', 'madamt', 'dir',
      'wa9f', 'kamml', 'dala', 'rj3', 'jrb', 'msk', 'fakhr',
      'bdl3la', '7ala', '3adi', 'mnin', 'hta', 'rmmi' // Added rmmi as keyword
    ],
    // Language Constants/Literals
    constants: [
       's7i7', 'ghalat', 'farkha', 'mchmcha', 'hadi', // true, false, null, undefined, this
       'true', 'false', 'null', 'undefined' // Add English equivalents
    ],
    // Special Keywords (Types, Operators as words)
    typeKeywords: [
       'no3', 'jdid' // typeof, new
    ],
    // Built-in Functions/Objects (Commonly used)
    // Also includes method names for highlighting after '.'
    builtins: [
        'tbe3', 'nadi', 'sowel', 'tsawal', 'ghlat', 'nbehh', // Console, alerts (rmmi removed)
        't7t', 'fo9', 'dour', 'tsarraf', 'kbar', 'sghar', 'mnfi', 'rf3', 'jdr', // Math
        'ns', 'kbr7rf', 'sghr7rf', 'kayn', 'twil', // String methods & property
        'zid', '7yed', '7yedmnlwla', 'zidfllwla', 'dwr', 'n9i', 'lfech', 'l9a', 'lmmaj', // Array methods
        'mfatih', 'qiyam', // Object methods
        'daba', 'wa9t', '3am', 'chhr', 'nhar', // Date methods
        'sta9', 'krr' // Timers
    ],
    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
      '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
      '%=', '<<=', '>>=', '>>>='
    ],
    symbols: /[=><!~?:&|+\-*/^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        // identifiers and keywords
        // Need to handle keywords starting with numbers explicitly if tokenizer identifies them as numbers
        [/^7ala(?![a-zA-Z0-9_])/, 'keyword'], // Match '7ala' specifically
        [/^3adi(?![a-zA-Z0-9_])/, 'keyword'], // Match '3adi' specifically
        [/^7yed(?![a-zA-Z0-9_])/, 'support.function.builtin'], // Match '7yed' specifically as builtin func/method
        [/^7yedmnlwla(?![a-zA-Z0-9_])/, 'support.function.builtin'], // Match '7yedmnlwla' specifically as builtin func/method
         [/^3am(?![a-zA-Z0-9_])/, 'support.function.builtin'], // Match '3am' specifically as builtin func/method

        // Member access (property/method) - Before generic identifier
        // Highlight the '.' and the following identifier based on whether it's a known builtin/method
        [/\.\s*([a-zA-Z_][\w$]*)/, { cases: { '$1@builtins': ['delimiter', 'support.function.builtin'],
                                              '@default': ['delimiter', 'variable.property'] } }], // 'variable.property' for custom properties

        // Generic identifiers and keywords
        [/[a-zA-Z_][\w$]*/, { cases: { '@keywords': 'keyword',
                                       '@constants': 'keyword.constant', // Differentiate constants
                                       '@typeKeywords': 'keyword.type', // Differentiate type-related keywords
                                       '@builtins': 'support.function.builtin', // More specific scope for builtins (standalone)
                                       '@default': 'identifier' } }], // Default identifier color (was white)

        // whitespace
        { include: '@whitespace' },

        // delimiters and operators
        [/[{}()[\]]/, '@brackets'], // Highlight braces, brackets, parentheses
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator',
                                '@default'  : '' } } ],

        // numbers - Placed after keyword checks for 7ala etc.
        [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'], // Matches integers

        // delimiter: after number because of .\d floats
        [/[;,.:]/, 'delimiter'], // Added colon for object literals

        // strings
        [/"([^"\\]|\\.)*$/, 'string.invalid' ], // non-teminated string
        [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],
        [/'([^'\\]|\\.)*$/, 'string.invalid' ], // non-teminated string
        [/'/,  { token: 'string.quote', bracket: '@open', next: '@stringsingle' } ],

      ],

      comment: [
        [/[^/*]+/, 'comment' ],
        // Nested comments not supported in basic Monarch
        ["\\*/",    'comment', '@pop'  ],
        [/[/*]/,   'comment' ]
      ],

       string: [
        [/[^\\"]+/,  'string'],
        [/@escapes/, 'string.escape'],
        [/\\./,      'string.escape.invalid'],
        [/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
      ],
       stringsingle: [ // Added state for single-quoted strings
        [/[^\\']+/,  'string'],
        [/@escapes/, 'string.escape'],
        [/\\./,      'string.escape.invalid'],
        [/'/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/,       'comment', '@comment' ],
        [/\/\/.*$/,    'comment'],
      ],
    }
  });

  // Define language configuration
  monaco.languages.setLanguageConfiguration(languageId, {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
     folding: {
            markers: {
                start: new RegExp("^\\s*//\\s*#?region\\b"),
                end: new RegExp("^\\s*//\\s*#?endregion\\b")
            }
        }
  });

    // Register a completion item provider (more structured)
    monaco.languages.registerCompletionItemProvider(languageId, {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const createCompletionItem = (label: string, kind: monaco.languages.CompletionItemKind, insertText?: string, detail?: string, documentation?: string) => ({
                label,
                kind,
                insertText: insertText || label,
                range,
                detail,
                documentation
            });

             const keywordSuggestions = [
                'tabit', 'bdl', 'ila', 'ella', 'wa9ila', 'douz', 'madamt', 'dir',
                'wa9f', 'kamml', 'dala', 'rj3', 'jrb', 'msk', 'fakhr',
                'bdl3la', '7ala', '3adi', 'mnin', 'hta', 'rmmi'
             ].map(k => createCompletionItem(k, monaco.languages.CompletionItemKind.Keyword, k, "DarijaScript Keyword"));

             const constantSuggestions = [
                 's7i7', 'ghalat', 'farkha', 'mchmcha', 'hadi', // Darija
                 'true', 'false', 'null', 'undefined' // JS equivalents
             ].map(c => createCompletionItem(c, monaco.languages.CompletionItemKind.Constant, c, "DarijaScript Literal/Constant"));

              const typeKeywordSuggestions = [
                 'no3', 'jdid' // typeof, new
             ].map(t => createCompletionItem(t, monaco.languages.CompletionItemKind.Keyword, t, "DarijaScript Operator/Type Keyword"));

             const builtinFunctionSuggestions = [
                // Console/Alerts
                createCompletionItem('tbe3', monaco.languages.CompletionItemKind.Function, 'tbe3($1)', 'tbe3(...args)', 'Prints arguments to the output console.'),
                createCompletionItem('nadi', monaco.languages.CompletionItemKind.Function, 'nadi("${1:Message}")', 'nadi(message)', 'Displays an alert box.'),
                createCompletionItem('sowel', monaco.languages.CompletionItemKind.Function, 'sowel("${1:Question}")', 'sowel(question)', 'Displays a prompt box.'),
                createCompletionItem('tsawal', monaco.languages.CompletionItemKind.Function, 'tsawal("${1:Confirm message}")', 'tsawal(message)', 'Displays a confirmation box.'),
                createCompletionItem('ghlat', monaco.languages.CompletionItemKind.Function, 'ghlat($1)', 'ghlat(...args)', 'Prints arguments as an error.'),
                createCompletionItem('nbehh', monaco.languages.CompletionItemKind.Function, 'nbehh($1)', 'nbehh(...args)', 'Prints arguments as a warning.'),
                 // Math
                createCompletionItem('t7t', monaco.languages.CompletionItemKind.Function, 't7t(${1:number})', 't7t(num)', 'Math.floor()'),
                createCompletionItem('fo9', monaco.languages.CompletionItemKind.Function, 'fo9(${1:number})', 'fo9(num)', 'Math.ceil()'),
                createCompletionItem('dour', monaco.languages.CompletionItemKind.Function, 'dour(${1:number})', 'dour(num)', 'Math.round()'),
                createCompletionItem('tsarraf', monaco.languages.CompletionItemKind.Function, 'tsarraf()', 'tsarraf()', 'Math.random()'),
                createCompletionItem('kbar', monaco.languages.CompletionItemKind.Function, 'kbar(${1:num1}, ${2:num2})', 'kbar(...args)', 'Math.max()'),
                createCompletionItem('sghar', monaco.languages.CompletionItemKind.Function, 'sghar(${1:num1}, ${2:num2})', 'sghar(...args)', 'Math.min()'),
                createCompletionItem('mnfi', monaco.languages.CompletionItemKind.Function, 'mnfi(${1:number})', 'mnfi(num)', 'Math.abs()'),
                createCompletionItem('rf3', monaco.languages.CompletionItemKind.Function, 'rf3(${1:base}, ${2:exponent})', 'rf3(base, exp)', 'Math.pow()'),
                createCompletionItem('jdr', monaco.languages.CompletionItemKind.Function, 'jdr(${1:number})', 'jdr(num)', 'Math.sqrt()'),
                 // String (Static)
                 createCompletionItem('ns', monaco.languages.CompletionItemKind.Function, 'ns(${1:value})', 'ns(value)', 'String() Conversion'),
                 // Object (Static)
                 createCompletionItem('mfatih', monaco.languages.CompletionItemKind.Function, 'mfatih(${1:object})', 'mfatih(obj)', 'Object.keys()'),
                 createCompletionItem('qiyam', monaco.languages.CompletionItemKind.Function, 'qiyam(${1:object})', 'qiyam(obj)', 'Object.values()'),
                 // Date (Static)
                 createCompletionItem('daba', monaco.languages.CompletionItemKind.Function, 'daba()', 'daba()', 'Date.now()'),
                 // Date (Constructor) - Treat 'wa9t' as a function that returns a new Date
                 createCompletionItem('wa9t', monaco.languages.CompletionItemKind.Constructor, 'wa9t(${1:args})', 'wa9t(...args)', 'new Date()'),
                 // Timers
                 createCompletionItem('sta9', monaco.languages.CompletionItemKind.Function, 'sta9(${1:callback}, ${2:delay})', 'sta9(callback, delay)', 'setTimeout()'),
                 createCompletionItem('krr', monaco.languages.CompletionItemKind.Function, 'krr(${1:callback}, ${2:interval})', 'krr(callback, interval)', 'setInterval()'),
             ];

             // Method/Property suggestions (would ideally depend on context, but basic list for now)
              const methodSuggestions = [
                  // String methods
                  createCompletionItem('kbr7rf', monaco.languages.CompletionItemKind.Method, 'kbr7rf()', '.toUpperCase()', 'Converts string to uppercase.'),
                  createCompletionItem('sghr7rf', monaco.languages.CompletionItemKind.Method, 'sghr7rf()', '.toLowerCase()', 'Converts string to lowercase.'),
                  createCompletionItem('kayn', monaco.languages.CompletionItemKind.Method, 'kayn(${1:substring})', '.includes(substring)', 'Checks if string contains substring.'),
                   // Array methods
                  createCompletionItem('zid', monaco.languages.CompletionItemKind.Method, 'zid(${1:element})', '.push(element)', 'Adds element to end of array.'),
                  createCompletionItem('7yed', monaco.languages.CompletionItemKind.Method, '7yed()', '.pop()', 'Removes last element from array.'),
                  createCompletionItem('7yedmnlwla', monaco.languages.CompletionItemKind.Method, '7yedmnlwla()', '.shift()', 'Removes first element from array.'),
                  createCompletionItem('zidfllwla', monaco.languages.CompletionItemKind.Method, 'zidfllwla(${1:element})', '.unshift(element)', 'Adds element to start of array.'),
                  createCompletionItem('dwr', monaco.languages.CompletionItemKind.Method, 'dwr(dala(${1:item}) { rj3 ${2:transformedItem}; })', '.map(callback)', 'Creates new array with results of callback.'),
                  createCompletionItem('n9i', monaco.languages.CompletionItemKind.Method, 'n9i(dala(${1:item}) { rj3 ${2:condition}; })', '.filter(callback)', 'Creates new array with elements passing test.'),
                  createCompletionItem('lfech', monaco.languages.CompletionItemKind.Method, 'lfech(dala(${1:item}) { ${2:code} })', '.forEach(callback)', 'Executes callback for each element.'),
                  createCompletionItem('l9a', monaco.languages.CompletionItemKind.Method, 'l9a(dala(${1:item}) { rj3 ${2:condition}; })', '.find(callback)', 'Returns first element passing test.'),
                  createCompletionItem('lmmaj', monaco.languages.CompletionItemKind.Method, 'lmmaj(dala(${1:accumulator}, ${2:currentValue}) { rj3 ${3:nextAccumulator}; }, ${4:initialValue})', '.reduce(callback, initialValue)', 'Reduces array to single value.'),
                   // Date methods
                  createCompletionItem('3am', monaco.languages.CompletionItemKind.Method, '3am()', '.getFullYear()', 'Gets the full year.'),
                  createCompletionItem('chhr', monaco.languages.CompletionItemKind.Method, 'chhr()', '.getMonth()', 'Gets the month (0-11).'),
                  createCompletionItem('nhar', monaco.languages.CompletionItemKind.Method, 'nhar()', '.getDate()', 'Gets the day of the month.'),
              ];

               const propertySuggestions = [
                  createCompletionItem('twil', monaco.languages.CompletionItemKind.Property, 'twil', '.length', 'Gets the length of a string or array.'),
               ];

             // Basic Snippets
             const snippetSuggestions = [
                 {
                    label: 'ila..ella',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'ila (${1:condition}) {',
                        '\t$0',
                        '} ella {',
                        '\t',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'ila...ella Statement (If...Else)',
                    range: range
                },
                 {
                    label: 'madamt',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'madamt (${1:condition}) {',
                        '\t$0',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'madamt Loop (While)',
                    range: range
                },
                 {
                    label: 'dala',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'dala ${1:functionName}(${2:arguments}) {',
                        '\t$0',
                        '\trj3;', // Default return undefined
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'dala Definition (Function)',
                    range: range
                },
                 {
                    label: 'jrb..msk',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'jrb {',
                        '\t$1',
                        '} msk (${2:error}) {',
                        '\t$0',
                        '}'
                    ].join('\n'),
                     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Try...Catch Block',
                    range: range
                },
                 {
                    label: 'douz',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'douz (bdl ${1:i} = 0; ${1:i} < ${2:limit}; ${1:i} = ${1:i} + 1) {',
                        '\t$0',
                        '}'
                    ].join('\n'),
                     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'For Loop',
                    range: range
                },
                {
                    label: 'object',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        '{',
                        '\t${1:key}: ${2:value}$0',
                        '}'
                    ].join('\n'),
                     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Object Literal',
                    range: range
                },
                 {
                    label: 'array',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: '[${1:value1}, ${2:value2}]$0',
                     insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Array Literal',
                    range: range
                },


            ];

            const suggestions = [
                ...keywordSuggestions,
                ...constantSuggestions,
                ...typeKeywordSuggestions,
                ...builtinFunctionSuggestions,
                ...methodSuggestions, // Add methods/properties
                ...propertySuggestions,
                ...snippetSuggestions
            ];


            return { suggestions: suggestions };
        }
    });

     // Define a custom theme matching the app's dark theme
     monaco.editor.defineTheme('darijaDark', {
       base: 'vs-dark', // Start with the VS Dark theme
       inherit: true,
       rules: [
         { token: 'keyword', foreground: '3BACFF' }, // Primary color for keywords (tabit, ila, etc.)
         { token: 'keyword.constant', foreground: '50E3C2' }, // Accent for s7i7, farkha, hadi etc.
         { token: 'keyword.type', foreground: '50E3C2' }, // Accent for no3, jdid
         { token: 'support.function.builtin', foreground: '50E3C2' }, // Accent color for builtins (tbe3, kbar7rf)
         { token: 'number', foreground: '67F2D3' }, // Dual button color for numbers
         { token: 'string', foreground: 'FFD700' }, // Gold for strings
         { token: 'comment', foreground: '808080', fontStyle: 'italic' }, // Darker grey for comments
         { token: 'identifier', foreground: 'FFFFFF' }, // White for general identifiers
         { token: 'operator', foreground: '50E3C2' }, // Accent color for operators (+, =, ==)
          { token: 'delimiter', foreground: 'A0A0A0' }, // Light grey for delimiters like .,;,{}()[]
          { token: 'delimiter.bracket', foreground: 'A0A0A0' }, // Same for brackets specifically
           { token: 'variable.property', foreground: '9CDCFE' }, // Light blue for custom properties accessed via '.'
          { token: 'string.escape', foreground: 'FF9900' }, // Orange for escape sequences
         // Add more rules as needed
       ],
       colors: {
         'editor.background': '#020013', // Dark background
         'editor.foreground': '#FFFFFF', // White text
         'editorCursor.foreground': '#50E3C2', // Accent cursor
         'editor.lineHighlightBackground': '#0A0C2F', // Slightly lighter line highlight
         'editorLineNumber.foreground': '#6c757d', // Muted line numbers
         'editor.selectionBackground': '#3CACFF30', // Primary color selection (semi-transparent)
         'editorWidget.background': '#0A0C2F', // Background for widgets like find
         'editorWidget.border': '#3BACFF', // Primary border for widgets
       }
     });

    console.log(`DarijaScript language (${languageId}) configured for Monaco.`);
}



