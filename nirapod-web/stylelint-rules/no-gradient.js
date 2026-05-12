"use strict";

const stylelint = require("stylelint");

const ruleName = "nirapod/no-gradient";
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: "Gradients are forbidden (design constraint: solid colors only). Remove the *-gradient() function.",
});
const meta = { url: "", fixable: false };

const rule = () => (root, result) => {
  root.walkDecls((decl) => {
    if (/gradient\s*\(/.test(decl.value)) {
      stylelint.utils.report({ message: messages.rejected, node: decl, result, ruleName, word: "gradient" });
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

module.exports = rule;
