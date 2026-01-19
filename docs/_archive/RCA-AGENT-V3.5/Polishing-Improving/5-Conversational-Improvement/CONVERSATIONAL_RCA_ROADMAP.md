# Conversational RCA: Project Overview

**Date:** January 18, 2026  
**Status:** Planning Phase  
**Estimated Timeline:** 6-8 weeks

---

## Purpose

This document provides a **high-level overview** of the Conversational RCA feature - transforming RCA from a one-shot analysis tool into an interactive debugging assistant with a chat-based interface.

## [DOCS] Complete Implementation Guide

**For detailed implementation instructions, see:**  
--> **[CHATBOX_UI_IMPLEMENTATION_GUIDE.md](./CHATBOX_UI_IMPLEMENTATION_GUIDE.md)** - The comprehensive guide containing:

- Complete architecture and system design
- **Single Component Architecture (CRITICAL)** - Why one ChatWidget instance across all views
- Phase-by-phase implementation roadmap (8 phases)
- Frontend & backend component specifications
- Integration with existing RCA views
- Technical specifications and data models
- Testing strategy and success metrics
- Code examples and implementation patterns
- Common mistakes to avoid and testing checklist

---

## Quick Overview

### What We're Building

A **floating chat widget** that appears across all RCA views, enabling:

- [CHAT] **Natural Conversations**: Ask follow-up questions about analyses
- [LOOP] **Iterative Refinement**: Refine analysis based on your feedback  
- [BOT] **Proactive Agent**: RCA asks clarifying questions when uncertain
- [CHART] **Context Awareness**: Chat adapts to current view (Dashboard, Error Queue, etc.)
- [NOTE] **Rich Feedback**: Provide detailed feedback beyond thumbs up/down

### [ARCH] Single Component Architecture

**CRITICAL DESIGN PRINCIPLE:**

The ChatWidget is **ONE React component instance** that:

[YES] **DO**: 
- Renders ONCE in `App.tsx` (not per-view)
- Floats as an overlay above ALL 7 tabs
- Maintains the SAME conversation across navigation
- Updates only internal context data when switching tabs
- Preserves position, structure, and conversation state

[NO] **DON'T**:
- Create separate chatbox instances per view
- Unmount/remount when switching tabs
- Reset conversation state on navigation
- Change component structure based on active view

**Visual Representation:**
```
┌─────────────────────────────────────────────────┐
│  App.tsx (Single Instance)                      │
│  ├─ Sidebar                                     │
│  ├─ Routes (Dashboard/Errors/Analyze/...)       │
│  └─ ChatWidget ← SINGLE COMPONENT FOR ALL TABS  │
│       │                                          │
│       ├─ Floats above ALL views                 │
│       ├─ Persists across navigation             │
│       └─ Context updates internally             │
└─────────────────────────────────────────────────┘

NOT 7 separate chatboxes [NO]
BUT 1 chatbox that adapts [YES]
```

### Success Targets

- 70%+ adoption rate among active users
- Average 2.5+ conversation turns (showing engagement)
- 40%+ improvement in analysis accuracy after refinement
- 35% reduction in re-analysis rate

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

### What We're Adding

[NEW] **New Components:**
- Floating chat widget UI (SINGLE instance across all views)
- Conversation memory and session management
- Intent classification for user requests
- Rich feedback collection interface
- Agent-initiated clarification prompts
- Context-aware conversation routing (adapts to active view)

**Key Technical Note:**
- [YES] ONE ChatWidget component that adapts
- [NO] NOT separate widget instances per view
- Component persists across all navigation
- Only context props update when switching tabs

---

## Implementation Timeline

**8-Week Roadmap:**

| Phase       | Duration | Focus Area            | Key Deliverables                          |
| ----------- | -------- | --------------------- | ----------------------------------------- |
| **Phase 1** | Week 1-2 | Foundation            | Chat widget, basic messaging, persistence |
| **Phase 2** | Week 3   | Intent Classification | Smart routing, context awareness          |
| **Phase 3** | Week 4   | Iterative Refinement  | Analysis improvement loop                 |
| **Phase 4** | Week 5   | Agent-Initiated       | Clarification questions                   |
| **Phase 5** | Week 6   | Rich Feedback         | Detailed feedback collection              |
| **Phase 6** | Week 7   | UI Polish             | Accessibility, animations                 |
| **Phase 7** | Week 8   | Testing               | User testing, optimization                |

### Key Features by Phase

**Phase 1-3 (Core MVP - Weeks 1-4):**
- [X] Floating chat widget on all views
- [X] Send/receive messages with persistence
- [X] Intent classification and routing
- [X] Context-aware suggestions per view
- [X] Iterative analysis refinement

**Phase 4-5 (Enhanced - Weeks 5-6):**
- [X] Agent asks clarifying questions
- [X] Rich feedback with categories and explanations
- [X] Learning pipeline integration

**Phase 6-7 (Polish - Weeks 7-8):**
- [X] Accessibility compliance
- [X] Performance optimization
- [X] User testing and validation

---

## For Complete Details

See **[CHATBOX_UI_IMPLEMENTATION_GUIDE.md](./CHATBOX_UI_IMPLEMENTATION_GUIDE.md)** for:

- [ARCH] Single Component Architecture (CRITICAL) - Comprehensive design pattern
- [FOLDER] Complete file structure and component hierarchy
- [TOOL] Detailed technical specifications
- [CODE] Code examples and implementation patterns
- [MAP] Architecture diagrams and data flows
- [TEST] Testing strategy, checklist, and success metrics
- [DATA] Data models and API contracts
- [DESIGN] UI/UX guidelines and component specs
- [FAQ] Common mistakes to avoid and troubleshooting

---

*Last Updated: January 18, 2026*
