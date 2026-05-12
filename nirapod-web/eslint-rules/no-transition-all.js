"use strict";

/** Forbids transition-all utility. Use transition-colors/opacity/transform only. */
module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow transition-all in className strings (use transition-colors, transition-opacity, or transition-transform)" },
    schema: [],
    messages: {
      noTransitionAll: "Use 'transition-colors', 'transition-opacity', or 'transition-transform' instead of 'transition-all'.",
    },
  },
  create(context) {
    function check(str, node) {
      if (/\btransition-all\b/.test(str)) {
        context.report({ node, messageId: "noTransitionAll" });
      }
    }

    return {
      JSXAttribute(node) {
        if (
          (node.name.name === "className" || node.name.name === "class") &&
          node.value
        ) {
          if (node.value.type === "Literal") check(node.value.value, node.value);
          if (
            node.value.type === "JSXExpressionContainer" &&
            node.value.expression.type === "Literal"
          ) {
            check(node.value.expression.value, node.value.expression);
          }
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          check(quasi.value.raw, quasi);
        }
      },
    };
  },
};
