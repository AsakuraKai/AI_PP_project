/**
 * MultiPassAgent - Enhanced ReAct loop with multi-hypothesis reasoning
 * 
 * Phase 2 Enhancement: Instead of single-pass analysis, generate and validate
 * multiple hypotheses about the root cause, then select the best one based on
 * evidence and confidence scoring.
 * 
 * Key Features:
 * - Generates 3 diverse hypotheses per error
 * - Validates each hypothesis using tools and context
 * - Scores hypotheses based on evidence strength
 * - Detects and eliminates contradictions
 * - Selects best hypothesis or creates consensus
 * 
 * Expected Impact: +5-8% usability improvement
 * 
 * @example
 * const agent = new MultiPassAgent(ollamaClient);
 * const result = await agent.analyze(parsedError);
 * // Result includes best hypothesis with supporting evidence
 */

import { MinimalReactAgent, AgentConfig } from './MinimalReactAgent';
import { OllamaClient } from '../llm/OllamaClient';
import { ParsedError, RCAResult } from '../types';
import { PerformanceTracker } from '../monitoring/PerformanceTracker';
import { TemplateEngine } from './TemplateEngine'; // Phase 5: Template integration

/**
 * Hypothesis about error root cause
 */
export interface Hypothesis {
  /** Unique ID for this hypothesis */
  id: string;
  
  /** Hypothesized root cause */
  rootCause: string;
  
  /** Evidence supporting this hypothesis */
  evidence: string[];
  
  /** Evidence contradicting this hypothesis */
  contradictions: string[];
  
  /** Confidence score (0-1) based on evidence */
  confidence: number;
  
  /** Fix guidelines if this hypothesis is correct */
  fixGuidelines: string[];
  
  /** Tools that provided evidence */
  toolsUsed: string[];
}

/**
 * Multi-pass analysis configuration
 */
export interface MultiPassConfig extends AgentConfig {
  /** Number of hypotheses to generate (default: 3) */
  numHypotheses?: number;
  
  /** Whether to enable consensus building (default: false) */
  enableConsensus?: boolean;
  
  /** Minimum evidence items required per hypothesis (default: 2) */
  minEvidenceItems?: number;
}

/**
 * MultiPassAgent extends MinimalReactAgent with hypothesis-based reasoning
 */
export class MultiPassAgent extends MinimalReactAgent {
  private readonly numHypotheses: number;
  private readonly enableConsensus: boolean;
  private readonly minEvidenceItems: number;
  private readonly templateEngine: TemplateEngine; // Phase 5: Template support

  constructor(llm: OllamaClient, config?: MultiPassConfig) {
    super(llm, config);
    this.numHypotheses = config?.numHypotheses ?? 3;
    this.enableConsensus = config?.enableConsensus ?? false;
    this.minEvidenceItems = config?.minEvidenceItems ?? 2;
    this.templateEngine = new TemplateEngine(); // Phase 5: Initialize template engine
  }

  /**
   * Enhanced analyze with multi-hypothesis reasoning
   */
  async analyze(error: ParsedError): Promise<RCAResult> {
    const perf = new PerformanceTracker();
    const analysisStart = perf.startTimer('multi_pass_analysis');

    try {
      console.log(`\n🔍 Starting multi-pass analysis (${this.numHypotheses} hypotheses)...`);

      // Step 1: Generate diverse hypotheses
      const hypothesesTimer = perf.startTimer('hypothesis_generation');
      const hypotheses = await this.generateHypotheses(error);
      hypothesesTimer();
      console.log(`✓ Generated ${hypotheses.length} hypotheses`);

      // Step 2: Validate each hypothesis with evidence
      const validationTimer = perf.startTimer('hypothesis_validation');
      const validatedHypotheses = await this.validateHypotheses(error, hypotheses);
      validationTimer();
      console.log(`✓ Validated hypotheses (${validatedHypotheses.filter(h => h.confidence > 0.5).length} strong)`);

      // Step 3: Select best hypothesis or build consensus
      const selectionTimer = perf.startTimer('hypothesis_selection');
      const bestResult = this.enableConsensus
        ? await this.buildConsensus(validatedHypotheses)
        : this.selectBestHypothesis(validatedHypotheses);
      selectionTimer();

      analysisStart();
      return bestResult;

    } catch (err) {
      analysisStart();
      console.error('❌ Multi-pass analysis failed:', err);
      
      // Fallback to single-pass analysis
      console.log('⚠️ Falling back to single-pass analysis...');
      return super.analyze(error);
    }
  }

  /**
   * Generate diverse hypotheses about the error
   */
  private async generateHypotheses(error: ParsedError): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    // Phase 5: Get error category for template selection
    const errorCategory = error.type || 'generic';
    console.log(`  📋 Using template category: ${errorCategory}`);

    for (let i = 0; i < this.numHypotheses; i++) {
      // Phase 5: Build template-aware prompt
      const diversityPrompt = this.buildTemplateAwareDiversityPrompt(
        error,
        errorCategory,
        hypotheses,
        i
      );
      
      try {
        const response = await this.llm.generate(diversityPrompt, {
          temperature: 0.2 + (i * 0.15), // Increase temperature for diversity
          maxTokens: 1500,
        });

        const parsed = this.parseHypothesisResponse(response.text, i);
        if (parsed && parsed.id && parsed.rootCause) {
          hypotheses.push(parsed);
          console.log(`  → Hypothesis ${i + 1}: ${parsed.rootCause.substring(0, 80)}...`);
        } else {
          console.warn(`⚠️ Skipping malformed hypothesis ${i + 1}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to generate hypothesis ${i + 1}:`, error);
      }
    }

    return hypotheses;
  }
  
  // ========== Phase 5: Template Integration Methods ==========
  
  /**
   * Build template-aware diversity prompt
   * Phase 5: Leverage templates for structured hypothesis generation
   */
  private buildTemplateAwareDiversityPrompt(
    error: ParsedError,
    errorCategory: string,
    existingHypotheses: Hypothesis[],
    iteration: number
  ): string {
    // Get template-based prompt for this error category
    const templatePrompt = this.templateEngine.getTemplatePrompt(errorCategory);
    
    // Add diversity instructions
    const diversityHint = existingHypotheses.length > 0
      ? `\n\n**DIVERSITY REQUIREMENT**: This is hypothesis #${iteration + 1}. Generate a DIFFERENT perspective from:\n${existingHypotheses.map(h => `- ${h.rootCause.substring(0, 60)}...`).join('\n')}`
      : '';
    
    return `${templatePrompt}

**ERROR DETAILS**:
File: ${error.filePath}
Line: ${error.line}
Message: ${error.message}
Type: ${error.type}
${diversityHint}

Generate a hypothesis by filling the template placeholders with specific values extracted from the error.
Return JSON format:
{
  "rootCause": "...",
  "evidence": ["...", "..."],
  "fixGuidelines": ["...", "..."],
  "confidence": 0.7
}`;
  }

  /**
   * Build prompt for generating diverse hypotheses (deprecated - use buildTemplateAwareDiversityPrompt)
   */
  /* private buildDiversityPrompt(error: ParsedError, existingHypotheses: Hypothesis[], index: number): string {
    const existingSummary = existingHypotheses.length > 0
      ? `\n\n**EXISTING HYPOTHESES (generate a DIFFERENT one):**\n${existingHypotheses.map((h, i) => 
          `${i + 1}. ${h.rootCause.substring(0, 100)}...`
        ).join('\n')}`
      : '';

    const diversityInstructions = index === 0
      ? 'Generate the MOST LIKELY hypothesis (common causes).'
      : index === 1
      ? 'Generate an ALTERNATIVE hypothesis (configuration/setup issues).'
      : 'Generate an EDGE CASE hypothesis (rare but possible causes).';

    return `You are analyzing an error. ${diversityInstructions}

**ERROR:**
${error.message}

**FILE:** ${error.filePath}:${error.line}
**TYPE:** ${error.type}
${existingSummary}

Generate a hypothesis in JSON format:
{
  "rootCause": "Detailed explanation (100+ chars)",
  "fixGuidelines": ["Step 1 with specifics", "Step 2 with verification"],
  "confidence": 0.7
}

OUTPUT ONLY VALID JSON:`;
  } */

  /**
   * Parse hypothesis response from LLM
   */
  private parseHypothesisResponse(response: string, index: number): Hypothesis | null {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `hypothesis_${index}`,
        rootCause: parsed.rootCause || 'Unknown',
        evidence: [],
        contradictions: [],
        confidence: parsed.confidence || 0.5,
        fixGuidelines: parsed.fixGuidelines || [],
        toolsUsed: [],
      };
    } catch (error) {
      console.warn('Failed to parse hypothesis response:', error);
      return null;
    }
  }

  /**
   * Validate hypotheses by gathering evidence
   */
  private async validateHypotheses(error: ParsedError, hypotheses: Hypothesis[]): Promise<Hypothesis[]> {
    const validatedHypotheses: Hypothesis[] = [];

    for (const hypothesis of hypotheses) {
      try {
        // Use single-pass analysis to gather evidence
        const evidenceResult = await super.analyze(error);
        
        // Check if evidence supports this hypothesis
        const evidence = this.extractEvidence(evidenceResult, hypothesis);
        const contradictions = this.detectContradictions(evidenceResult, hypothesis);
        
        // Update confidence based on evidence
        const evidenceScore = this.calculateEvidenceScore(evidence, contradictions);
        
        validatedHypotheses.push({
          ...hypothesis,
          evidence,
          contradictions,
          confidence: (hypothesis.confidence + evidenceScore) / 2,
          toolsUsed: evidenceResult.toolsUsed || [],
        });

        const hypothesisId = hypothesis?.id || 'unknown';
        console.log(`  → Hypothesis ${hypothesisId}: confidence ${((hypothesis.confidence + evidenceScore) / 2 * 100).toFixed(0)}%`);

      } catch (error) {
        const hypothesisId = hypothesis?.id || 'unknown';
        console.warn(`⚠️ Failed to validate hypothesis ${hypothesisId}:`, error);
        validatedHypotheses.push(hypothesis);
      }
    }

    return validatedHypotheses;
  }

  /**
   * Extract evidence from analysis result that supports hypothesis
   */
  private extractEvidence(result: RCAResult, hypothesis: Hypothesis): string[] {
    const evidence: string[] = [];

    // Check if root cause mentions similar concepts
    const hypothesisKeywords = this.extractKeywords(hypothesis.rootCause);
    const resultKeywords = this.extractKeywords(result.rootCause);
    
    const commonKeywords = hypothesisKeywords.filter(k => resultKeywords.includes(k));
    if (commonKeywords.length > 0) {
      evidence.push(`Root cause analysis mentions: ${commonKeywords.join(', ')}`);
    }

    // Check if code context supports hypothesis
    if (result.codeContext && result.codeContext.length > 50) {
      evidence.push('Code context available for verification');
    }

    // Check if tools were used successfully
    if (result.toolsUsed && result.toolsUsed.length > 0) {
      evidence.push(`Tools used: ${result.toolsUsed.join(', ')}`);
    }

    return evidence;
  }

  /**
   * Detect contradictions between evidence and hypothesis
   */
  private detectContradictions(result: RCAResult, hypothesis: Hypothesis): string[] {
    const contradictions: string[] = [];

    // Check for conflicting statements
    const hypothesisLower = hypothesis.rootCause.toLowerCase();
    const resultLower = result.rootCause.toLowerCase();

    // Simple contradiction detection (can be enhanced)
    if (hypothesisLower.includes('missing') && resultLower.includes('present')) {
      contradictions.push('Evidence shows item is present, but hypothesis claims missing');
    }
    if (hypothesisLower.includes('incorrect') && resultLower.includes('correct')) {
      contradictions.push('Evidence shows correctness, but hypothesis claims incorrect');
    }

    return contradictions;
  }

  /**
   * Calculate evidence score based on supporting and contradicting evidence
   */
  private calculateEvidenceScore(evidence: string[], contradictions: string[]): number {
    const baseScore = Math.min(evidence.length / this.minEvidenceItems, 1.0);
    const contradictionPenalty = contradictions.length * 0.2;
    
    return Math.max(0, baseScore - contradictionPenalty);
  }

  /**
   * Extract keywords from text for comparison
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4); // Filter short words
    
    return [...new Set(words)]; // Unique keywords
  }

  /**
   * Select best hypothesis based on confidence and evidence
   */
  private selectBestHypothesis(hypotheses: Hypothesis[]): RCAResult {
    // Handle empty hypotheses
    if (!hypotheses || hypotheses.length === 0) {
      console.warn('⚠️ No hypotheses available to select from');
      return {
        error: '',
        rootCause: 'Unable to generate hypotheses for analysis',
        fixGuidelines: ['Review error logs manually', 'Check for similar issues in documentation'],
        confidence: 0,
        toolsUsed: [],
        codeContext: 'No hypotheses were generated',
      };
    }

    // Sort by confidence
    const sorted = [...hypotheses].sort((a, b) => b.confidence - a.confidence);
    const best = sorted[0];

    console.log(`✓ Selected best hypothesis: ${best.id} (confidence: ${(best.confidence * 100).toFixed(0)}%)`);

    return {
      error: '',
      rootCause: best.rootCause,
      fixGuidelines: best.fixGuidelines,
      confidence: best.confidence,
      toolsUsed: best.toolsUsed,
      codeContext: `Evidence: ${best.evidence?.join('; ') || 'None'}\nContradictions: ${best.contradictions?.join('; ') || 'None'}`,
    };
  }

  /**
   * Build consensus from multiple hypotheses
   */
  private async buildConsensus(hypotheses: Hypothesis[]): Promise<RCAResult> {
    console.log('🔄 Building consensus from hypotheses...');

    // Filter strong hypotheses
    const strongHypotheses = hypotheses.filter(h => h.confidence > 0.5);
    
    if (strongHypotheses.length === 0) {
      return this.selectBestHypothesis(hypotheses);
    }

    // Create consensus prompt
    const consensusPrompt = this.buildConsensusPrompt(strongHypotheses);
    
    try {
      const response = await this.llm.generate(consensusPrompt, {
        temperature: 0.1,
        maxTokens: 2000,
      });

      const parsed = this.parseConsensusResponse(response.text);
      
      return {
        error: '',
        rootCause: parsed.rootCause,
        fixGuidelines: parsed.fixGuidelines,
        confidence: parsed.confidence,
        toolsUsed: strongHypotheses.flatMap(h => h.toolsUsed),
        codeContext: `Consensus built from ${strongHypotheses.length} hypotheses`,
      };

    } catch (error) {
      console.warn('⚠️ Consensus building failed, using best hypothesis');
      return this.selectBestHypothesis(hypotheses);
    }
  }

  /**
   * Build prompt for consensus generation
   */
  private buildConsensusPrompt(hypotheses: Hypothesis[]): string {
    const hypothesesText = hypotheses.map((h, i) => 
      `**Hypothesis ${i + 1}** (confidence: ${(h.confidence * 100).toFixed(0)}%):\n${h.rootCause}\n\nEvidence: ${h.evidence.join(', ') || 'None'}`
    ).join('\n\n');

    return `You are analyzing multiple hypotheses about an error. Build a CONSENSUS that combines the best insights.

${hypothesesText}

Generate a consensus analysis in JSON format:
{
  "rootCause": "Synthesized explanation combining strongest insights (150+ chars)",
  "fixGuidelines": ["Comprehensive step 1", "Comprehensive step 2", "Verification step"],
  "confidence": 0.8
}

OUTPUT ONLY VALID JSON:`;
  }

  /**
   * Parse consensus response from LLM
   */
  private parseConsensusResponse(response: string): { rootCause: string; fixGuidelines: string[]; confidence: number } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        rootCause: parsed.rootCause || 'Unable to build consensus',
        fixGuidelines: parsed.fixGuidelines || ['Review individual hypotheses'],
        confidence: parsed.confidence || 0.6,
      };
    } catch (error) {
      return {
        rootCause: 'Unable to build consensus from hypotheses',
        fixGuidelines: ['Review individual hypotheses manually'],
        confidence: 0.5,
      };
    }
  }
}
