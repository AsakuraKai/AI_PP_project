package com.example.test3.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.* // ERROR: Material 2 deprecated in Compose 1.6
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * HomeScreen - Jetpack Compose UI
 * 
 * ERROR: After upgrading from Compose 1.5 to 1.6, Material 2 imports are deprecated
 * 
 * Problem at line 88:
 * - Using androidx.compose.material.MaterialTheme (Material 2)
 * - Should use androidx.compose.material3.MaterialTheme (Material 3)
 * 
 * Common in Compose 1.5 → 1.6 migrations
 */
@Composable
fun HomeScreen() {
    // Line 88: ERROR - Unresolved reference: MaterialTheme
    // This works in Compose 1.5 but breaks in 1.6
    MaterialTheme {  // COMPILE ERROR HERE!
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colors.background  // Also uses Material 2 colors
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Welcome to Home",
                    style = MaterialTheme.typography.h4  // Material 2 typography
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Button(
                    onClick = { /* Navigate */ },
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = MaterialTheme.colors.primary  // Material 2 colors
                    )
                ) {
                    Text("Get Started")
                }
            }
        }
    }
}

/**
 * FIX: Replace all Material 2 imports with Material 3
 * 
 * Old (Compose 1.5):
 *   import androidx.compose.material.*
 *   MaterialTheme.colors.primary
 *   MaterialTheme.typography.h4
 * 
 * New (Compose 1.6):
 *   import androidx.compose.material3.*
 *   MaterialTheme.colorScheme.primary
 *   MaterialTheme.typography.headlineMedium
 */

@Composable
fun CorrectHomeScreen() {
    // This would work with Material 3:
    // import androidx.compose.material3.MaterialTheme
    // import androidx.compose.material3.Surface
    // import androidx.compose.material3.Button
    // import androidx.compose.material3.Text
    /*
    MaterialTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background  // Material 3
        ) {
            Column(...) {
                Text(
                    text = "Welcome to Home",
                    style = MaterialTheme.typography.headlineMedium  // Material 3
                )
                Button(...) { ... }
            }
        }
    }
    */
}
