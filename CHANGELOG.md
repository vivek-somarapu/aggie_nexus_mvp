# Changelog

All notable changes to this project are documented here.

## [0.1.2] - 2026-06-09

### Added
- Curriculum file upload: staff can now upload PDFs and DOCXs directly from the curriculum form instead of only entering URLs. Files are stored in Supabase Storage.
- Automatic AI embedding of uploaded curriculum files: when a PDF or DOCX is uploaded as a curriculum resource, its full text content is extracted and indexed into the RAG pipeline automatically (via `next/server after()`). The AI Advisor can now answer questions about the actual content of uploaded slides and documents, not just their titles.
- `lib/ai/extract-file-text.ts`: shared text extraction utility (pdf-parse, mammoth) used by both the embedding pipeline and the context-docs upload route.
- `deleteCurriculumFileEmbeddings()` and `embedCurriculumFile()` exports from the embedding pipeline for single-record background indexing.
- Curriculum embedding cleanup: hiding (`is_active=false`) or deleting a curriculum file immediately removes its embedding rows from the vector store in the background.

### Changed
- Curriculum bucket added to the upload API (`/api/upload/[bucket]`) with PDF/DOCX MIME type restriction.
- `embedCurriculumFiles()` in the embedding pipeline now fetches and parses file content for pdf/docx resources, embedding the full document text rather than just title + description. Change detection uses a URL-based hash so unchanged files are skipped without re-fetching.
- `context-docs/route.ts` now uses the shared `extractTextFromBuffer` utility instead of inline pdf-parse/mammoth calls.
- Gemini 2.0 Flash replaced with Gemini 2.5 Flash (model deprecation).

### Fixed
- Security: auth-gated search routes (`/api/search/*`) that were previously unauthenticated.
- Security: added AI rate limiting to the advisor endpoint.
- Security: removed debug/test endpoints (`/api/debug`, `/api/test/auth`, `/admin/auth-monitoring`).
- Security: implemented CSO audit findings — hardened session handling, removed insecure patterns.
- Security: removed `.gstack/` browse logs from the repository; added to `.gitignore`.
- MCP: destructured `keyId` from `requireAccelAuth` response to fix auth in MCP route handlers.

## [0.1.1] - 2026-06-08

Initial accelerator platform release.
