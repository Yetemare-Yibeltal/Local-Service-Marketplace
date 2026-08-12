// ============================================================
// COMMITLINT CONFIGURATION
// Enforces conventional commit message format
// ============================================================

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, missing semicolons, etc.)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system changes
        'ci', // CI configuration changes
        'chore', // Maintenance tasks
        'revert', // Revert previous commit
      ],
    ],
  },
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*)(?:\(([\w$.\-*/ ]*)\))?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      revertPattern: /^revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
      revertCorrespondence: ['header', 'hash'],
    },
  },
};