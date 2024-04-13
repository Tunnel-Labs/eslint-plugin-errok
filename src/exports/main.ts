/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export = {
  configs: {
    recommended: require('./configs/recommended.js'),
  },
  rules: {
    'must-use-result': require('./rules/must-use-result.js'),
  },
};
