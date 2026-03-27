package com.example.testapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

// Test file for RCA Agent - Contains common Android/Kotlin errors

/**
 * Sample Room Database
 */
@Database(entities = [], version = 1)
abstract class AppDatabase : RoomDatabase()

/**
 * Main Activity with intentional errors for testing RCA
 */
class MainActivity : AppCompatActivity() {
    
    // ERROR 1: Uninitialized lateinit property
    private lateinit var database: AppDatabase
    
    private lateinit var apiKey: String
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize UI components
        setupUI()
        
        // This will crash - database not initialized!
        loadData()
    }
    
    private fun setupUI() {
        // UI setup code
        println("Setting up UI")
    }
    
    private fun loadData() {
        // ERROR: Accessing database before initialization
        // This will throw: kotlin.UninitializedPropertyAccessException
        val userDao = database.userDao()
        userDao.getAllUsers()
        
        // ERROR: apiKey also not initialized
        println("API Key: $apiKey")
    }
    
    // Missing database initialization
    // Should have something like:
    // private fun initDatabase() {
    //     database = Room.databaseBuilder(
    //         applicationContext,
    //         AppDatabase::class.java,
    //         "app-database"
    //     ).build()
    // }
}
