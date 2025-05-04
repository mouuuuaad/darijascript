
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
      'bdl3la', '7ala', '3adi', 'mnin', 'hta', // Added mnin, hta
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
        'tbe3', 'nadi', 'sowel', 'tsawal', 'ghlat', 'nbehh', 'rmmi', // Console, alerts, throw
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
        [/[a-zA-Z_][\w$]*/, { cases: { '@keywords': 'keyword',
                                       '@constants': 'keyword.constant', // Differentiate constants
                                       '@typeKeywords': 'keyword.type', // Differentiate type-related keywords
                                       '@builtins': 'support.function.builtin', // More specific scope for builtins
                                       '@default': 'identifier' } }],

        // whitespace
        { include: '@whitespace' },

        // delimiters and operators
        [/[{}()[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator',
                                '@default'  : '' } } ],

        // numbers
        [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],

        // delimiter: after number because of .\d floats
        [/[;,.]/, 'delimiter'],

        // strings
        [/"([^"\\]|\\.)*$/, 'string.invalid' ], // non-teminated string
        [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],

        // characters (less common, but keep for robustness)
        [/'[^\\']'/, 'string'],
        [/(')(@escapes)(')/, ['string','string.escape','string']],
        [/'/, 'string.invalid']
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
                    'bdl3la', '7ala', '3adi', 'mnin', 'hta'
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
                createCompletionItem('rmmi', monaco.languages.CompletionItemKind.Function, 'rmmi(${1:error})', 'rmmi(error)', 'Throws an error.'),
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

            ];
            return { suggestions: suggestions };
        }
    });

    console.log(`DarijaScript language (${languageId}) configured for Monaco.`);
}

