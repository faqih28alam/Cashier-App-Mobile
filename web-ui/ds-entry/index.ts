// Claude Design sync entry point — re-exports the shared UI component
// library so the converter can discover a package.json + .d.ts pair here
// (../../src/components/ui has neither) without adding one to the real
// app source tree. See .design-sync/NOTES.md for the full rationale.
export * from '../../src/components/ui';
