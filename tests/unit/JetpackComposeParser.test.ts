/**
 * Tests for JetpackComposeParser
 * 
 * Validates parsing of Jetpack Compose-specific error types:
 * - remember errors (state not remembered)
 * - derivedStateOf errors
 * - Recomposition performance warnings
 * - LaunchedEffect errors
 * - DisposableEffect errors
 * - CompositionLocal errors
 * - Modifier chain errors
 * - Side effect errors
 * - State read errors
 * - Snapshot system errors
 */

import { JetpackComposeParser } from '../../src/utils/parsers/JetpackComposeParser';

describe('JetpackComposeParser', () => {
  let parser: JetpackComposeParser;

  beforeEach(() => {
    parser = new JetpackComposeParser();
  });

  describe('parse() - remember errors', () => {
    it('should parse "Creating state without remember" error', () => {
      const errorText = `
        Creating a state object during composition without using remember
        at HomeScreen.kt:45:10
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_remember');
      expect(result?.filePath).toBe('HomeScreen.kt');
      expect(result?.line).toBe(45);
      expect(result?.language).toBe('kotlin');
      expect(result?.metadata?.framework).toBe('compose');
    });

    it('should parse "reading state without remember" error', () => {
      const errorText = `
        Error: reading a state object without calling remember
        at ProfileScreen.kt:23
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_remember');
      expect(result?.metadata?.suggestion).toContain('remember');
    });

    it('should parse mutableStateOf without remember error', () => {
      const errorText = `
        mutableStateOf should be wrapped in remember to survive recomposition
        at SettingsScreen.kt:78:15
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_remember');
      expect(result?.filePath).toBe('SettingsScreen.kt');
      expect(result?.line).toBe(78);
    });

    it('should parse rememberSaveable required error', () => {
      const errorText = `
        rememberSaveable is required for state that should survive configuration changes
        at FormScreen.kt:102
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_remember');
    });
  });

  describe('parse() - derivedStateOf errors', () => {
    it('should parse derivedStateOf without remember error', () => {
      const errorText = `
        derivedStateOf should be used with remember to avoid recomputing on every recomposition
        at CalculatorScreen.kt:34:8
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_derived_state');
      expect(result?.filePath).toBe('CalculatorScreen.kt');
      expect(result?.line).toBe(34);
      expect(result?.metadata?.framework).toBe('compose');
    });

    it('should parse derivedStateOf recomputing warning', () => {
      const errorText = `
        Warning: derivedStateOf recomputing on every recomposition - missing remember
        at SearchScreen.kt:56
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_derived_state');
      expect(result?.metadata?.suggestion).toContain('remember');
    });

    it('should parse expensive derivation warning', () => {
      const errorText = `
        Expensive derivation detected. Use derivedStateOf with remember for performance.
        at ListScreen.kt:89:12
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_derived_state');
    });
  });

  describe('parse() - recomposition errors', () => {
    it('should parse excessive recomposition count (>10)', () => {
      const errorText = `
        Performance warning: Recomposing 150 times in ListItem composable
        at ItemCard.kt:23:5
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_recomposition');
      expect(result?.metadata?.recompositionCount).toBe(150);
      expect(result?.metadata?.severity).toBe('high');
      expect(result?.filePath).toBe('ItemCard.kt');
      expect(result?.line).toBe(23);
    });

    it('should NOT parse low recomposition count (<=10)', () => {
      const errorText = `
        Recomposing 5 times
      `.trim();

      const result = parser.parse(errorText);

      expect(result).toBeNull();
    });

    it('should parse excessive recomposition warning', () => {
      const errorText = `
        Warning: Excessive recomposition detected in UserProfile
        at UserProfile.kt:67
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_recomposition');
      expect(result?.metadata?.errorType).toBe('Performance');
    });

    it('should parse unstable parameter causing recomposition', () => {
      const errorText = `
        Unstable parameter onClick causing recomposition on every parent update
        at Button.kt:12:3
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_recomposition');
    });

    it('should parse infinite recomposition error with critical severity', () => {
      const errorText = `
        Error: Infinite recomposition loop detected
        at RecursiveComponent.kt:45
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_recomposition');
      expect(result?.metadata?.severity).toBe('critical');
    });

    it('should parse lambda causing unnecessary recomposition', () => {
      const errorText = `
        Lambda { onClick } causing unnecessary recomposition - consider remember
        at ButtonRow.kt:89:20
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_recomposition');
    });
  });

  describe('parse() - LaunchedEffect errors', () => {
    it('should parse LaunchedEffect missing key error', () => {
      const errorText = `
        LaunchedEffect must have at least one key parameter
        at DataLoader.kt:34:9
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_launched_effect');
      expect(result?.filePath).toBe('DataLoader.kt');
      expect(result?.line).toBe(34);
      expect(result?.metadata?.effectType).toBe('LaunchedEffect');
    });

    it('should parse LaunchedEffect key should not be Unit', () => {
      const errorText = `
        LaunchedEffect key should not be Unit - use a meaningful key
        at InitScreen.kt:23
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_launched_effect');
    });

    it('should parse LaunchedEffect coroutine exception', () => {
      const errorText = `
        LaunchedEffect coroutine exception: NetworkError
        at ApiScreen.kt:78:15
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_launched_effect');
    });

    it('should parse suspend function outside LaunchedEffect error', () => {
      const errorText = `
        Cannot call suspend function loadData() outside LaunchedEffect or coroutine scope
        at MainScreen.kt:56
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_launched_effect');
    });
  });

  describe('parse() - DisposableEffect errors', () => {
    it('should parse DisposableEffect missing onDispose', () => {
      const errorText = `
        DisposableEffect: onDispose must be called to clean up resources
        at SensorScreen.kt:45:8
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_disposable_effect');
      expect(result?.filePath).toBe('SensorScreen.kt');
      expect(result?.line).toBe(45);
      expect(result?.metadata?.effectType).toBe('DisposableEffect');
    });

    it('should parse DisposableEffect not properly disposed', () => {
      const errorText = `
        Warning: DisposableEffect not properly disposed - resource leak detected
        at CameraScreen.kt:89
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_disposable_effect');
      expect(result?.metadata?.suggestion).toContain('onDispose');
    });
  });

  describe('parse() - CompositionLocal errors', () => {
    it('should parse CompositionLocal not provided error', () => {
      const errorText = `
        CompositionLocal LocalTheme not provided. Wrap your composable with CompositionLocalProvider.
        at ThemedButton.kt:12:5
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_composition_local');
      expect(result?.metadata?.localName).toBe('LocalTheme');
      expect(result?.filePath).toBe('ThemedButton.kt');
      expect(result?.line).toBe(12);
    });

    it('should parse "No value provided" format', () => {
      const errorText = `
        No value provided for LocalNavController
        at NavigationHost.kt:34
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_composition_local');
      expect(result?.metadata?.localName).toBe('LocalNavController');
    });

    it('should parse staticCompositionLocalOf no default error', () => {
      const errorText = `
        staticCompositionLocalOf: LocalUser has no default value
        at UserContext.kt:8
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_composition_local');
    });
  });

  describe('parse() - Modifier errors', () => {
    it('should parse Modifier order error', () => {
      const errorText = `
        Modifier.clickable must come after Modifier.padding for correct touch handling
        at Card.kt:56:12
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_modifier');
      expect(result?.filePath).toBe('Card.kt');
      expect(result?.line).toBe(56);
      expect(result?.metadata?.modifiers).toContain('clickable');
      expect(result?.metadata?.modifiers).toContain('padding');
    });

    it('should parse invalid Modifier chain error', () => {
      const errorText = `
        Invalid Modifier chain detected - conflicting size modifiers
        at LayoutBox.kt:34
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_modifier');
      expect(result?.metadata?.suggestion).toContain('Modifier chain order');
    });

    it('should parse Modifier not applied warning', () => {
      const errorText = `
        Warning: Modifier not applied - ensure chaining with then()
        at CustomComponent.kt:78
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_modifier');
    });
  });

  describe('parse() - Side effect errors', () => {
    it('should parse side effect during composition error', () => {
      const errorText = `
        Side effect should not be called during composition - use LaunchedEffect
        at DataScreen.kt:45:8
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_side_effect');
      expect(result?.filePath).toBe('DataScreen.kt');
      expect(result?.line).toBe(45);
    });

    it('should parse SideEffect block throwing error', () => {
      const errorText = `
        SideEffect block throwing exception: IllegalStateException
        at LoggingScreen.kt:23
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_side_effect');
    });
  });

  describe('parse() - State read errors', () => {
    it('should parse reading state during composition', () => {
      const errorText = `
        Warning: Reading state during composition may cause unexpected behavior
        at StateScreen.kt:67:12
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_state_read');
      expect(result?.filePath).toBe('StateScreen.kt');
      expect(result?.line).toBe(67);
    });

    it('should parse SnapshotStateList concurrent modification', () => {
      const errorText = `
        SnapshotStateList concurrent modification detected during composition
        at ListManager.kt:89
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_state_read');
    });

    it('should parse state mutation during composition', () => {
      const errorText = `
        Error: state mutation during composition is not allowed
        at FormValidator.kt:34
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_state_read');
    });
  });

  describe('parse() - Snapshot errors', () => {
    it('should parse Snapshot not writable error', () => {
      const errorText = `
        Snapshot is not writable - cannot modify state
        at StateManager.kt:23:5
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_snapshot');
      expect(result?.filePath).toBe('StateManager.kt');
      expect(result?.line).toBe(23);
    });

    it('should parse Snapshot already disposed error', () => {
      const errorText = `
        Snapshot already disposed - cannot access state
        at OldScreen.kt:78
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_snapshot');
    });
  });

  describe('parse() - Edge cases', () => {
    it('should return null for empty string', () => {
      expect(parser.parse('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parser.parse(null as any)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parser.parse(undefined as any)).toBeNull();
    });

    it('should return null for non-Compose error', () => {
      const errorText = `
        NullPointerException at MainActivity.kt:45
      `.trim();

      expect(parser.parse(errorText)).toBeNull();
    });

    it('should handle very long error messages', () => {
      const longError = 'Creating a state object during composition without using remember at Screen.kt:10 ' + 'x'.repeat(100000);
      
      const result = parser.parse(longError);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_remember');
    });

    it('should extract file info from stack trace format', () => {
      const errorText = `
        Creating a state object during composition without using remember
        at com.example.app.HomeScreen.Content(HomeScreen.kt:45)
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe('HomeScreen.kt');
      expect(result?.line).toBe(45);
    });
  });

  describe('isComposeError() - static helper', () => {
    it('should return true for remember-related text', () => {
      expect(JetpackComposeParser.isComposeError('remember { mutableStateOf(0) }')).toBe(true);
    });

    it('should return true for LaunchedEffect text', () => {
      expect(JetpackComposeParser.isComposeError('LaunchedEffect(key) { }')).toBe(true);
    });

    it('should return true for @Composable annotation', () => {
      expect(JetpackComposeParser.isComposeError('@Composable fun MyScreen()')).toBe(true);
    });

    it('should return true for Modifier usage', () => {
      expect(JetpackComposeParser.isComposeError('Modifier.padding(16.dp)')).toBe(true);
    });

    it('should return true for androidx.compose package', () => {
      expect(JetpackComposeParser.isComposeError('androidx.compose.runtime.remember')).toBe(true);
    });

    it('should return false for plain Kotlin error', () => {
      expect(JetpackComposeParser.isComposeError('NullPointerException')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(JetpackComposeParser.isComposeError('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(JetpackComposeParser.isComposeError(null as any)).toBe(false);
    });
  });

  describe('getSupportedErrorTypes() - static helper', () => {
    it('should return all 10 Compose error types', () => {
      const types = JetpackComposeParser.getSupportedErrorTypes();

      expect(types).toHaveLength(10);
      expect(types).toContain('compose_remember');
      expect(types).toContain('compose_derived_state');
      expect(types).toContain('compose_recomposition');
      expect(types).toContain('compose_launched_effect');
      expect(types).toContain('compose_disposable_effect');
      expect(types).toContain('compose_composition_local');
      expect(types).toContain('compose_modifier');
      expect(types).toContain('compose_side_effect');
      expect(types).toContain('compose_state_read');
      expect(types).toContain('compose_snapshot');
    });
  });

  describe('Metadata extraction', () => {
    it('should extract composable name when available', () => {
      const errorText = `
        Excessive recomposition in @Composable UserProfile function
        Recomposing 50 times
        at UserProfile.kt:23
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.metadata?.composable).toBe('UserProfile');
    });

    it('should extract state variable name when available', () => {
      const errorText = `
        State should be created with remember: mutableStateOf(counter)
        at Counter.kt:12
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.metadata?.stateVariable).toBe('counter');
    });
  });
});
