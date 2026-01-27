# Execution Scripts (Layer 3: Doing the Work)

This folder contains deterministic Python scripts that handle actual execution.

## Purpose

Execution scripts handle:
- API calls
- Data processing
- File operations
- Database interactions

## Guidelines

- Scripts must be **deterministic** and **testable**
- Include clear comments explaining the logic
- Handle errors gracefully with informative messages
- Use environment variables from `.env` for credentials
- Keep scripts focused on a single responsibility

## Script Template

```python
#!/usr/bin/env python3
"""
Script Name: [script_name.py]
Purpose: [What this script does]
Inputs: [Expected inputs]
Outputs: [What it produces]
Usage: python [script_name.py] [args]
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Main execution function."""
    try:
        # Your logic here
        pass
    except Exception as e:
        print(f"Error: {e}")
        raise

if __name__ == "__main__":
    main()
```

## Error Handling

When scripts fail:
1. Errors are logged with stack traces
2. The orchestration layer (LLM) reads the error
3. Script is fixed and tested
4. Directive is updated with learnings
