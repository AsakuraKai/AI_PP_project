package com.example.navtest

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onNavigateToProfile = { userId ->
                    // Passing String but profile expects Int
                    navController.navigate("profile/${userId}")
                }
            )
        }
        
        composable(
            route = "profile/{userId}",
            arguments = listOf(
                navArgument("userId") {
                    type = NavType.IntType  // Expects Int
                }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getInt("userId") ?: 0
            ProfileScreen(userId = userId)
        }
    }
}

@Composable
fun HomeScreen(onNavigateToProfile: (String) -> Unit) {
    // User clicks button, passes String ID
    // But should pass Int or convert properly
}

@Composable
fun ProfileScreen(userId: Int) {
    // Expects Int userId
}