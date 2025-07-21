import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

type MessageIds = 'noDefaultExport';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/claude-flow/eslint-config/blob/main/docs/rules/${name}.md`
);

export const noDefaultExport = createRule<[], MessageIds>({
  name: 'no-default-export',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow default exports to enforce consistent named exports',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noDefaultExport: 'Default exports are not allowed. Use named exports instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      // Handle: export default ...
      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration) {
        context.report({
          node,
          messageId: 'noDefaultExport',
          fix(fixer) {
            const sourceCode = context.sourceCode;
            const declaration = node.declaration;

            // Handle different types of default exports
            if (declaration.type === 'Identifier') {
              // export default someVariable;
              const text = sourceCode.getText(declaration);
              return fixer.replaceText(node, `export { ${text} };`);
            } else if (
              declaration.type === 'FunctionDeclaration' ||
              declaration.type === 'ClassDeclaration'
            ) {
              // export default function foo() {} or export default class Foo {}
              if (declaration.id) {
                const declText = sourceCode.getText(declaration);
                const exportText = declText.replace(/^/, 'export ');
                return fixer.replaceText(node, exportText);
              } else {
                // Anonymous function/class - can't auto-fix
                return null;
              }
            } else if (
              declaration.type === 'ObjectExpression' ||
              declaration.type === 'ArrayExpression' ||
              declaration.type === 'Literal' ||
              declaration.type === 'CallExpression' ||
              declaration.type === 'NewExpression' ||
              declaration.type === 'MemberExpression' ||
              declaration.type === 'ArrowFunctionExpression' ||
              declaration.type === 'FunctionExpression'
            ) {
              // For expressions, we can't easily determine a good name
              // So we don't provide an auto-fix
              return null;
            } else if (declaration.type === 'TSAsExpression') {
              // Handle TypeScript as expressions: export default foo as Bar;
              const expression = declaration.expression;
              if (expression.type === 'Identifier') {
                const text = sourceCode.getText(expression);
                return fixer.replaceText(node, `export { ${text} };`);
              }
              return null;
            }

            return null;
          },
        });
      },

      // Handle: export { default } from ...
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        if (node.specifiers) {
          node.specifiers.forEach((specifier) => {
            if (
              specifier.type === 'ExportSpecifier' &&
              ((specifier.exported.type === 'Identifier' &&
                specifier.exported.name === 'default') ||
                (specifier.exported.type === 'Literal' &&
                  typeof specifier.exported.value === 'string' &&
                  specifier.exported.value === 'default'))
            ) {
              context.report({
                node: specifier,
                messageId: 'noDefaultExport',
                fix(fixer) {
                  // For re-exports like: export { something as default }
                  // Convert to: export { something }
                  if (specifier.local.type === 'Identifier' && specifier.local.name !== 'default') {
                    return fixer.replaceText(specifier, specifier.local.name);
                  }
                  // Can't auto-fix export { default } from './module'
                  return null;
                },
              });
            }
          });
        }
      },
    };
  },
});
