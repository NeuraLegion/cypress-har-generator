module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['node_modules', 'dist'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    createDefaultProgram: true
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/explicit-member-accessibility': [
      'off',
      {
        accessibility: 'explicit',
        overrides: {
          accessors: 'no-public',
          constructors: 'no-public'
        }
      }
    ],
    '@typescript-eslint/no-explicit-any': [
      'warn',
      {
        ignoreRestArgs: true
      }
    ],
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
          'private-abstract-method',
          'public-instance-method',
          'protected-instance-method',
          'private-instance-method'
        ]
      }
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        selector: 'default',
        trailingUnderscore: 'forbid'
      },
      {
        format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case'],
        selector: 'variableLike'
      },
      {
        format: ['UPPER_CASE', 'camelCase'],
        leadingUnderscore: 'forbid',
        selector: 'memberLike'
      },
      {
        format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
        leadingUnderscore: 'forbid',
        modifiers: ['static'],
        selector: 'memberLike'
      },
      {
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
        modifiers: ['private'],
        selector: 'memberLike'
      },
      {
        format: ['PascalCase'],
        selector: 'typeLike'
      },
      {
        format: ['UPPER_CASE'],
        selector: 'enumMember'
      },
      {
        format: ['camelCase', 'PascalCase'],
        selector: 'function'
      },
      {
        format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case'],
        leadingUnderscore: 'allow',
        modifiers: ['public'],
        selector: 'property'
      },
      {
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        selector: 'parameter'
      }
    ],
    '@typescript-eslint/no-inferrable-types': [
      'error',
      {
        ignoreParameters: true,
        ignoreProperties: true
      }
    ],
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
        avoidEscape: true
      }
    ],
    '@typescript-eslint/no-shadow': [
      'error',
      {
        hoist: 'all'
      }
    ],
    '@typescript-eslint/typedef': [
      'error',
      {
        arrayDestructuring: true,
        arrowParameter: false,
        memberVariableDeclaration: false,
        variableDeclarationIgnoreFunction: true
      }
    ],
    'arrow-body-style': 'error',
    'camelcase': 'off',
    'complexity': [
      'error',
      {
        max: 10
      }
    ],
    'curly': 'error',
    'eqeqeq': ['error', 'smart'],
    'guard-for-in': 'error',
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
    ],
    'max-classes-per-file': ['error', 1],
    'max-depth': [
      'error',
      {
        max: 2
      }
    ],
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-console': 'off',
    'no-eval': 'error',
    'no-new-wrappers': 'error',
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
    'radix': 'error'
  }
};
