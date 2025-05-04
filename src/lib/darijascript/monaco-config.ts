import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

export function setupDarijaScriptLanguage(monaco: typeof monacoEditor) {
  const languageId = 'darijascript';

  // Register the language
  monaco.languages.register({ id: languageId });

  // Register a tokens provider for the language
  monaco.languages.setMonarchTokensProvider(languageId, {
    keywords: [
      'tabit', 'bdl', 'ila', 'ella', 'wa9ila', 'douz', 'mnin', 'hta', 'dala', 'rj3'
    ],
    builtins: [
        'tba3' // Add other built-ins here
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
                                       '@builtins': 'keyword.control', // Or choose another appropriate scope
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

        // characters
        [/'[^\\']'/, 'string'],
        [/(')(@escapes)(')/, ['string','string.escape','string']],
        [/'/, 'string.invalid']
      ],

      comment: [
        [/[^/*]+/, 'comment' ],
        // [/\/\*/,    'comment', '@push' ],    // nested comment not supported in basic example
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

  // Define language configuration (optional but helpful)
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

    // Register a completion item provider (basic example)
    monaco.languages.registerCompletionItemProvider(languageId, {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };
            const suggestions = [
                // Keywords
                ...['tabit', 'bdl', 'ila', 'ella', 'wa9ila', 'douz', 'mnin', 'hta', 'dala', 'rj3'].map(k => ({
                    label: k,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: k,
                    range: range
                })),
                // Built-ins
                ...['tba3'].map(b => ({
                    label: b,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: `${b}()`, // Add parentheses for function calls
                    range: range
                })),
                 // Booleans
                 ...['s7i7', 'ghalat'].map(b => ({
                    label: b,
                    kind: monaco.languages.CompletionItemKind.Keyword, // Or Value
                    insertText: b,
                    range: range
                })),
                 // Basic Snippets
                 {
                    label: 'ila',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'ila (${1:condition}) {',
                        '\t$0',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'ila Statement (If)',
                    range: range
                },
                 {
                    label: 'douz',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                        'douz (${1:condition}) {',
                        '\t$0',
                        '}'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'douz Loop (While)',
                    range: range
                },

            ];
            return { suggestions: suggestions };
        }
    });

    console.log(`DarijaScript language (${languageId}) configured for Monaco.`);
}
