package com.example.lateinittest

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider

class MainActivity : AppCompatActivity() {
    // lateinit property not initialized before use
    private lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // ERROR: Using viewModel before initialization
        // This will throw: lateinit property viewModel has not been initialized
        viewModel.loadData()
        
        // Correct initialization should happen BEFORE use:
        // viewModel = ViewModelProvider(this).get(MainViewModel::class.java)
    }
    
    private fun setupUI() {
        // Another place where viewModel is used incorrectly
        viewModel.data.observe(this) { data ->
            // Update UI
        }
    }
}
