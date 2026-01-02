"use strict";
/**
 * Navigation/Routing Few-Shot Examples (Chunk 9 - Priority 3)
 * 5 examples for Jetpack Navigation errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAVIGATION_EXAMPLES = void 0;
exports.NAVIGATION_EXAMPLES = [
    {
        id: 'navigation_argument_type_mismatch',
        errorType: 'NAVIGATION_ROUTING',
        error: `java.lang.IllegalArgumentException: Wrong argument type for 'userId' in argument bundle. Expected Int, found String.
    at androidx.navigation.NavBackStackEntry.getArguments(NavBackStackEntry.kt:123)`,
        diagnosis: {
            problem: 'Navigation argument type mismatch between route definition and usage',
            rootCause: 'NavHost defines argument as IntType but receiving String, or vice versa',
            evidence: 'IllegalArgumentException states expected type vs found type',
            confidence: 0.95
        },
        solution: {
            summary: 'Fix argument type in NavHost definition to match actual usage',
            specificFix: `File: Navigation.kt (or NavGraph.kt)

BEFORE (line 25):
composable("detail/{userId}") { backStackEntry ->
    val userId = backStackEntry.arguments?.getString("userId") ?: ""
    DetailScreen(userId)
}

AFTER:
composable(
    route = "detail/{userId}",
    arguments = listOf(navArgument("userId") { type = NavType.IntType })
) { backStackEntry ->
    val userId = backStackEntry.arguments?.getInt("userId") ?: 0
    DetailScreen(userId)
}

BEFORE (line 50 - calling code):
navController.navigate("detail/\${user.id}")  // id is Int

AFTER:
navController.navigate("detail/\${user.id}")  // No change needed, Int toString() works`,
            fileIdentification: 'Navigation.kt',
            codeExamples: [
                {
                    before: 'val userId = backStackEntry.arguments?.getString("userId")',
                    after: 'val userId = backStackEntry.arguments?.getInt("userId") ?: 0'
                }
            ],
            verificationSteps: [
                'Fix NavHost argument type definition',
                'Update argument extraction code',
                'Run app and navigate',
                'Verify no type error'
            ]
        }
    },
    {
        id: 'navigation_missing_required_argument',
        errorType: 'NAVIGATION_ROUTING',
        error: `java.lang.IllegalArgumentException: Required argument 'productId' is missing
    at androidx.navigation.compose.NavHostKt.NavHost(NavHost.kt:156)`,
        diagnosis: {
            problem: 'Navigation call missing required argument defined in route',
            rootCause: 'Route expects {productId} but navigate() call does not provide it',
            evidence: 'IllegalArgumentException for missing required argument',
            confidence: 0.95
        },
        solution: {
            summary: 'Provide required argument in navigate() call or make argument optional',
            specificFix: `Option 1: Provide the argument

BEFORE (line 78):
navController.navigate("product")  // Missing productId

AFTER:
navController.navigate("product/\${product.id}")

---

Option 2: Make argument optional if not always needed

BEFORE (NavHost definition):
composable("product/{productId}") { ... }

AFTER:
composable(
    route = "product?productId={productId}",  // ? makes it optional
    arguments = listOf(
        navArgument("productId") {
            type = NavType.IntType
            defaultValue = -1  // Default for optional
        }
    )
) { backStackEntry ->
    val productId = backStackEntry.arguments?.getInt("productId") ?: -1
    ProductScreen(productId)
}

Then call:
navController.navigate("product")  // OK now
navController.navigate("product?productId=\${id}")  // Also OK`,
            fileIdentification: 'Navigation.kt',
            codeExamples: [],
            verificationSteps: [
                'Fix navigate() call with argument',
                'Or make argument optional with default',
                'Test both navigation paths',
                'Verify no missing argument error'
            ]
        }
    },
    {
        id: 'navigation_nullable_argument_crash',
        errorType: 'NAVIGATION_ROUTING',
        error: `java.lang.NullPointerException: Attempt to invoke virtual method 'int java.lang.Integer.intValue()' on a null object reference
    at com.example.ui.DetailScreenKt.DetailScreen(DetailScreen.kt:42)`,
        diagnosis: {
            problem: 'Nullable navigation argument not handled properly in destination',
            rootCause: 'Argument can be null but code assumes non-null, or argument not marked nullable in definition',
            evidence: 'NPE when accessing argument value, suggests null was received',
            confidence: 0.9
        },
        solution: {
            summary: 'Mark argument as nullable and handle null case properly',
            specificFix: `File: Navigation.kt

BEFORE:
composable(
    route = "detail/{itemId}",
    arguments = listOf(navArgument("itemId") { type = NavType.IntType })
) { backStackEntry ->
    val itemId = backStackEntry.arguments?.getInt("itemId")!!  // Crash if null
    DetailScreen(itemId)
}

AFTER:
composable(
    route = "detail?itemId={itemId}",  // Optional argument
    arguments = listOf(
        navArgument("itemId") {
            type = NavType.IntType
            nullable = true  // Mark as nullable
            defaultValue = null
        }
    )
) { backStackEntry ->
    val itemId = backStackEntry.arguments?.getInt("itemId")?.takeIf { it != -1 }
    if (itemId != null) {
        DetailScreen(itemId)
    } else {
        ErrorScreen("Invalid item ID")
    }
}`,
            fileIdentification: 'Navigation.kt',
            codeExamples: [],
            verificationSteps: [
                'Mark argument as nullable',
                'Add null check in destination',
                'Test with and without argument',
                'Verify no NPE'
            ]
        }
    },
    {
        id: 'navigation_destination_not_found',
        errorType: 'NAVIGATION_ROUTING',
        error: `java.lang.IllegalArgumentException: navigation destination settings is unknown to this NavController
    at androidx.navigation.NavController.navigate(NavController.java:1625)`,
        diagnosis: {
            problem: 'Navigation trying to navigate to undefined route',
            rootCause: 'Route name in navigate() call does not match any composable() route in NavHost',
            evidence: 'IllegalArgumentException stating destination unknown to NavController',
            confidence: 0.95
        },
        solution: {
            summary: 'Fix route name typo or add missing destination to NavHost',
            specificFix: `Check route names match exactly (case-sensitive!)

WRONG:
navController.navigate("Settings")  // Capital S

NavHost { 
    composable("settings") { ... }  // Lowercase s
}

CORRECT:
navController.navigate("settings")  // Match exactly

---

Or add missing destination:

NavHost {
    composable("home") { HomeScreen() }
    composable("profile") { ProfileScreen() }
    // ADD THIS:
    composable("settings") { SettingsScreen() }
}

---

TIP: Use sealed class for type-safe routes:

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Profile : Screen("profile")
    object Settings : Screen("settings")
}

Then use:
navController.navigate(Screen.Settings.route)  // Type-safe!`,
            fileIdentification: 'Navigation.kt',
            codeExamples: [],
            verificationSteps: [
                'Check route names match exactly',
                'Add missing destination if needed',
                'Consider using sealed class for type safety',
                'Test navigation works'
            ]
        }
    },
    {
        id: 'navigation_deeplink_argument_parsing',
        errorType: 'NAVIGATION_ROUTING',
        error: `java.lang.IllegalStateException: Deep link androidx.navigation.ActivityNavigator$Destination@abc123 does not have a matching argument for required argument userId
    at androidx.navigation.NavController.onGraphCreated(NavController.java:752)`,
        diagnosis: {
            problem: 'Deep link route pattern does not extract argument correctly',
            rootCause: 'Deep link URI pattern mismatch with argument definition, or argument not captured',
            evidence: 'IllegalStateException for deep link missing required argument',
            confidence: 0.9
        },
        solution: {
            summary: 'Fix deep link URI pattern to capture argument correctly',
            specificFix: `File: Navigation.kt

BEFORE:
composable(
    route = "user/{userId}",
    arguments = listOf(navArgument("userId") { type = NavType.IntType }),
    deepLinks = listOf(
        navDeepLink { uriPattern = "myapp://user" }  // Missing {userId}!
    )
) { ... }

AFTER:
composable(
    route = "user/{userId}",
    arguments = listOf(navArgument("userId") { type = NavType.IntType }),
    deepLinks = listOf(
        navDeepLink { 
            uriPattern = "myapp://user/{userId}"  // Must include {userId}
        }
    )
) { backStackEntry ->
    val userId = backStackEntry.arguments?.getInt("userId") ?: 0
    UserScreen(userId)
}

AndroidManifest.xml must also declare intent filter:
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="myapp" android:host="user" />
    </intent-filter>
</activity>`,
            fileIdentification: 'Navigation.kt, AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Fix deep link URI pattern',
                'Update AndroidManifest.xml',
                'Test deep link: adb shell am start -W -a android.intent.action.VIEW -d "myapp://user/123"',
                'Verify argument passed correctly'
            ]
        }
    }
];
//# sourceMappingURL=navigation-examples.js.map