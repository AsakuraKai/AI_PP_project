package com.example.test2

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModelProvider

class MainActivity : ComponentActivity() {
    
    // ERROR: lateinit property accessed before initialization
    private lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Problem: Accessing viewModel before it's initialized
        // This will crash with "lateinit property viewModel has not been initialized"
        setupUI()  // Line 17: Calls viewModel.loadData()
        
        // Correct initialization should happen BEFORE setupUI()
        viewModel = ViewModelProvider(this)[MainViewModel::class.java]
        
        setContent {
            MainScreen(viewModel = viewModel)
        }
    }
    
    private fun setupUI() {
        // Line 27: Accessing viewModel before initialization
        viewModel.loadData()  // CRASH HERE!
    }
    
    override fun onResume() {
        super.onResume()
        // Another place accessing viewModel
        viewModel.refreshData()
    }
}

// ViewModel class
class MainViewModel {
    fun loadData() {
        println("Loading data...")
    }
    
    fun refreshData() {
        println("Refreshing data...")
    }
}

// Compose UI
@Composable
fun MainScreen(viewModel: MainViewModel) {
    Text("Main Screen")
}
