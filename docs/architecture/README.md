# Architecture Documentation

> **System design, workflows, and architectural decisions for RCA Agent**

---

## [DOCS] Core Architecture

### System Design
- **[overview.md](overview.md)** - Complete system architecture with component diagrams (~1,800 lines)
- **[agent-workflow.md](agent-workflow.md)** - Detailed ReAct reasoning flow and agent lifecycle (~2,100 lines)
- **[database-design.md](database-design.md)** - ChromaDB schema, caching strategy, and quality management (~1,300 lines)

### Feature Documentation
- **[EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md)** - Educational mode guide with What/Why/How explanations (~444 lines)

### VS Code Extension Architecture
- **[extension/EXTENSION_ARCHITECTURE.md](extension/EXTENSION_ARCHITECTURE.md)** - Technical architecture, components, and integration (~1,000 lines)
- **[extension/EXTENSION_VISUAL_WORKFLOW.md](extension/EXTENSION_VISUAL_WORKFLOW.md)** - Visual diagrams and user workflows (~840 lines)
- **[extension/VSCODE_EXTENSION_GUIDE.md](extension/VSCODE_EXTENSION_GUIDE.md)** - Complete user guide (~829 lines)

### Architecture Decisions
- **[decisions/](decisions/)** - Architecture Decision Records (ADRs)
  - [README.md](decisions/README.md) - ADR index and guidelines
  - [ADR-TEMPLATE.md](decisions/ADR-TEMPLATE.md) - Template for new ADRs

### Diagrams
- **[diagrams/](diagrams/)** - ASCII art diagrams and visual representations

---

## [TARGET] Quick Navigation

**Looking for...**
- **System overview** → [overview.md](overview.md)
- **How agents work** → [agent-workflow.md](agent-workflow.md)
- **Database design** → [database-design.md](database-design.md)
- **Educational mode** → [EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md)
- **Extension user guide** → [extension/VSCODE_EXTENSION_GUIDE.md](extension/VSCODE_EXTENSION_GUIDE.md)
- **Extension architecture** → [extension/EXTENSION_ARCHITECTURE.md](extension/EXTENSION_ARCHITECTURE.md)
- **Visual workflows** → [extension/EXTENSION_VISUAL_WORKFLOW.md](extension/EXTENSION_VISUAL_WORKFLOW.md)
- **Design decisions** → [decisions/](decisions/)

---

## [CHART] Documentation Scope

### Backend Architecture
- Component interactions and dependencies
- ReAct agent reasoning patterns
- Tool execution pipeline
- Database schema and caching
- Performance optimization strategies

### Frontend Architecture  
- VS Code extension components
- Chat participant integration
- Real-time streaming updates
- UI/UX patterns
- State management

### Decision Records
- Key architectural choices
- Trade-offs and rationale
- Future considerations

---

**Total Lines:** ~7,200  
**Last Updated:** January 5, 2026
