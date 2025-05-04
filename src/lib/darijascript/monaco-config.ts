

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
        [/^7yed(?![a-zA-Z0-9_])/, 'support.function.builtin'], // Match '7yed' specifically
        [/^7yedmnlwla(?![a-zA-Z0-9_])/, 'support.function.builtin'], // Match '7yedmnlwla' specifically
         [/^3am(?![a-zA-Z0-9_])/, 'support.function.builtin'], // Match '3am' specifically

        [/[a-zA-Z_][\w$]*/, { cases: { '@keywords': 'keyword',
                                       '@constants': 'keyword.constant', // Differentiate constants
                                       '@typeKeywords': 'keyword.type', // Differentiate type-related keywords
                                       '@builtins': 'support.function.builtin', // More specific scope for builtins
                                       '@default': 'identifier' } }],

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

        // characters (less common, but keep for robustness)
       // [/'[^\\']'/, 'string'], // Removed as single quotes are for strings now
       // [/(')(@escapes)(')/, ['string','string.escape','string']], // Removed
       // [/'/, 'string.invalid'] // Removed
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

            const suggestions = [
                // Keywords
                ...[
                    'tabit', 'bdl', 'ila', 'ella', 'wa9ila', 'douz', 'madamt', 'dir',
                    'wa9f', 'kamml', 'dala', 'rj3', 'jrb', 'msk', 'fakhr',
                    'bdl3la', '7ala', '3adi', 'mnin', 'hta', 'rmmi'
                  ].map(k => createCompletionItem(k, monaco.languages.CompletionItemKind.Keyword, k, "DarijaScript Keyword")),

                // Language Constants/Literals
                ...['s7i7', 'ghalat', 'farkha', 'mchmcha', 'hadi', 'true', 'false', 'null', 'undefined'].map(c => createCompletionItem(c, monaco.languages.CompletionItemKind.Constant, c, "DarijaScript Literal/Constant")),

                 // Special Keywords
                ...['no3', 'jdid'].map(t => createCompletionItem(t, monaco.languages.CompletionItemKind.Keyword, t, "DarijaScript Operator/Type Keyword")),


                // Built-ins (provide simple signatures)
                createCompletionItem('tbe3', monaco.languages.CompletionItemKind.Function, 'tbe3($1)', 'tbe3(...args)', 'Prints arguments to the output console.'),
                createCompletionItem('nadi', monaco.languages.CompletionItemKind.Function, 'nadi("${1:Message}")', 'nadi(message)', 'Displays an alert box.'),
                createCompletionItem('sowel', monaco.languages.CompletionItemKind.Function, 'sowel("${1:Question}")', 'sowel(question)', 'Displays a prompt box.'),
                createCompletionItem('tsawal', monaco.languages.CompletionItemKind.Function, 'tsawal("${1:Confirm message}")', 'tsawal(message)', 'Displays a confirmation box.'),
                createCompletionItem('ghlat', monaco.languages.CompletionItemKind.Function, 'ghlat($1)', 'ghlat(...args)', 'Prints arguments as an error.'),
                createCompletionItem('nbehh', monaco.languages.CompletionItemKind.Function, 'nbehh($1)', 'nbehh(...args)', 'Prints arguments as a warning.'),
                // rmmi removed from function completion
                createCompletionItem('mfatih', monaco.languages.CompletionItemKind.Function, 'mfatih(${1:object})', 'mfatih(obj)', 'Returns object keys.'),
                createCompletionItem('qiyam', monaco.languages.CompletionItemKind.Function, 'qiyam(${1:object})', 'qiyam(obj)', 'Returns object values.'),
                // Add more built-ins with simple signatures as needed...


                 // Basic Snippets
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
                        '\trj3;',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'dala Definition (Function)',
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


            ];
            return { suggestions: suggestions };
        }
    });

    console.log(`DarijaScript language (${languageId}) configured for Monaco.`);
}



