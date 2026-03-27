Instruction: Check Existing Code Before Creating New Implementations

Before creating any new feature, component, utility, or service, you must first review the existing codebase to avoid duplication and ensure consistency.

Required steps:

Search the codebase

Use global search for relevant keywords, function names, or similar logic.

Check common folders such as utils/, services/, components/, hooks/, or modules/.

Review existing implementations

Identify whether a similar solution already exists.

Verify if it can be reused, extended, or slightly refactored to meet the new requirement.

Prefer reuse over creation

Extend or generalize existing code instead of introducing parallel logic.

Follow existing patterns, naming conventions, and architectural decisions.

Create new code only when justified

Only introduce a new implementation if:

No existing solution fits the requirement, or

Existing solutions are clearly unsuitable and cannot be reasonably adapted.

Document the reason for creating something new (e.g., in PR description or comments).

When in doubt

Ask for clarification during code review or consult the team before adding new abstractions.

Goal:
Reduce duplication, improve maintainability, and keep the codebase consistent and easier to evolve.