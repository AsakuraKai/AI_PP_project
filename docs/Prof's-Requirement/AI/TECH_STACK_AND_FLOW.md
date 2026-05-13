# RCA Agent: Technology Stack & Application Flow

## 1. Technology Stack

The RCA (Root Cause Analysis) Agent leverages a modern, local-first architecture integrated directly into the developer's IDE.

### Frontend (IDE Integration)
* **VS Code Extension API:** The core host environment for the agent.
* **React & TypeScript:** Used for the interactive Webview dashboard (Error Queue & Fix Suggestions).

### Backend & Agent Logic
* **Node.js / TypeScript:** Core extension logic, tool execution, and orchestration.
* **ReAct Agent Framework:** Custom implementation of the Synergizing Reasoning and Acting loop (Thought → Action → Observation).
* **Error Parsers:** 26+ custom parsers specifically designed for Kotlin/Android build and runtime errors.

### AI & Data Layer
* **Local LLM:** Ollama running `DeepSeek-R1-Distill-Qwen-7B` for privacy-preserving, local-first inference.
* **Cloud LLMs (Hybrid Mode):** Integrations with Gemini, Claude, and OpenAI via cloud APIs for fallback/advanced reasoning.
* **Vector Database:** ChromaDB for local Retrieval-Augmented Generation (RAG) to cache and retrieve prior successful error resolutions.

## 2. Application Flow / Methodology

The following diagram illustrates the lifecycle of an error from detection to resolution within the RCA Agent system.

```mermaid
flowchart TD
    %% Define Styles
    classDef user fill:#e1f5fe,stroke:#3b82f6,stroke-width:2px;
    classDef ide fill:#f3e5f5,stroke:#0288d1,stroke-width:2px;
    classDef agent fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef data fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef llm fill:#fce4ec,stroke:#8e24aa,stroke-width:2px;

    %% Nodes
    A[Developer encounters Android/Kotlin Error]:::user
    B[VS Code Extension Detects Error]:::ide
    C[Error Parsers Extract Context <br/> 26+ Specific Types]:::ide
    
    D[RCA Agent Initialized]:::agent
    E[(ChromaDB)]:::data
    F[Retrieve Past Similar Errors/Fixes <br/> RAG]:::data
    
    G[ReAct Loop Initiated]:::agent
    H[Thought: Analyze Error Context]:::agent
    I[Action: Use Tools <br/> File Read, LSP, Search]:::agent
    J[Observation: Review Tool Output]:::agent
    
    K{Local or Cloud?}:::agent
    L[Local: Ollama DeepSeek 7B]:::llm
    M[Cloud: Gemini / Claude / OpenAI]:::llm
    
    N[Generate Root Cause & Fix Suggestion]:::agent
    O[Display on React Webview Dashboard]:::ide
    P[Developer Applies Fix]:::user

    %% Edges
    A --> B
    B --> C
    C --> D
    D --> F
    E -.->|Vector Search| F
    F --> G
    
    G --> H
    H --> I
    I --> J
    J -->|Refine Analysis| H
    J -->|Sufficient Context| K
    
    K -->|Privacy First| L
    K -->|Advanced Mode| M
    
    L --> N
    M --> N
    
    N --> O
    O --> P
    N -.->|Cache Success| E
```