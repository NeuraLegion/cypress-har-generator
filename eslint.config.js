import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintTs from '@typescript-eslint/eslint-plugin';
import parserTypeScriptESLint from '@typescript-eslint/parser';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import path, { join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  eslintConfigPrettier,
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node }
    },
    ignores: [
      '**/.*',
      'tmp',
      'dist',
      'example',
      '*-lock.json',
      '**/*.lock',
      '**/node_modules/'
    ]
  },
  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    plugins: {
      '@typescript-eslint': eslintTs,
      'import': eslintPluginImport
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.js', '.cjs', '.mjs']
      },
      'import/resolver': {
        typescript: true,
        node: true
      }
    },
    languageOptions: {
      parser: parserTypeScriptESLint,
      parserOptions: { project: [join(__dirname, 'tsconfig.json')] }
    },
    rules: {
      'prefer-destructuring': [
        'error',
        {
          VariableDeclarator: {
            array: true,
            object: true
          },
          AssignmentExpression: {
            array: false,
            object: false
          }
        },
        { enforceForRenamedProperties: false }
      ],
      'arrow-parens': ['error', 'as-needed'],
      'require-await': 'off',
      'no-return-await': 'off',
      'arrow-body-style': 'error',
      'camelcase': 'off',
      'complexity': ['error', { max: 10 }],
      'eqeqeq': ['error', 'smart'],
      'guard-for-in': 'error',
      'max-classes-per-file': ['error', 1],
      'max-depth': ['error', { max: 2 }],
      'default-param-last': 'off',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-console': 'error',
      'no-eval': 'error',
      'no-restricted-syntax': ['error', 'ForInStatement'],
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          next: 'return',
          prev: '*'
        }
      ],
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'radix': 'error',

      'import/no-self-import': 'error',
      'import/no-namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': [
        'error',
        {
          packageDir: __dirname,
          devDependencies: [
            'cypress/**/*.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            '**/eslint.config.js',
            '**/jest.config.ts'
          ]
        }
      ],
      'import/order': [
        'error',
        {
          groups: [
            'index',
            ['sibling', 'parent'],
            'internal',
            'external',
            'builtin'
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.ts'],
    rules: {
      ...eslintTs.configs.recommended.rules,
      ...eslintPluginImport.configs.typescript.rules,

      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'inline-type-imports'
        }
      ],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/non-nullable-type-assertion-style': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-return-this-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'no-public',
            constructors: 'no-public'
          }
        }
      ],
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            'constructor',
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            'public-abstract-method',
            'protected-abstract-method',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method'
          ]
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['destructured'],
          format: null
        },
        {
          selector: [
            'classProperty',
            'objectLiteralProperty',
            'typeProperty',
            'classMethod',
            'objectLiteralMethod',
            'typeMethod',
            'accessor',
            'enumMember'
          ],
          format: null,
          modifiers: ['requiresQuotes']
        },
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid'
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE']
        },
        {
          selector: 'typeLike',
          format: ['PascalCase']
        },
        {
          selector: 'function',
          format: ['PascalCase', 'camelCase']
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case']
        },
        {
          selector: 'method',
          format: ['camelCase', 'PascalCase'],
          modifiers: ['static']
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow'
        }
      ],
      '@typescript-eslint/no-inferrable-types': [
        'error',
        {
          ignoreParameters: true,
          ignoreProperties: true
        }
      ],
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/typedef': [
        'error',
        {
          arrayDestructuring: true,
          arrowParameter: false,
          memberVariableDeclaration: false,
          variableDeclarationIgnoreFunction: true
        }
      ],
      '@typescript-eslint/no-shadow': ['error', { hoist: 'all' }],
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array',
          readonly: 'array'
        }
      ],
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreVoid: true,
          ignoreIIFE: true
        }
      ],
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      '@typescript-eslint/require-await': 'error'
    }
  },
  {
    files: ['**/*.spec.ts'],
    plugins: {
      jest: eslintPluginJest
    },
    languageOptions: {
      globals: eslintPluginJest.environments.globals.globals
    },
    rules: {
      'jest/prefer-expect-resolves': 'error',
      'jest/prefer-todo': 'error',
      'jest/expect-expect': [
        'warn',
        {
          assertFunctionNames: ['expect', 'verify'],
          additionalTestBlockFunctions: []
        }
      ]
    }
  }
];
