# [DOCS] Documentation Index

> **Quick navigation to all RCA Agent documentation**  
> **Last Updated:** January 9, 2026 (Documentation Consolidation)  
> **Status:** UI Removed - Backend Complete - Ready for Fresh Implementation [DONE]  
> **Note:** All UI components removed - See new UI implementation guides below [LAUNCH]

---

## [ALERT] IMPORTANT: UI Components Removed

**All UI has been removed from the extension.** Backend services remain fully functional.

**New UI Design Documentation** (January 9, 2026):
- [RCA_UI_FIGMA_PLAN.md](./RCA_UI_FIGMA_PLAN.md) - **NEW:** Visual design, views, and implementation plan
- [RCA_UI_ROADMAP.md](./RCA_UI_ROADMAP.md) - **NEW:** 4-week implementation roadmap
- [RCA_UI_WIRING_GUIDE.md](./RCA_UI_WIRING_GUIDE.md) - Complete backend API mapping
- [RCA_UI_REMOVAL_SUMMARY.md](./RCA_UI_REMOVAL_SUMMARY.md) - What was removed and why

---

## [TARGET] Quick Start

**New to the project?** Start here:
1. [README.md](README.md) - Project overview and complete quick start guide
2. [RCA_UI_FIGMA_PLAN.md](./RCA_UI_FIGMA_PLAN.md) - **NEW:** Figma-inspired UI design
3. [RCA_UI_ROADMAP.md](./RCA_UI_ROADMAP.md) - **NEW:** Implementation roadmap (4 weeks)
4. [RCA_UI_WIRING_GUIDE.md](./RCA_UI_WIRING_GUIDE.md) - Backend API mapping
5. [DEVLOG.md](DEVLOG.md) - Development journal with current status

---

## [BOOK] Documentation by Category

### [DESIGN] NEW: UI Design & Implementation (Jan 9, 2026)

| Document                                                 | Purpose                                                                             | Size | Status          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- | --------------- |
| [RCA_UI_FIGMA_PLAN.md](./RCA_UI_FIGMA_PLAN.md)           | **Visual design plan** - Figma-inspired layout, 7 views, color system, mockups      | 18KB | [DONE] New      |
| [RCA_UI_ROADMAP.md](./RCA_UI_ROADMAP.md)                 | **4-week implementation roadmap** - timeline, milestones, success criteria          | 8KB  | [DONE] New      |
| [RCA_UI_WIRING_GUIDE.md](./RCA_UI_WIRING_GUIDE.md)       | **Backend API mapping** - services, commands, message protocol, wiring instructions | 45KB | [DONE] Updated  |
| [RCA_UI_REMOVAL_SUMMARY.md](./RCA_UI_REMOVAL_SUMMARY.md) | **Removal summary** - what was removed, what's preserved, why                       | 8KB  | [DONE] Complete |

### [BUILD] Core Documentation (Root Level)

| Document                                                       | Purpose                                                      | Status               |
| -------------------------------------------------------------- | ------------------------------------------------------------ | -------------------- |
| [README.md](README.md)                                         | Project overview, quick start, and setup guide               | [DONE] Current       |
| [DEVLOG.md](DEVLOG.md)                                         | Weekly development journal + current status & phase progress | [DONE] Current       |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)                   | **CONSOLIDATED:** Complete file tree, statistics, build info | [DONE] Updated Jan 9 |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)                       | Developer reference for extending RCA Agent                  | [DONE] Current       |
| [USER_GUIDE.md](USER_GUIDE.md)                                 | User guide for using RCA Agent                               | [DONE] Current       |
| [LEARNINGS.md](LEARNINGS.md)                                   | Project insights and lessons learned                         | [DONE] Current       |
| [data/RCA_DATA_AND_TRAINING.md](data/RCA_DATA_AND_TRAINING.md) | Dataset inventory, RCA data flow, zero-shot rationale        | [DONE] New Jan 14    |
| [DOCS_INDEX.md](DOCS_INDEX.md)                                 | This file - Documentation navigation                         | [DONE] Updated Jan 9 |

**Recent Changes:**
- [DONE] **Consolidated PROJECT_STRUCTURE.md** - Merged PROJECT_FILE_STRUCTURE.md and PROJECT_STRUCTURE_STATS.md
- [DONE] **Archived UNWIRED_UI_COMPONENTS.md** → _archive/ (obsolete - UI removed)
- [DONE] **Merged STATUS.md into DEVLOG.md** - Current status now at top of devlog
- [DONE] **Moved EDUCATIONAL_MODE.md** → architecture/
- [DONE] **Moved VSCODE_EXTENSION_GUIDE.md** → architecture/extension/
- [DONE] **Moved IMPROVEMENT_ROADMAP.md** → _archive/ (historical planning)

---

### [TEST] Testing Documentation

| Document                                                           | Purpose                                                                         | Status          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------- |
| [testing/TESTING_COMPLETE.md](testing/TESTING_COMPLETE.md)         | **Consolidated testing docs** - All test results, performance tools, validation | [DONE] Current  |
| [testing/QUICK_REFERENCE.md](testing/QUICK_REFERENCE.md)           | Quick test reference guide                                                      | [DONE] Current  |
| [testing/TESTING_SUMMARY.md](testing/TESTING_SUMMARY.md)           | Historical testing summary                                                      | [DONE] Archived |
| [testing/TEST_RUN_SUMMARY.md](testing/TEST_RUN_SUMMARY.md)         | Historical test run summary                                                     | [DONE] Archived |
| [testing/test-output-archive.txt](testing/test-output-archive.txt) | Raw test output data                                                            | [DONE] Archived |

**Test Result Data:**
- [data/results.json](data/results.json) - Latest test results (10 test cases)
- [data/full-results.json](data/full-results.json) - Complete test results (36 test cases)
- [data/accuracy-metrics.json](data/accuracy-metrics.json) - Accuracy test metrics

**Contents of TESTING_COMPLETE.md:**
- Test Run Summary (907/921 tests - 98.5%)
- Performance Tools (comparison, validation)
- Chunks 5.3-5.4 Implementation Summary
- Detailed analysis and recommendations

---

### [BUILD] Architecture Documentation

| Document                                                             | Purpose                                                                  | Lines  | Status          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ | --------------- |
| [architecture/README.md](architecture/README.md)                     | **Architecture index** - Quick navigation to all architecture docs       | ~60    | [DONE] NEW      |
| [architecture/overview.md](architecture/overview.md)                 | System architecture with diagrams                                        | ~1,800 | [DONE] Complete |
| [architecture/agent-workflow.md](architecture/agent-workflow.md)     | Agent reasoning flow (ReAct pattern)                                     | ~2,100 | [DONE] Complete |
| [architecture/database-design.md](architecture/database-design.md)   | ChromaDB schema and caching                                              | ~1,300 | [DONE] Complete |
| [architecture/EDUCATIONAL_MODE.md](architecture/EDUCATIONAL_MODE.md) | **Educational mode guide** - What/Why/How explanations (38+ error types) | ~444   | [DONE] Complete |
| [architecture/decisions/](architecture/decisions/)                   | Architecture Decision Records (ADRs)                                     | -      | [DONE] Active   |

**Extension Architecture:**
- [architecture/extension/EXTENSION_ARCHITECTURE.md](architecture/extension/EXTENSION_ARCHITECTURE.md) - Technical architecture (~1,000 lines)
- [architecture/extension/EXTENSION_VISUAL_WORKFLOW.md](architecture/extension/EXTENSION_VISUAL_WORKFLOW.md) - Visual workflows (~840 lines)
- [architecture/extension/VSCODE_EXTENSION_GUIDE.md](architecture/extension/VSCODE_EXTENSION_GUIDE.md) - **Complete user guide** (~829 lines)

---

### [SIGNAL] API Documentation

| Document                                     | Purpose                                                | Lines  | Status          |
| -------------------------------------------- | ------------------------------------------------------ | ------ | --------------- |
| [api/README.md](api/README.md)               | **API index** - Quick navigation to all API docs       | ~50    | [DONE] NEW      |
| [api/API_CONTRACTS.md](api/API_CONTRACTS.md) | Tool interfaces and JSON schemas                       | ~2,165 | [DONE] Complete |
| [api/Agent.md](api/Agent.md)                 | Agent APIs (MinimalReactAgent, EducationalAgent, etc.) | ~900   | [DONE] Complete |
| [api/Parsers.md](api/Parsers.md)             | Parser APIs (26+ error types)                          | ~700   | [DONE] Complete |
| [api/Tools.md](api/Tools.md)                 | Tool APIs (ReadFileTool, LSPTool, etc.)                | ~650   | [DONE] Complete |
| [api/Database.md](api/Database.md)           | Database APIs (ChromaDB, caching, quality)             | ~800   | [DONE] Complete |

**Total API Documentation:** ~5,265 lines

---

### [FAST] Performance Documentation

| Document                                                                             | Purpose                                             | Status          |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- | --------------- |
| [performance/benchmarks.md](performance/benchmarks.md)                               | Complete performance metrics and optimization guide | [DONE] Complete |
| [performance/PERFORMANCE_TESTING_GUIDE.md](performance/PERFORMANCE_TESTING_GUIDE.md) | Performance testing methodology and tools           | [DONE] Complete |

**Includes:**
- RTX 3070 Ti benchmark results
- Latency analysis (p50, p90, p99)
- Optimization strategies
- Performance targets and achievements
- Testing tools and procedures

---

### [LINK] VS Code Extension Documentation

| Document                                               | Purpose                                                                                     | Status          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------- |
| [VSCODE_EXTENSION_GUIDE.md](VSCODE_EXTENSION_GUIDE.md) | **Complete user guide** - Installation, features, shortcuts, configuration, troubleshooting | [DONE] Complete |
| [EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md)             | **Educational mode guide** - What/Why/How explanations, 38+ error types                     | [DONE] Complete |

**Architecture & Technical Details:**
- [architecture/extension/EXTENSION_ARCHITECTURE.md](architecture/extension/EXTENSION_ARCHITECTURE.md) - Technical architecture, components, data flow
- [architecture/extension/EXTENSION_VISUAL_WORKFLOW.md](architecture/extension/EXTENSION_VISUAL_WORKFLOW.md) - Visual diagrams and workflows

**Archived (Future/Reference):**
- [_archive/USER_GUIDE.md](_archive/USER_GUIDE.md) - Panel-based UI guide (v2.0 features - future implementation)
- [_archive/KEYBOARD_SHORTCUTS.md](_archive/KEYBOARD_SHORTCUTS.md) - Detailed shortcuts (see VSCODE_EXTENSION_GUIDE for reference)

---

### � Planning & Roadmap

| Document                                         | Purpose                                | Lines  | Status          |
| ------------------------------------------------ | -------------------------------------- | ------ | --------------- |
| [IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md) | Future enhancement roadmap (Phase 3-5) | ~2,000 | [DONE] Planning |

---

### [PACKAGE] Archived Documentation

| Location                                                                        | Contents                                                               |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [_archive/](\_archive/)                                                         | Historical documentation, completed phases, consolidation records      |
| [_archive/IMPROVEMENT_ROADMAP.md](\_archive/IMPROVEMENT_ROADMAP.md)             | **Comprehensive roadmap** - Future enhancement planning (~1,906 lines) |
| [_archive/milestones/](\_archive/milestones/)                                   | Chunk completion reports                                               |
| [_archive/phases/](\_archive/phases/)                                           | Detailed implementation guides                                         |
| [_archive/consolidation-history/](\_archive/consolidation-history/)             | CHUNK consolidations, cleanup summaries                                |
| [_archive/RCA-AGENT-UPDATE-12-25-2025/](\_archive/RCA-AGENT-UPDATE-12-25-2025/) | Pre-Phase 4 documentation                                              |

**Recently Consolidated/Archived (Jan 5, 2026):**
- [DONE] **STATUS.md** → Merged into DEVLOG.md (current status at top)
- [DONE] **IMPROVEMENT_ROADMAP.md** → Moved to _archive/ (historical planning)
- [DONE] **EDUCATIONAL_MODE.md** → Moved to architecture/
- [DONE] **VSCODE_EXTENSION_GUIDE.md** → Moved to architecture/extension/
- Phase 4 completion docs: PHASE4_FINAL_REPORT.md, PHASE4_STATUS_UPDATE.md, PHASE4_WHATS_LEFT.md
- Phase 4 implementation docs: PHASE4_OPTION_C_INTEGRATION.md, OPTION_C_IMPLEMENTATION.md
- Consolidation docs: CONSOLIDATION_SUMMARY_JAN_3_2026.md, DEDUPLICATION_PLAN.md, PROJECT_FILE_CHUNKS.md

**Previously Archived (Jan 3, 2026):**
- 15 CHUNK consolidation files (CHUNK1-15) → [_archive/consolidation-history/](_archive/consolidation-history/)
- CLEANUP_SUMMARY.md + WEEK4_CLEANUP_COMPLETE.md → [_archive/consolidation-history/](_archive/consolidation-history/)
- AGENT_LEARNING_SUMMARY.md → [_archive/consolidation-history/](_archive/consolidation-history/)

---

## [LOCATION] Documentation Roadmap

### Phase 1 Backend ([DONE] Complete)
- [DONE] API documentation (4 files, ~3,050 lines)
- [DONE] Architecture documentation (3 files, ~5,200 lines)
- [DONE] Performance documentation (~1,400 lines)
- [DONE] Testing documentation (consolidated)
- [DONE] VS Code extension docs (4 files)

### Phase 2 Frontend ([CYCLE] In Progress)
- Extension implementation (with Sokchea)
- User guides and tutorials
- Troubleshooting guides
- Video demos

### Phase 3+ Future
- Advanced usage patterns
- Plugin system documentation
- Multi-language support guides
- Team collaboration features

---

## [CHART] Documentation Statistics

**Total Documentation:** ~30,000+ lines across 4 core documents + organized subdirectories

| Category                       | Files   | Lines       | Status                           |
| ------------------------------ | ------- | ----------- | -------------------------------- |
| **Core Docs (root)**           | **4**   | **~4,150**  | **[DONE] Consolidated**          |
| ↳ README.md                    | 1       | ~300        | [DONE] Current                   |
| ↳ DEVLOG.md                    | 1       | ~2,900+     | [DONE] Updated (includes status) |
| ↳ PROJECT_STRUCTURE.md         | 1       | ~700        | [DONE] Current                   |
| ↳ DOCS_INDEX.md                | 1       | ~250        | [DONE] Current                   |
| **Subdirectories**             | -       | -           | -                                |
| ↳ API Docs (api/)              | 5       | ~5,215      | [DONE] Complete                  |
| ↳ Architecture (architecture/) | 8       | ~9,473      | [DONE] Complete                  |
| ↳ Performance (performance/)   | 2       | ~1,400      | [DONE] Complete                  |
| ↳ Testing (testing/)           | 5       | ~1,700      | [DONE] Complete                  |
| ↳ Data (data/)                 | 3       | -           | [DONE] Test results              |
| ↳ Archived (_archive/)         | 50+     | ~15,000+    | [DONE] Historical                |
| **Total Active**               | **~27** | **~22,938** | **[DONE] Production Ready**      |

**Consolidation Results:**
- **Before (Jan 5 morning):** 8 files in main docs/ folder
- **After (Jan 5 evening):** 4 files in main docs/ folder + organized subdirectories
- **Reduction:** 50% fewer root files while preserving ALL content
- **Status.md:** Merged into DEVLOG.md
- **Moved to folders:** EDUCATIONAL_MODE.md, VSCODE_EXTENSION_GUIDE.md
- **Archived:** IMPROVEMENT_ROADMAP.md

---

## [SEARCH] Quick Reference

### Common Tasks

**I want to...**
- **Get started quickly** → [README.md](README.md) [STAR] START HERE
- **Understand the project** → [README.md](README.md)
- **Check current status** → [DEVLOG.md](DEVLOG.md) (see "Current Status" section at top)
- **See recent progress** → [DEVLOG.md](DEVLOG.md)
- **Use the APIs** → [api/API_CONTRACTS.md](api/API_CONTRACTS.md) or [api/](api/)
- **Understand architecture** → [architecture/overview.md](architecture/overview.md)
- **Check test results** → [testing/TESTING_COMPLETE.md](testing/TESTING_COMPLETE.md)
- **Optimize performance** → [performance/benchmarks.md](performance/benchmarks.md)
- **Use the extension** → [architecture/extension/VSCODE_EXTENSION_GUIDE.md](architecture/extension/VSCODE_EXTENSION_GUIDE.md)
- **Understand extension architecture** → [architecture/extension/EXTENSION_ARCHITECTURE.md](architecture/extension/EXTENSION_ARCHITECTURE.md)
- **See visual workflows** → [architecture/extension/EXTENSION_VISUAL_WORKFLOW.md](architecture/extension/EXTENSION_VISUAL_WORKFLOW.md)
- **Learn educational mode** → [architecture/EDUCATIONAL_MODE.md](architecture/EDUCATIONAL_MODE.md)
- **Plan future work** → [_archive/IMPROVEMENT_ROADMAP.md](_archive/IMPROVEMENT_ROADMAP.md)
- **Review Phase 4 work** → [_archive/PHASE4_FINAL_REPORT.md](_archive/PHASE4_FINAL_REPORT.md)
- **Review historical work** → [_archive/consolidation-history/](_archive/consolidation-history/)

---

## [IDEA] Documentation Tips

1. **Start with README.md** - Gets you oriented
2. **Check DEVLOG.md** - Current status, phase progress, and recent work
3. **Refer to api/API_CONTRACTS.md** - Quick API reference
4. **Deep dive in api/** - Detailed API documentation
5. **Understand flow in architecture/** - System design and features
6. **Check performance/** - Performance targets and optimization
7. **Historical context in _archive/** - Past work and planning

---

## [LAUNCH] Contributing to Documentation

When adding new documentation:
1. Update this index with new files
2. Update DEVLOG.md with progress (includes status)
3. Follow existing document structure
4. Include clear headers and navigation
5. Add to appropriate subdirectory (api/, architecture/, testing/, performance/)
6. Keep root docs/ folder minimal (only 4 core files)

---

**Last Updated:** January 9, 2026  
**Maintained By:** Kai (Backend Developer)  
**Next Update:** After fresh UI implementation

---

## [NOTE] Recent Changes

### January 9, 2026 - Project Structure Consolidation [TARGET]
**File Structure Simplification:**
- [DONE] **Consolidated PROJECT_STRUCTURE.md** - Merged PROJECT_FILE_STRUCTURE.md (874 lines) and PROJECT_STRUCTURE_STATS.md (63 lines) into single comprehensive document
- [DONE] **Archived UNWIRED_UI_COMPONENTS.md** → _archive/ (obsolete - all UI was removed, see RCA_UI_WIRING_GUIDE.md instead)
- [DONE] **Enhanced PROJECT_STRUCTURE.md** - Now includes file statistics, detailed structure tree, component explanations, and build instructions
- [DONE] **Reduced structure documentation from 3 to 1 file** (67% reduction)

**Results:**
- Single source of truth for project structure
- Complete statistics integrated (1,861 files, 286 directories)
- Detailed component breakdowns
- Build and development workflow instructions
- No information lost, better organization

### January 5, 2026 - Major Consolidation Round 2 [TARGET]
**Root-Level Simplification:**
- [DONE] **Merged STATUS.md into DEVLOG.md** - Status now tracked at top of devlog
- [DONE] **Moved EDUCATIONAL_MODE.md** → architecture/ (feature documentation)
- [DONE] **Moved VSCODE_EXTENSION_GUIDE.md** → architecture/extension/ (better organization)
- [DONE] **Moved IMPROVEMENT_ROADMAP.md** → _archive/ (historical planning document)
- [DONE] **Reduced from 8 to 4 root files** (50% reduction, even cleaner!)

**Results:**
- **Root docs/ now has only 4 essential files:** README, DEVLOG, PROJECT_STRUCTURE, DOCS_INDEX
- All feature documentation properly organized in subdirectories
- Current status integrated into development log (natural progression)
- Extension and architecture docs grouped logically
- Historical planning archived appropriately

### January 5, 2026 - Major Consolidation Round 1
**Documentation Organization:**
- [DONE] Moved Phase 4 docs to _archive/ (7 files)
- [DONE] Moved API_CONTRACTS.md → api/
- [DONE] Moved TESTING_COMPLETE.md → testing/
- [DONE] Moved extension architecture → architecture/extension/
- [DONE] Created README.md in api/ and architecture/ folders
- [DONE] Reduced from 19 to 8 root files (58% reduction)

### January 3, 2026 - Initial Consolidation
**Documentation Streamlining:**
- [DONE] Archived 15 CHUNK consolidation files
- [DONE] Reduced from 27 to 19 main files (30% reduction)

**Overall Progress:**
- Started with 27 root-level docs (Jan 3)
- Now down to **4 root-level docs** (Jan 5)
- **85% reduction** while preserving ALL content [SPARKLE]
