# Fixes for specs/web-ui-storybook.md

## 1. Requirement 7 — hardcoded color literals instead of theme references

**Spec item**: Requirement 7: "Rendered output in Storybook visually matches the app's existing theme tokens ... no hardcoded one-off colors or spacing introduced in `web-ui/`."

**Gap**: Two files hardcode hex color literals instead of importing them from `src/theme/`:
- `web-ui/stories/StatCard.stories.tsx:21` — `accentColor: '#ea580c'` (this is `colors.badgeOrange`'s value, duplicated as a literal instead of imported).
- `web-ui/.storybook/preview.js:9` — `value: '#f3f4f6'` (this is `colors.background`'s value, duplicated as a literal instead of imported).

Both values happen to match existing theme tokens today, but as written they are copies, not references — if the theme changes, these silently drift out of sync, which is exactly what Requirement 3's "no copies" principle (and Requirement 7's "no hardcoded" wording) is meant to prevent.

**Fix**:
- In `web-ui/stories/StatCard.stories.tsx`, import `colors` from `../../src/theme` and set `accentColor: colors.badgeOrange` instead of the literal string.
- In `web-ui/.storybook/preview.js`, import `colors` from `../../src/theme` (this file is bundled through webpack like the stories, so the import will resolve the same way) and use `colors.background` instead of the literal string.

## 2. Definition of Done — not yet committed or pushed

**Spec item**: Constraints & Non-Goals: "Work is done on a new git branch named `react-native-1.1`, committed, and pushed to origin. Commit messages must NOT include a co-author trailer." / Definition of Done: "All changes are committed on a branch named `react-native-1.1` and pushed to origin."

**Gap**: Branch `react-native-1.1` exists and is checked out, but no commit has been made yet and nothing has been pushed to origin.

**Fix**: Once fix #1 above is applied and re-verified, stage exactly the files belonging to this feature (`web-ui/`, `.eslintignore`, `specs/web-ui-storybook.md` — not the unrelated pre-existing deleted spec files already present in the working tree before this task started), commit with a message that does NOT include a co-author trailer, and push the branch to origin.
