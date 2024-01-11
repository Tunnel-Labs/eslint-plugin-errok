# eslint-plugin-errok

This ESLint plugin is based on the excellent [eslint-plugin-neverthrow](https://github.com/mdbetancourt/eslint-plugin-neverthrow) package by [@mdbetancourt](https://github.com/mdbetancourt)

## Installation

Install `eslint-plugin-errok` using your favorite package manager:

```shell
npm install --save-dev eslint-plugin-errok
```

### Requirements

- Node.js LTS
- ESLint (v8 or higher)
- @typescript-eslint/parser (v6 or higher)

## Usage

Add `errok` to the `plugins` section of your ESLint config file:

```js
// .eslintrc.cjs

module.exports = {
  plugins: ['errok'],
  rules: {
    'errok/must-use-result': 'error',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
};
```

See also [Configuring ESLint](https://eslint.org/docs/user-guide/configuring).

## Configs

- `errok/recommended` ... enables the recommended rules.

## Rules

<!--RULE_TABLE_BEGIN-->

### Possible Errors

| Rule ID                                                       | Description                                                                                |     |
| :------------------------------------------------------------ | :----------------------------------------------------------------------------------------- | :-: |
| [errok/must-use-result](./docs/rules/must-use-result.md) | Not handling errok Result is a possible error because errors could remain unhandled. | ⭐️ |

<!--RULE_TABLE_END-->
