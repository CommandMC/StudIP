const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname
            }
        },
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@typescript-eslint/no-confusing-void-expression': [
                'error',
                {
                    ignoreArrowShorthand: true
                }
            ],
            '@typescript-eslint/no-floating-promises': 'off',
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
            'no-empty': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_'
                }
            ]
        }
    },
    {
        ignores: ['out', 'dist', 'eslint.config.js']
    }
)
