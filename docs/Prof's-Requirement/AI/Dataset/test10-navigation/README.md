# Test Case 10: Navigation Component Error

## Description
Tests Jetpack Compose Navigation component with incorrect NavHost setup causing runtime crashes.

## Error Type
- **Category**: Navigation
- **Complexity**: Medium
- **Error**: Runtime crash due to missing NavGraph start destination

## Expected Error
```
IllegalArgumentException: Navigation graph cannot be found in NavHost
    at androidx.navigation.NavHostController.navigate()
```

## Root Cause
NavHost is configured without a proper start destination, causing navigation to fail at runtime.

## Files
- `MainActivity.kt` - Activity with NavHost setup
- `Navigation.kt` - Navigation graph definition with error
- `build.gradle` - Dependencies including Navigation Compose

## How to Reproduce
1. Build the project
2. Run the app
3. Attempt to navigate
4. Observe IllegalArgumentException

## Expected Solution
Define a proper start destination in the NavHost and ensure all routes are properly registered in the navigation graph.
