import type { TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'path';

type MessageIds = 'multipleExports' | 'nameMismatch' | 'noExports';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/claude-flow/eslint-config/blob/main/docs/rules/${name}.md`
);

/**
 * Normalizes a name to match file naming conventions
 * e.g., "FooBar" -> "foo-bar", "fooBar" -> "foo-bar", "foo_bar" -> "foo-bar"
 */
function normalizeName(name: string): string {
  return (
    name
      // Handle camelCase and PascalCase
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      // Handle snake_case
      .replace(/_/g, '-')
      // Convert to lowercase
      .toLowerCase()
  );
}

/**
 * Gets the export name from various export node types
 */
function getExportName(node: TSESTree.Node): string | null {
  switch (node.type) {
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
      return node.id?.name || null;

    case 'VariableDeclaration':
      // Handle: export const foo = ...
      if (node.declarations.length === 1 && node.declarations[0].id.type === 'Identifier') {
        return node.declarations[0].id.name;
      }
      break;

    case 'ExportSpecifier':
      // Handle: export { foo }
      return node.exported.type === 'Identifier' ? node.exported.name : null;

    case 'ExportDefaultDeclaration':
      // We handle default exports differently
      return null;
  }

  return null;
}

export const oneExportPerFile = createRule<[], MessageIds>({
  name: 'one-export-per-file',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce one non-type export per file with filename matching the export name',
    },
    schema: [],
    messages: {
      multipleExports:
        'Files should have exactly one non-type export. Found {{count}} exports: {{exports}}',
      nameMismatch:
        'Export name "{{exportName}}" does not match filename "{{fileName}}". Expected "{{expectedName}}"',
      noExports: 'File must have exactly one non-type export',
    },
  },
  defaultOptions: [],
  create(context) {
    const nonTypeExports: Array<{ name: string; node: TSESTree.Node }> = [];
    const filename = context.filename;
    const basename = path.basename(filename, path.extname(filename));

    // Skip index files and test files
    if (basename === 'index' || basename.includes('.test') || basename.includes('.spec')) {
      return {};
    }

    return {
      // Handle: export function/class/const/let/var
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        // Skip type exports
        if (node.exportKind === 'type') return;

        if (node.declaration) {
          const name = getExportName(node.declaration);
          if (name) {
            nonTypeExports.push({ name, node });
          }
        } else if (node.specifiers) {
          // Handle: export { foo, bar }
          node.specifiers.forEach((specifier) => {
            if (specifier.type === 'ExportSpecifier' && specifier.exportKind !== 'type') {
              const name = getExportName(specifier);
              if (name) {
                nonTypeExports.push({ name, node: specifier });
              }
            }
          });
        }
      },

      // Handle: export default
      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration) {
        // Default exports are handled by no-default-export rule
        // But we still count them as exports for the multiple export check
        nonTypeExports.push({ name: 'default', node });
      },

      // Handle: export * from
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration) {
        // Skip type exports
        if (node.exportKind !== 'type') {
          nonTypeExports.push({ name: '*', node });
        }
      },

      'Program:exit'() {
        // Check for no exports
        if (nonTypeExports.length === 0) {
          context.report({
            node: context.sourceCode.ast,
            messageId: 'noExports',
          });
          return;
        }

        // Check for multiple exports
        if (nonTypeExports.length > 1) {
          const exportNames = nonTypeExports.map((e) => e.name).join(', ');
          const secondExport = nonTypeExports[1];
          if (secondExport) {
            context.report({
              node: secondExport.node,
              messageId: 'multipleExports',
              data: {
                count: nonTypeExports.length,
                exports: exportNames,
              },
            });
          }
          return;
        }

        // Check filename matches export name
        const exportedItem = nonTypeExports[0];
        if (exportedItem && exportedItem.name !== 'default' && exportedItem.name !== '*') {
          const normalizedExportName = normalizeName(exportedItem.name);
          const normalizedFileName = normalizeName(basename);

          if (normalizedExportName !== normalizedFileName) {
            context.report({
              node: exportedItem.node,
              messageId: 'nameMismatch',
              data: {
                exportName: exportedItem.name,
                fileName: basename,
                expectedName: exportedItem.name,
              },
            });
          }
        }
      },
    };
  },
});
