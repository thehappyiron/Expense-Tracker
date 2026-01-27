# Directives (Layer 1: What to Do)

This folder contains Standard Operating Procedures (SOPs) written in Markdown.

## Purpose

Directives define:
- **Goals**: What outcome is expected
- **Inputs**: What data/context is needed
- **Tools/Scripts**: Which execution scripts to use
- **Outputs**: Expected deliverables
- **Edge Cases**: Known exceptions and how to handle them

## Guidelines

- Write in natural language, like instructions for a mid-level employee
- Be specific about expected inputs and outputs
- Document learned constraints and edge cases
- Reference scripts from `execution/` folder

## Structure

Each directive should follow this template:

```markdown
# [Directive Name]

## Goal
[What this directive accomplishes]

## Inputs
- [Input 1]
- [Input 2]

## Execution
1. [Step 1 - reference script if applicable]
2. [Step 2]

## Outputs
- [Expected output]

## Edge Cases
- [Known exception and how to handle]

## Learnings
- [Discovered constraints, API limits, timing, etc.]
```
