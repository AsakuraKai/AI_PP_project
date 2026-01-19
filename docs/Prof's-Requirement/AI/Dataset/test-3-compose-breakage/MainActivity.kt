package com.example.composetest

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                MainScreen()
            }
        }
    }
}

@Composable
fun MainScreen() {
    var text by remember { mutableStateOf("Loading...") }
    
    // ERROR: LaunchedEffect API changed in Compose 1.6
    // Old API (1.5): LaunchedEffect(Unit)
    // New API (1.6): LaunchedEffect(key1 = Unit)
    LaunchedEffect(Unit) {
        delay(1000)
        text = "Loaded!"
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(text = text)
    }
}
