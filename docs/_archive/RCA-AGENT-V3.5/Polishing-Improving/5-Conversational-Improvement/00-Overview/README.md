# Conversational RCA: Overview and Getting Started

**Date:** January 18, 2026  
**Status:** Implementation Planning  
**Design Reference:** `Figma/Replicate UI Design/src/app/components/ChatBox.tsx`

---

## Table of Contents

- [Purpose](#purpose)
- [Success Criteria](#success-criteria)
- [What's Already Built](#whats-already-built)
- [Design Location](#design-location)
- [Integration Approach](#integration-approach)
- [Document Structure](#document-structure)

---

## Purpose

Transform RCA from a **one-shot analysis tool** into an **interactive debugging assistant** by adding a floating chat interface that:

1. **Engages in Dialogue**: Users can ask follow-up questions and refine analyses
2. **Iterates Continuously**: RCA refines analysis based on feedback
3. **Learns Contextually**: Each interaction improves future analyses
4. **Provides Rich Feedback**: Beyond thumbs up/down
5. **Acts Proactively**: RCA asks clarifying questions when uncertain

---

## Success Criteria

- **70%+ adoption rate** among users who complete initial analysis
- **Average 2.5+ turns** per conversation (indicating engagement)
- **40%+ improvement** in analysis accuracy after refinement
- **Reduced re-analysis rate** by 35%

---

## What's Already Built (Reusable)

[OK] **Existing Infrastructure:**
- Modern React webview with Tailwind CSS
- VS Code message passing architecture
- ReAct Agent with multi-iteration support
- Feedback system (FeedbackHandler)
- Learning pipeline (AdaptiveLearning)
- State streaming for real-time updates
- History management and persistence
- 7 existing views (Dashboard, Error Queue, Analyze, etc.)

---

## Design Location

- **New Design:** `Figma/Replicate UI Design/src/app/components/ChatBox.tsx`
- **Design System:** `Figma/Replicate UI Design/src/app/components/ui/*`
- **Implementation Target:** `vscode-extension/webview/src/`

---

## Integration Approach

**[PRIMARY] Floating Widget Pattern** - A persistent, collapsible chatbox overlay that appears on all views, providing context-aware conversational assistance regardless of which tab the user is viewing.

---

## Document Structure

This guide is organized into focused sections:

### Core Concepts
- **00-Overview** (This document) - Project overview and quick start
- **01-Architecture** - Single component architecture and design principles
- **02-System-Design** - Complete system architecture and data flow

### Implementation
- **03-Component-Specifications** - Detailed component specs and code examples
- **04-Context-System** - Context-aware conversation system
- **05-Type-Definitions** - TypeScript interfaces and types
- **06-Integration-Points** - Backend and extension integration

### Phases
- **Phase-1-Foundation** - Core widget and basic messaging
- **Phase-2-Intent-Classification** - Smart routing and context awareness
- **Phase-3-Iterative-Refinement** - Analysis improvement loop
- **Phase-4-Agent-Initiated** - Clarification questions
- **Phase-5-Rich-Feedback** - Detailed feedback collection
- **Phase-6-UI-Polish** - Accessibility and animations
- **Phase-7-Testing** - User testing and optimization

### References
- **Testing-Strategy** - Complete testing checklist
- **Technical-Specifications** - Data models and API contracts
- **Quick-Reference** - Quick lookup guide for developers

---

## Quick Start

### For First-Time Readers

1. Read this overview document
2. Review the [Architecture document](../01-Architecture/README.md)
3. Check the [Phase 1 implementation guide](../Phase-1-Foundation/README.md)
4. Start building!

### For Returning Developers

Use the [Quick Reference](../Quick-Reference/README.md) for:
- Key file locations
- Component hierarchy
- Important dependencies
- View type constants

---

## Timeline Overview

**8-Week Implementation:**

| Phase       | Duration | Focus Area            | Key Deliverables                          |
| ----------- | -------- | --------------------- | ----------------------------------------- |
| **Phase 1** | Week 1-2 | Foundation            | Chat widget, basic messaging, persistence |
| **Phase 2** | Week 3   | Intent Classification | Smart routing, context awareness          |
| **Phase 3** | Week 4   | Iterative Refinement  | Analysis improvement loop                 |
| **Phase 4** | Week 5   | Agent-Initiated       | Clarification questions                   |
| **Phase 5** | Week 6   | Rich Feedback         | Detailed feedback collection              |
| **Phase 6** | Week 7   | UI Polish             | Accessibility, animations                 |
| **Phase 7** | Week 8   | Testing               | User testing, optimization                |

---

## Related Documentation

- **Backend Strategy**: [CONVERSATIONAL_RCA_ROADMAP.md](../CONVERSATIONAL_RCA_ROADMAP.md)
- **Design Source**: `Figma/Replicate UI Design/src/app/components/`
- **Existing Code**: `vscode-extension/webview/src/`
- **Agent Architecture**: `src/agent/`

---

## Next Steps

1. **Review this document** with the team
2. **Study the [Architecture](../01-Architecture/README.md)** to understand the single component pattern
3. **Read [Phase 1 guide](../Phase-1-Foundation/README.md)** for implementation details
4. **Copy UI components** from Figma to webview
5. **Start building!**

---

**Last Updated:** January 18, 2026  
**Maintained By:** Development Team  
**Status:** Living Document (Update as implementation progresses)
