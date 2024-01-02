# @tunnel/eslint-plugin-neverthrow

This ESLint plugin is a fork of the excellent [eslint-plugin-neverthrow](https://github.com/mdbetancourt/eslint-plugin-neverthrow) package by @mdbetancourt

## Installation

Install `@tunnel/eslint-plugin-neverthrow` using your favorite package manager:

```shell
npm install --save-dev eslint-plugin-neverthrow
```

### Requirements

- Node.js LTS
- ESLint (v8 or higher)
- @typescript-eslint/parser (v6 or higher)

## Usage

Add `@tunnel/neverthrow` to the `plugins` section of your ESLint config file:

```js
// .eslintrc.cjs

module.exports = {
  plugins: ['@tunnel/neverthrow'],
  rules: {
    '@tunnel/neverthrow/must-use-result': 'error',
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

- `@tunnel/neverthrow/recommended` ... enables the recommended rules.

## Rules

<!--RULE_TABLE_BEGIN-->

### Possible Errors

| Rule ID                                                       | Description                                                                                |     |
| :------------------------------------------------------------ | :----------------------------------------------------------------------------------------- | :-: |
| [@tunnel/neverthrow/must-use-result](./docs/rules/must-use-result.md) | Not handling neverthrow result is a possible error because errors could remain unhandled. | ⭐️ |

<!--RULE_TABLE_END-->
