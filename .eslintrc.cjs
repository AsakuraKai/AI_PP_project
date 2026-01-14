/* Root ESLint config tuned for the TypeScript agent codebase */
module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module"
    },
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    ignorePatterns: [
        "dist/",
        "coverage/",
        "node_modules/",
        "scripts/_deprecated*/**/*",
        "**/*.d.ts"
    ],
    rules: {
        // Relax rules that were generating noise for this project
        "no-console": "off",
        "no-empty": "off",
        "no-useless-escape": "off",
        "no-control-regex": "off",
        "prefer-const": ["warn", { destructuring: "all" }],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-unused-vars": [
            "warn",
            { args: "none", varsIgnorePattern: "^_" }
        ]
    }
};
