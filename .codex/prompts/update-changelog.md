# Task: Update CHANGELOG.md with the Next Version

## Context
This project maintains a structured changelog in `CHANGELOG.md`.  
The format uses version headers like `## [0.1.2] - YYYY-MM-DD`, followed by categorized sections with emoji labels, such as:

- ### ✨ New Features
- ### 🔧 Improvements
- ### 📝 Documentation
- ### 🐛 Fixes
- ### 🚫 Temporarily Disabled / Limitations

Entries are written as bullet points with concise but clear explanations.

## Instructions
1. Identify the latest version tag (e.g., `0.1.2`) from Git tags.
2. Collect all commit messages since that tag.
3. Determine the **next version number** (patch, minor, or major).  
   - If uncertain, confirm the correct bump before applying.
4. Create a new changelog section at the top of `CHANGELOG.md` with the following format:

```

## \[NEXT\_VERSION] - YYYY-MM-DD

### ✨ New Features

* ...

### 🔧 Improvements

* ...

### 📝 Documentation

* ...

### 🐛 Fixes

* ...

```

- Include only the relevant categories.  
- If no entries exist for a category, omit it.

5. Group commits logically under the appropriate categories.  
- Documentation updates → 📝 Documentation  
- Refactors and optimizations → 🔧 Improvements  
- Bug fixes → 🐛 Fixes  
- New functionality → ✨ New Features  
- Temporary removals or limitations → 🚫 Temporarily Disabled / Limitations

6. Keep the existing changelog entries intact. Only add the new section for the upcoming version.

## Constraints
- Use valid Markdown formatting.
- Ensure the style matches the existing `CHANGELOG.md`.

## Expected Output
An updated `CHANGELOG.md` file with a new entry for the next version at the top, following the existing style and structure.
```