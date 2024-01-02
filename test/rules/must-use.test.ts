import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/must-use-result.js';
import { MessageIds } from '../../src/utils.js';
import fs from 'node:fs';
import { outdent } from 'outdent';
import path from 'pathe';

const neverthrowTypes = fs.readFileSync(
	path.join(__dirname, '../fixture/neverthrow.d.ts'),
	'utf8'
);

function injectResult(name: string, text: string) {
	return (
		outdent({ trimTrailingNewline: false })`
			// ${name}
			${neverthrowTypes}
			declare function getResult(): Result<string, Error>
			declare function getResultAsync(): ResultAsync<string, Error>
			declare function getNormal(): number
			const obj: { get: () => Result<string, Error>, getAsync: () => ResultAsync<string, Error> }
		` + text
	);
}

const ruleTester = new RuleTester({
	parser: require.resolve('@typescript-eslint/parser'),
	parserOptions: {
		tsconfigRootDir: path.join(__dirname, '../fixture'),
		project: './tsconfig.json'
	}
});

ruleTester.run('must-use-result', rule, {
	valid: [
		injectResult(
			'call unwrap',
			outdent`
				const result = getResult()
				result.unwrap()
			`
		),
		injectResult(
			'call ResultAsync unwrap',
			outdent`
				const resultAsync = getResultAsync()
				resultAsync.unwrap()
			`
		),
		injectResult(
			'call unwrapOr after some methods',
			outdent`
				const result = getResult()
				result.map(() => {}).unwrapOr('')
			`
		),
		injectResult(
			'Call match',
			outdent`
				const result = getResult()
				result.match(() => {}, () => {})
			`
		),
		injectResult(
			'Return result from function',
			outdent`
				function main() {
					return getResult().map(() => {})
				}
			`
		),
		injectResult(
			'Return result from an arrow function',
			outdent`
				const main = () => getResult().map(() => {})
			`
		),
		injectResult(
			'Call a normal function',
			outdent`
				getNormal()
			`
		),
		outdent`
			// Without definitions
			getNormal()
		`
	],
	invalid: [
		{
			code: injectResult(
				'only assignment',
				outdent`
					const result = getResult()
				`
			),
			errors: [{ messageId: MessageIds.MUST_USE }]
		},
		{
			code: injectResult(
				'Call map for result',
				outdent`
					const result = getResult();
					result.map(() => {})
				`
			),
			errors: [
				{ messageId: MessageIds.MUST_USE },
				{ messageId: MessageIds.MUST_USE }
			]
		},
		{
			code: injectResult(
				'only call',
				outdent`
					getResult()
				`
			),
			errors: [{ messageId: MessageIds.MUST_USE }]
		},
		{
			code: injectResult(
				'only ResultAsync call',
				outdent`
					await getResultAsync()
				`
			),
			errors: [{ messageId: MessageIds.MUST_USE }]
		},
		{
			code: injectResult(
				'only await call',
				outdent`
					await getResult()
				`
			),
			errors: [{ messageId: MessageIds.MUST_USE }]
		},
		{
			code: injectResult(
				'call external function',
				outdent`
					const v = getResult()
					externalFunction(v)
				`
			),
			errors: [{ messageId: MessageIds.MUST_USE }]
		},
		{
			code: injectResult(
				'made call from object',
				outdent`
					obj.get()
				`
			),
			errors: [{ messageId: MessageIds.MUST_USE }]
		},
		{
			code: injectResult(
				'none of the handle methods is called',
				outdent`
					getResult().unwrapOr
				`
			),
			errors: [{ messageId: MessageIds.MUST_USE }]
		},
		{
			code: injectResult(
				'called inside a function',
				outdent`
					function main() {
						getResult().map(() => {})
					}
				`
			),
			errors: [
				{ messageId: MessageIds.MUST_USE },
				{ messageId: MessageIds.MUST_USE }
			]
		}
	]
});