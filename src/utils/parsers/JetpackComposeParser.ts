/**
 * JetpackComposeParser - Parse Jetpack Compose-specific errors
 * 
 * Handles Compose UI framework errors including:
 * - remember/rememberSaveable errors (state not remembered)
 * - derivedStateOf errors
 * - Excessive recomposition warnings
 * - LaunchedEffect/DisposableEffect errors
 * - CompositionLocal errors
 * - Modifier chain errors
 * - State read during composition errors
 * - Side effect errors
 * 
 * Design Philosophy:
 * - Compose-specific pattern matching
 * - Extract recomposition metrics for performance analysis
 * - Identify state management issues
 * - Provide framework-specific context
 * 
 * @example
 * const parser = new JetpackComposeParser();
 * const error = parser.parse(errorText);
 * if (error?.type === 'compose_remember') {
 *   console.log('State not properly remembered');
 * }
 */

import { ParsedError } from '../../types';

/**
 * Compose-specific error types
 */
export type ComposeErrorType =
  | 'compose_remember'
  | 'compose_derived_state'
  | 'compose_recomposition'
  | 'compose_launched_effect'
  | 'compose_disposable_effect'
  | 'compose_composition_local'
  | 'compose_modifier'
  | 'compose_side_effect'
  | 'compose_state_read'
  | 'compose_snapshot';

/**
 * Parser for Jetpack Compose framework errors
 */
export class JetpackComposeParser {
  /**
   * Parse Compose error text into structured format
   * Tries multiple error type parsers in order of specificity
   * 
   * @param errorText - Raw error message from Compose runtime or compiler
   * @returns ParsedError if successfully parsed, null if not a Compose error
   */
  parse(errorText: string): ParsedError | null {
    if (!errorText || typeof errorText !== 'string') {
      return null;
    }

    // Trim and limit size
    const text = errorText.trim().slice(0, 100000);

    // Try each Compose-specific parser (order matters - most specific first)
    return (
      this.parseRememberError(text) ||
      this.parseDerivedStateOfError(text) ||
      this.parseRecompositionError(text) ||
      this.parseLaunchedEffectError(text) ||
      this.parseDisposableEffectError(text) ||
      this.parseCompositionLocalError(text) ||
      this.parseModifierError(text) ||
      this.parseSideEffectError(text) ||
      this.parseStateReadError(text) ||
      this.parseSnapshotError(text) ||
      null
    );
  }

  /**
   * Parse remember-related errors
   * Example: "Creating a state object during composition without using remember"
   */
  private parseRememberError(text: string): ParsedError | null {
    const patterns = [
      /Creating a state object during composition without using remember/i,
      /reading a state.*without calling remember/i,
      /State should be created with remember/i,
      /mutableStateOf\s+should be wrapped in remember/i,
      /remember\s*\{[^}]*\}\s+should\s+have\s+keys/i,
      /rememberSaveable\s+is\s+required/i,
      /State\s+created\s+outside\s+of\s+remember/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);
        const stateVar = this.extractStateVariable(text);

        return {
          type: 'compose_remember',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'State management',
            stateVariable: stateVar,
            suggestion: 'Wrap state creation in remember { } or rememberSaveable { }',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse derivedStateOf-related errors
   * Example: "derivedStateOf should be used with remember"
   */
  private parseDerivedStateOfError(text: string): ParsedError | null {
    const patterns = [
      /derivedStateOf\s+should\s+be\s+used\s+with\s+remember/i,
      /derivedStateOf\s+recomputing\s+on\s+every\s+recomposition/i,
      /derivedStateOf\s+not\s+wrapped\s+in\s+remember/i,
      /Expensive\s+derivation.*derivedStateOf/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'compose_derived_state',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Derived state',
            suggestion: 'Wrap derivedStateOf in remember { } to cache the derivation',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse recomposition performance warnings
   * Example: "Recomposing 150 times" or excessive recomposition detected
   */
  private parseRecompositionError(text: string): ParsedError | null {
    // Pattern for explicit recomposition count
    const countMatch = text.match(/[Rr]ecompos(?:ing|ition)\s+(\d+)\s+times/);
    if (countMatch) {
      const count = parseInt(countMatch[1], 10);
      // Only flag as error if excessive (more than 10 recompositions)
      if (count > 10) {
        const { filePath, line } = this.extractFileInfo(text);
        const composableName = this.extractComposableName(text);

        return {
          type: 'compose_recomposition',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Performance',
            recompositionCount: count,
            composable: composableName,
            severity: count > 50 ? 'high' : 'medium',
            suggestion: 'Use derivedStateOf, remember, or key() to reduce recompositions',
          },
        };
      }
    }

    // Pattern for generic recomposition warnings
    const patterns = [
      /excessive\s+recomposition/i,
      /unstable\s+parameter.*causing\s+recomposition/i,
      /lambda.*causing\s+unnecessary\s+recomposition/i,
      /recomposition\s+loop\s+detected/i,
      /infinite\s+recomposition/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);
        const composableName = this.extractComposableName(text);

        return {
          type: 'compose_recomposition',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Performance',
            composable: composableName,
            severity: text.toLowerCase().includes('infinite') ? 'critical' : 'high',
            suggestion: 'Check for unstable parameters or state changes during composition',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse LaunchedEffect-related errors
   * Example: "LaunchedEffect must have at least one key"
   */
  private parseLaunchedEffectError(text: string): ParsedError | null {
    const patterns = [
      /LaunchedEffect\s+must\s+have\s+at\s+least\s+one\s+key/i,
      /LaunchedEffect\s+key\s+should\s+not\s+be\s+Unit/i,
      /LaunchedEffect.*cancelled/i,
      /LaunchedEffect.*coroutine.*exception/i,
      /suspend\s+function.*outside\s+LaunchedEffect/i,
      /rememberCoroutineScope.*instead\s+of\s+LaunchedEffect/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);
        const keyInfo = this.extractEffectKey(text);

        return {
          type: 'compose_launched_effect',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Side effect',
            effectType: 'LaunchedEffect',
            key: keyInfo,
            suggestion: 'Ensure LaunchedEffect has proper keys and handles cancellation',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse DisposableEffect-related errors
   * Example: "DisposableEffect onDispose must be called"
   */
  private parseDisposableEffectError(text: string): ParsedError | null {
    const patterns = [
      /DisposableEffect.*onDispose\s+must\s+be\s+called/i,
      /DisposableEffect.*missing\s+onDispose/i,
      /DisposableEffect\s+key\s+should\s+not\s+be\s+Unit/i,
      /DisposableEffect.*not\s+properly\s+disposed/i,
      /onDispose\s+not\s+invoked/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'compose_disposable_effect',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Side effect',
            effectType: 'DisposableEffect',
            suggestion: 'Ensure DisposableEffect includes onDispose { } cleanup block',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse CompositionLocal-related errors
   * Example: "CompositionLocal not provided"
   */
  private parseCompositionLocalError(text: string): ParsedError | null {
    const patterns = [
      /CompositionLocal\s+(\w+)\s+not\s+provided/i,
      /No\s+value\s+provided\s+for\s+(\w+)/i,
      /LocalComposition.*not\s+found/i,
      /CompositionLocalProvider\s+missing/i,
      /staticCompositionLocalOf.*no\s+default/i,
      /compositionLocalOf.*not\s+in\s+scope/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const { filePath, line } = this.extractFileInfo(text);
        const localName = match[1] || this.extractCompositionLocalName(text);

        return {
          type: 'compose_composition_local',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Dependency injection',
            localName,
            suggestion: 'Wrap your composable tree with CompositionLocalProvider',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse Modifier-related errors
   * Example: "Modifier.clickable must come after Modifier.padding"
   */
  private parseModifierError(text: string): ParsedError | null {
    const patterns = [
      /Modifier\.(\w+)\s+must\s+come\s+(before|after)\s+Modifier\.(\w+)/i,
      /Invalid\s+Modifier\s+chain/i,
      /Modifier.*order\s+matters/i,
      /Modifier\s+not\s+applied/i,
      /then\s+modifier.*order/i,
      /Modifier\.composed.*recomposition/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const { filePath, line } = this.extractFileInfo(text);
        const modifiers = this.extractModifierInfo(text);

        return {
          type: 'compose_modifier',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Modifier chain',
            modifiers,
            suggestion: 'Review Modifier chain order - layout modifiers should come first',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse side effect usage errors
   * Example: "Side effects should not be called during composition"
   */
  private parseSideEffectError(text: string): ParsedError | null {
    const patterns = [
      /[Ss]ide\s+effect.*called\s+during\s+composition/i,
      /SideEffect\s+block.*throwing/i,
      /produceState.*exception/i,
      /snapshotFlow.*collect.*outside/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'compose_side_effect',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Side effect',
            suggestion: 'Use LaunchedEffect, DisposableEffect, or SideEffect appropriately',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse state read during composition errors
   * Example: "Reading state during composition may cause issues"
   */
  private parseStateReadError(text: string): ParsedError | null {
    const patterns = [
      /[Rr]eading\s+state\s+during\s+composition/i,
      /state\s+read\s+in\s+composable\s+body/i,
      /SnapshotStateList.*concurrent\s+modification/i,
      /state\s+mutation\s+during\s+composition/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'compose_state_read',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'State management',
            suggestion: 'Avoid mutating or reading state directly in composition - use LaunchedEffect',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse Snapshot system errors
   * Example: "Snapshot is not writable"
   */
  private parseSnapshotError(text: string): ParsedError | null {
    const patterns = [
      /Snapshot\s+is\s+not\s+writable/i,
      /Cannot\s+modify\s+state.*snapshot/i,
      /SnapshotMutationPolicy.*exception/i,
      /Snapshot.*already\s+disposed/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'compose_snapshot',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            framework: 'compose',
            errorType: 'Snapshot system',
            suggestion: 'Ensure state modifications happen in proper context',
          },
        };
      }
    }

    return null;
  }

  /**
   * Extract file path and line number from error text
   */
  private extractFileInfo(text: string): { filePath: string; line: number } {
    // Try standard compiler format: "file.kt:line:column"
    const compilerMatch = text.match(/(\w+\.kt):(\d+):(\d+)/);
    if (compilerMatch) {
      return {
        filePath: compilerMatch[1],
        line: parseInt(compilerMatch[2], 10),
      };
    }

    // Try simplified format: "file.kt:line"
    const simpleMatch = text.match(/(\w+\.kt):(\d+)/);
    if (simpleMatch) {
      return {
        filePath: simpleMatch[1],
        line: parseInt(simpleMatch[2], 10),
      };
    }

    // Try stack trace format: "at package.Class.method(File.kt:line)"
    const stackMatch = text.match(/at\s+[\w.]+\(([\w.]+\.kt):(\d+)\)/);
    if (stackMatch) {
      return {
        filePath: stackMatch[1],
        line: parseInt(stackMatch[2], 10),
      };
    }

    // Try format with path: "(file.kt:line)"
    const pathMatch = text.match(/\(([\w.]+\.kt):(\d+)\)/);
    if (pathMatch) {
      return {
        filePath: pathMatch[1],
        line: parseInt(pathMatch[2], 10),
      };
    }

    return {
      filePath: 'unknown',
      line: 0,
    };
  }

  /**
   * Extract state variable name from error text
   */
  private extractStateVariable(text: string): string | undefined {
    const patterns = [
      /mutableStateOf\s*\(\s*(\w+)/i,
      /remember\s*\{\s*(\w+)/i,
      /state\s+(\w+)\s+/i,
      /variable\s+'(\w+)'/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract composable function name from error text
   */
  private extractComposableName(text: string): string | undefined {
    const patterns = [
      /@Composable\s+(\w+)/i,
      /[Cc]omposable\s+(\w+)/i,
      /[Ff]unction\s+(\w+)/i,
      /in\s+(\w+)\s+composable/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract effect key information from error text
   */
  private extractEffectKey(text: string): string | undefined {
    const patterns = [
      /key\s*=\s*(\w+)/i,
      /key\s+(\w+)/i,
      /LaunchedEffect\s*\(\s*(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract CompositionLocal name from error text
   */
  private extractCompositionLocalName(text: string): string | undefined {
    const patterns = [
      /Local(\w+)/i,
      /CompositionLocal\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract modifier information from error text
   */
  private extractModifierInfo(text: string): string[] {
    const modifiers: string[] = [];
    const pattern = /Modifier\.(\w+)/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (!modifiers.includes(match[1])) {
        modifiers.push(match[1]);
      }
    }

    return modifiers;
  }

  /**
   * Quick check if text contains Compose error patterns
   * Useful for routing before full parsing
   */
  static isComposeError(text: string): boolean {
    if (!text) return false;

    const composeIndicators = [
      /remember\s*\{/i,
      /rememberSaveable/i,
      /derivedStateOf/i,
      /LaunchedEffect/i,
      /DisposableEffect/i,
      /SideEffect/i,
      /CompositionLocal/i,
      /mutableStateOf/i,
      /@Composable/i,
      /[Rr]ecompos/i,
      /Modifier\./i,
      /compose\./i,
      /androidx\.compose/i,
      /snapshot/i,
      /produceState/i,
      /snapshotFlow/i,
    ];

    return composeIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Get all supported Compose error types
   */
  static getSupportedErrorTypes(): ComposeErrorType[] {
    return [
      'compose_remember',
      'compose_derived_state',
      'compose_recomposition',
      'compose_launched_effect',
      'compose_disposable_effect',
      'compose_composition_local',
      'compose_modifier',
      'compose_side_effect',
      'compose_state_read',
      'compose_snapshot',
    ];
  }
}
