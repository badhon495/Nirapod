"use strict";

const stylelint = require("stylelint");

const ruleName = "nirapod/no-important";
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: "!important is forbidden. Increase specificity or restructure styles instead.",
});
const meta = { url: "", fixable: false };

const rule = () => (root, result) => {
  root.walkDecls((decl) => {
    if (decl.important) {
      stylelint.utils.report({ message: messages.rejected, node: decl, result, ruleName, word: "!important" });
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

module.exports = rule;
