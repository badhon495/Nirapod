"use strict";

/** Forbids gradient classes in JSX className strings and CSS-in-JS. */
module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow gradient utilities in className strings (design constraint: solid colors only)" },
    schema: [],
    messages: {
      noGradient: "Gradients are forbidden. Use solid colors only (design system constraint).",
    },
  },
  create(context) {
    function checkNode(node) {
      const val = node.value;
      if (typeof val === "string" && /gradient/.test(val)) {
        context.report({ node, messageId: "noGradient" });
      }
    }

    return {
      // className="..." or class="..."
      JSXAttribute(node) {
        if (
          (node.name.name === "className" || node.name.name === "class") &&
          node.value
        ) {
          if (node.value.type === "Literal") checkNode(node.value);
          if (
            node.value.type === "JSXExpressionContainer" &&
            node.value.expression.type === "Literal"
          ) {
            checkNode(node.value.expression);
          }
        }
      },
      // template literal strings: cn(`... gradient ...`)
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          if (/gradient/.test(quasi.value.raw)) {
            context.report({ node: quasi, messageId: "noGradient" });
          }
        }
      },
    };
  },
};
