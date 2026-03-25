# Contributing to vue-code-reviewer

Thank you for your interest in contributing to vue-code-reviewer! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### 1. Reporting Bugs
- Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include steps to reproduce, expected vs actual behavior
- Provide environment details and code examples

### 2. Suggesting Features
- Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Clearly describe the problem and proposed solution
- Include use cases and technical details

### 3. Asking Questions
- Use the [Question template](.github/ISSUE_TEMPLATE/question.md)
- Check existing issues and documentation first
- Provide context and what you've tried

### 4. Submitting Code Changes

#### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/vue-code-reviewer.git
cd vue-code-reviewer

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint
```

#### Creating a Pull Request
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Add tests for new functionality
4. Update documentation if needed
5. Run tests and linting: `npm test && npm run lint`
6. Commit changes: `git commit -m "feat: description of changes"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

### 5. Writing Tests
- Add unit tests for new rules and features
- Test edge cases and error conditions
- Maintain test coverage

### 6. Documentation
- Update README.md for new features
- Add JSDoc comments for new functions
- Update configuration examples

## Development Guidelines

### Code Style
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Pull Request Process
1. PR title should clearly describe the change
2. PR description should explain the why, not just the what
3. Link related issues
4. Ensure all tests pass
5. Request review from maintainers

## Project Structure
```
vue-code-reviewer/
├── reviewer.js          # Core review engine
├── install.js          # Installation script
├── test.js            # Test suite
├── package.json       # Project configuration
├── README.md          # Project documentation
├── CONTRIBUTING.md    # This file
├── .github/          # GitHub templates and workflows
└── test-project/     # Example project for testing
```

## Rule Development

### Adding New Rules
1. Create rule object in `reviewer.js`
2. Add rule to appropriate rule set
3. Write tests for the rule
4. Update documentation

### Rule Structure
```javascript
const exampleRule = {
  id: 'rule-id',
  description: 'Rule description',
  category: 'performance|security|best-practice',
  severity: 'error|warning|info',
  check: (node, context) => {
    // Rule logic
    // Return { passed: true } or { passed: false, message: 'Issue description' }
  }
};
```

## Testing
- Run all tests: `npm test`
- Run specific test: `npm test -- --grep "test name"`
- Test coverage: `npm run test:coverage`

## Release Process
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm (maintainers only)

## Getting Help
- Check existing issues and discussions
- Join the BotLearn community for discussions
- Contact maintainers for urgent issues

## Recognition
All contributors will be acknowledged in the README.md and release notes.

Thank you for contributing to vue-code-reviewer! 🎉