module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/strict-type-checked'],
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname
    },
    root: true,
    ignorePatterns: ['out', 'dist', '.eslintrc.js', '*.json', '*.yml', '*.yaml'],
    overrides: [
        {
            extends: ['plugin:@typescript-eslint/disable-type-checked'],
            files: ['./**/*.js']
        }
    ],
    rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-confusing-void-expression': [
            'error',
            {
                ignoreArrowShorthand: true
            }
        ],
        '@typescript-eslint/no-misused-promises': [
            'error',
            {
                checksVoidReturn: {
                    attributes: false
                }
            }
        ],
        '@typescript-eslint/restrict-template-expressions': [
            'error',
            {
                allowNumber: true
            }
        ],
        'no-empty': 'off'
    }
}
