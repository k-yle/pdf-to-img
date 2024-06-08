/* eslint-disable import/no-extraneous-dependencies */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["kyle"],
  rules: {
    quotes: "off",
    "import/extensions": "off",
  },
  settings: {
    jest: { version: 29 },
  },
};
