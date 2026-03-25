---
name: Feature Request
about: Suggest a new feature or improvement for vue-code-reviewer
title: '[FEATURE] '
labels: enhancement
assignees: ''

---

## Problem Statement
Describe the problem you're trying to solve or the limitation you're facing.

**Example:** "I need to analyze Vue 3 Composition API patterns but the current rules don't cover..."

## Proposed Solution
Describe the feature or improvement you'd like to see.

**Example:** "Add a new rule that detects improper use of reactive() vs ref() in Composition API..."

## Alternative Solutions
Describe any alternative solutions or features you've considered.

## Use Cases
Describe specific scenarios where this feature would be useful.

1. **Use Case 1:** When reviewing large Vue 3 projects with mixed Options API and Composition API
2. **Use Case 2:** When enforcing specific coding standards across a team
3. **Use Case 3:** When integrating with CI/CD pipelines for automated code review

## Technical Details
If you have technical specifications or implementation ideas, share them here.

**Example implementation:**
```javascript
// New rule for detecting reactive() misuse
const reactiveMisuseRule = {
  id: 'reactive-misuse',
  description: 'Detect improper use of reactive() for primitive values',
  check: (node, context) => {
    // Rule logic
  }
};
```

## Impact
Describe the impact this feature would have:
- **Performance impact:** [e.g. Minimal, adds ~5ms per file]
- **Complexity impact:** [e.g. Adds 2 new configuration options]
- **Adoption impact:** [e.g. Makes the tool more useful for Vue 3 projects]

## Priority
How important is this feature to you?
- [ ] Critical (blocking my workflow)
- [ ] High (significantly improves my workflow)
- [ ] Medium (nice to have)
- [ ] Low (minor improvement)

## Additional Context
Add any other context, screenshots, or examples about the feature request here.