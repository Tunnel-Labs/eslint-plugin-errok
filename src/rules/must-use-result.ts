import { TypeChecker } from 'typescript';
import { unionTypeParts } from 'tsutils';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/types';
import type { TSESLint, ParserServices } from '@typescript-eslint/utils';
import { MessageIds } from '../utils.js';

function matchAny(nodeTypes: string[]) {
	return `:matches(${nodeTypes.join(', ')})`;
}
const resultSelector = matchAny([
	// 'Identifier',
	'AwaitExpression',
	'CallExpression',
	'NewExpression'
]);

const resultProperties = [
	'mapErr',
	'map',
	'andThen',
	'orElse',
	'match',
	'unwrapOr'
];

const handledMethods = [
	'match',
	'unwrapOr',
	'_unsafeUnwrap',
	'unwrap',
	'isErr'
];

function isResultLike(
	checker: TypeChecker,
	parserServices: ParserServices,
	node?: TSESTree.Node | null
): boolean {
	if (!node) return false;
	const tsNodeMap = parserServices.esTreeNodeToTSNodeMap.get(node);
	const type = checker.getTypeAtLocation(tsNodeMap);

	for (const ty of unionTypeParts(checker.getApparentType(type))) {
		if (
			resultProperties
				.map((p) => ty.getProperty(p))
				.every((p) => p !== undefined)
		) {
			return true;
		}
	}
	return false;
}

function findMemberName(node?: TSESTree.MemberExpression): string | null {
	if (node === undefined) return null;
	if (node.property.type !== AST_NODE_TYPES.Identifier) return null;
	return node.property.name;
}

function isMemberCalledFn(node?: TSESTree.MemberExpression): boolean {
	if (node?.parent?.type !== AST_NODE_TYPES.CallExpression) return false;
	return node.parent.callee === node;
}

function isHandledResult(node: TSESTree.Node): boolean {
	const memberExpression = node.parent;
	if (memberExpression?.type === AST_NODE_TYPES.MemberExpression) {
		const methodName = findMemberName(memberExpression);
		const methodIsCalled = isMemberCalledFn(memberExpression);
		if (methodName && handledMethods.includes(methodName) && methodIsCalled) {
			return true;
		}
		const parent = node.parent?.parent; // search for chain method .map().handler
		if (parent && parent?.type !== AST_NODE_TYPES.ExpressionStatement) {
			return isHandledResult(parent);
		}
	}
	return false;
}

function isValuePropertyAccessed(node: TSESTree.Node): boolean {
	const memberExpression = node.parent;
	if (memberExpression?.type === AST_NODE_TYPES.MemberExpression) {
		const propertyName = findMemberName(memberExpression);
		if (propertyName === 'value') {
			return true;
		}
	}

	return false
}

const endTraverse = ['BlockStatement', 'Program'];
function getAssignedTo(
	checker: TypeChecker,
	parserServices: ParserServices,
	node: TSESTree.Node
): TSESTree.Identifier | undefined {
	if (
		node.type === AST_NODE_TYPES.VariableDeclarator &&
		isResultLike(checker, parserServices, node.init) &&
		node.id.type === AST_NODE_TYPES.Identifier
	) {
		return node.id;
	}
	if (endTraverse.includes(node.type) || !node.parent) {
		return undefined;
	}
	return getAssignedTo(checker, parserServices, node.parent);
}

function isReturned(
	checker: TypeChecker,
	parserServices: ParserServices,
	node: TSESTree.Node
): boolean {
	if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
		return true;
	}
	if (node.type === AST_NODE_TYPES.ReturnStatement) {
		return true;
	}
	if (node.type === AST_NODE_TYPES.BlockStatement) {
		return false;
	}
	if (node.type === AST_NODE_TYPES.Program) {
		return false;
	}
	if (!node.parent) {
		return false;
	}
	return isReturned(checker, parserServices, node.parent);
}

const ignoreParents = [
	'ClassDeclaration',
	'FunctionDeclaration',
	'MethodDefinition',
	'ClassProperty'
];

function processSelector(
	context: TSESLint.RuleContext<MessageIds, []>,
	checker: TypeChecker,
	parserServices: ParserServices,
	node: TSESTree.Node,
	reportAs = node
): boolean {
	if (node.parent?.type.startsWith('TS')) {
		return false;
	}

	// We skip handling the inner `CallExpression` to avoid duplicated errors
	if (
		node.type === AST_NODE_TYPES.CallExpression &&
		node.parent.type === AST_NODE_TYPES.AwaitExpression
	) {
		return false;
	}

	if (node.parent && ignoreParents.includes(node.parent.type)) {
		return false;
	}

	if (!isResultLike(checker, parserServices, node)) {
		return false;
	}

	if (isHandledResult(node)) {
		return false;
	}

	if (isValuePropertyAccessed(node)) {
		return false;
	}

	if (isReturned(checker, parserServices, node)) {
		return false;
	}

	const assignedTo = getAssignedTo(checker, parserServices, node);
	const currentScope = context.getScope();

	// Check if is assigned
	if (assignedTo) {
		const references = [];
		for (const scope of [currentScope, ...currentScope.childScopes]) {
			const variable = scope.set.get(assignedTo.name);
			references.push(
				// Don't include the identifier in the assignment
				...(variable?.references.filter(
					(ref) => ref.identifier !== assignedTo
				) ?? [])
			);
		}

		if (references.length > 0) {
			return references.some((ref) =>
				processSelector(
					context,
					checker,
					parserServices,
					ref.identifier,
					reportAs
				)
			);
		}
	}

	context.report({
		node: reportAs,
		messageId: MessageIds.MUST_USE
	});
	return true;
}

const rule: TSESLint.RuleModule<MessageIds, []> = {
	meta: {
		docs: {
			description:
				'Not handling neverthrow result is a possible error because errors could remain unhandled.',
			recommended: 'strict',
			url: ''
		},
		messages: {
			mustUseResult:
				'Result must be handled with either of `match`, `unwrapOr` or `unwrap`.'
		},
		schema: [],
		type: 'problem'
	},
	defaultOptions: [],
	create(context) {
		const parserServices = context.sourceCode.parserServices;
		const checker = parserServices?.program?.getTypeChecker();

		if (checker === undefined) {
			throw Error(
				'Types not available; make sure the "parser" option is set to "@typescript-eslint/parser"'
			);
		}

		return {
			[resultSelector](node: TSESTree.Node) {
				return processSelector(context, checker, parserServices, node);
			}
		};
	}
};

export = rule;
