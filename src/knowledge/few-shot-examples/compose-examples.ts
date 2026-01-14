/**
 * Compose Deprecation/API Breakage Few-Shot Examples
 * Examples for Jetpack Compose API changes and deprecations
 */

import { FewShotExample } from '../FewShotExampleService';

export const COMPOSE_DEPRECATION_EXAMPLES: FewShotExample[] = [
  {
    id: 'compose_material3_theme',
    errorType: 'COMPOSE_DEPRECATION',
    error: `Unresolved reference: MaterialTheme
Cannot access class 'androidx.compose.material.MaterialTheme'. Check your module classpath for missing or conflicting dependencies
    at com.example.app.ui.HomeScreen.kt:88`,
    diagnosis: {
      problem: 'Using Material2 MaterialTheme import but project migrated to Material3',
      rootCause: 'Import statement references Material2 (androidx.compose.material.MaterialTheme) but should use Material3 (androidx.compose.material3.MaterialTheme) at line 88',
      evidence: 'Unresolved reference and missing dependency suggests Material2 not in classpath, likely replaced by Material3',
      confidence: 0.93
    },
    solution: {
      summary: 'Update imports and dependency from Material2 to Material3',
      specificFix: `File: app/src/main/kotlin/ui/HomeScreen.kt at line 88

Step 1 - Update import statement:
Before:
\`\`\`kotlin
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.material.Text
\`\`\`

After:
\`\`\`kotlin
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
\`\`\`

Step 2 - Update dependency in build.gradle.kts at line 42:
Before:
\`\`\`kotlin
implementation("androidx.compose.material:material:1.5.0")
\`\`\`

After:
\`\`\`kotlin
implementation("androidx.compose.material3:material3:1.3.1")
\`\`\`

Step 3 - Update theme usage if needed:
\`\`\`kotlin
@Composable
fun HomeScreen() {
    MaterialTheme(
        colorScheme = lightColorScheme(), // Material3 uses colorScheme not colors
        typography = Typography,
        shapes = Shapes
    ) {
        Surface {
            Text("Hello Material3") // Line 88 - Now resolves correctly
        }
    }
}
\`\`\``,
      fileIdentification: 'app/src/main/kotlin/ui/HomeScreen.kt:88',
      codeExamples: [
        {
          before: `import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface

@Composable
fun HomeScreen() {
    MaterialTheme {
        Surface { Text("Hello") }
    }
}`,
          after: `import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface

@Composable
fun HomeScreen() {
    MaterialTheme(colorScheme = lightColorScheme()) {
        Surface { Text("Hello") }
    }
}`
        }
      ],
      verificationSteps: [
        'Update all Material2 imports to Material3',
        'Change build.gradle.kts dependency to material3:1.3.1+',
        'Update MaterialTheme to use colorScheme instead of colors',
        'Sync Gradle and rebuild project',
        'Check for other Material2 API changes (Button, TextField, etc.)'
      ]
    }
  },

  {
    id: 'compose_accompanist_deprecated',
    errorType: 'COMPOSE_DEPRECATION',
    error: `Unresolved reference: rememberSystemUiController
    at com.example.app.ui.theme.Theme.kt:35`,
    diagnosis: {
      problem: 'Using deprecated Accompanist System UI Controller which was removed',
      rootCause: 'Accompanist System UI Controller (rememberSystemUiController) is deprecated and removed in Compose 1.6+. Native Compose APIs should be used instead at line 35',
      evidence: 'Unresolved reference to Accompanist API indicates library no longer available or deprecated',
      confidence: 0.90
    },
    solution: {
      summary: 'Replace Accompanist System UI Controller with native Compose EdgeToEdge APIs',
      specificFix: `File: app/src/main/kotlin/ui/theme/Theme.kt at line 35

Accompanist System UI Controller is deprecated. Use native Compose APIs instead.

Before:
\`\`\`kotlin
import com.google.accompanist.systemuicontroller.rememberSystemUiController

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    val systemUiController = rememberSystemUiController() // Line 35 - DEPRECATED
    val useDarkIcons = !isSystemInDarkTheme()
    
    SideEffect {
        systemUiController.setSystemBarsColor(
            color = Color.Transparent,
            darkIcons = useDarkIcons
        )
    }
    
    MaterialTheme(content = content)
}
\`\`\`

After (Compose 1.6+ with native APIs):
\`\`\`kotlin
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    val darkTheme = isSystemInDarkTheme()
    
    SideEffect {
        val window = (view.context as ComponentActivity).window
        window.statusBarColor = Color.Transparent.toArgb()
        window.navigationBarColor = Color.Transparent.toArgb()
        WindowCompat.getInsetsController(window, view).apply {
            isAppearanceLightStatusBars = !darkTheme // Line 35 - Native API
            isAppearanceLightNavigationBars = !darkTheme
        }
    }
    
    MaterialTheme(content = content)
}
\`\`\`

Alternative (simpler, in MainActivity.onCreate):
\`\`\`kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge() // Single call handles everything
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme {
                // Your content
            }
        }
    }
}
\`\`\``,
      fileIdentification: 'app/src/main/kotlin/ui/theme/Theme.kt:35',
      codeExamples: [
        {
          before: `val systemUiController = rememberSystemUiController()
systemUiController.setSystemBarsColor(
    color = Color.Transparent,
    darkIcons = !isSystemInDarkTheme()
)`,
          after: `// In MainActivity.onCreate():
enableEdgeToEdge()

// Or use WindowCompat for fine control:
val window = (view.context as ComponentActivity).window
WindowCompat.getInsetsController(window, view).apply {
    isAppearanceLightStatusBars = !darkTheme
}`
        }
      ],
      verificationSteps: [
        'Remove Accompanist System UI Controller dependency from build.gradle',
        'Replace with native enableEdgeToEdge() in Activity.onCreate()',
        'Or use WindowCompat.getInsetsController() for custom control',
        'Sync Gradle and rebuild',
        'Test status bar and navigation bar appearance in light/dark themes'
      ]
    }
  },

  {
    id: 'compose_text_field_outlined',
    errorType: 'COMPOSE_DEPRECATION',
    error: `'OutlinedTextField(value: String, onValueChange: (String) -> Unit, modifier: Modifier, ...)' is deprecated. Use TextField with TextFieldDefaults.OutlinedTextFieldDecorationBox
    at com.example.app.ui.LoginScreen.kt:45`,
    diagnosis: {
      problem: 'Using deprecated OutlinedTextField constructor signature',
      rootCause: 'Material3 deprecated old OutlinedTextField API. The signature at line 45 is deprecated in Compose 1.6+ and should use new TextField with decoration box',
      evidence: 'Deprecation warning explicitly states OutlinedTextField signature is deprecated',
      confidence: 0.95
    },
    solution: {
      summary: 'Update to new Material3 TextField API or continue using with @Suppress',
      specificFix: `File: app/src/main/kotlin/ui/LoginScreen.kt at line 45

Option 1 - Suppress warning (if not ready to migrate):
\`\`\`kotlin
@Suppress("DEPRECATION")
OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Email") }
) // Line 45 - Suppresses warning, continues working
\`\`\`

Option 2 - Update to new Material3 API (recommended):
\`\`\`kotlin
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text

// The new API signature is actually the same in Material3
// Just ensure you're using material3, not material:
OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Email") },
    modifier = Modifier.fillMaxWidth()
) // Line 45 - Works with Material3
\`\`\`

Ensure dependency is correct in build.gradle.kts:
\`\`\`kotlin
implementation("androidx.compose.material3:material3:1.3.1") // Use Material3
// NOT: implementation("androidx.compose.material:material:1.5.0") // Old Material2
\`\`\``,
      fileIdentification: 'app/src/main/kotlin/ui/LoginScreen.kt:45',
      codeExamples: [
        {
          before: `// Using Material2 OutlinedTextField (deprecated)
import androidx.compose.material.OutlinedTextField

OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Email") }
)`,
          after: `// Using Material3 OutlinedTextField (current)
import androidx.compose.material3.OutlinedTextField

OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Email") }
)`
        }
      ],
      verificationSteps: [
        'Verify using material3 dependency, not material',
        'Update imports from androidx.compose.material to material3',
        'Check for other deprecated TextField variants (TextField, BasicTextField)',
        'Sync Gradle and rebuild',
        'Test text field behavior and styling'
      ]
    }
  }
];
