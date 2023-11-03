module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["plugin:vue/essential", "@vue/standard"],
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    semi: [2, "always"],
    quotes: [2, "double", { avoidEscape: true }],
    "space-before-function-paren": "off",
    "no-new": "off",
    "no-undef": "off"
  }
};
