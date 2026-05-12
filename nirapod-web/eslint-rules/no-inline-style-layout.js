"use strict";

const LAYOUT_PROPS = new Set([
  "display", "position", "top", "right", "bottom", "left",
  "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent",
  "flex", "flexGrow", "flexShrink", "flexBasis", "gap",
  "gridTemplateColumns", "gridTemplateRows", "gridColumn", "gridRow",
  "overflow", "overflowX", "overflowY",
  "float", "clear", "zIndex",
]);

/** Disallows inline style={{}} for layout properties — use Tailwind classes instead. */
module.exports = {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow inline style={{}} for layout properties; use Tailwind classes" },
    schema: [],
    messages: {
      noInlineStyleLayout: "Use Tailwind classes instead of inline style for layout property '{{prop}}'.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== "style") return;
        if (!node.value) return;
        if (node.value.type !== "JSXExpressionContainer") return;

        const expr = node.value.expression;
        if (expr.type !== "ObjectExpression") return;

        for (const prop of expr.properties) {
          if (prop.type !== "Property") continue;
          const key =
            prop.key.type === "Identifier"
              ? prop.key.name
              : prop.key.type === "Literal"
              ? String(prop.key.value)
              : null;
          if (key && LAYOUT_PROPS.has(key)) {
            context.report({
              node: prop,
              messageId: "noInlineStyleLayout",
              data: { prop: key },
            });
          }
        }
      },
    };
  },
};
