package com.example.xmltest

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // ERROR: This will crash - CustomButton class name is misspelled in XML
        setContentView(R.layout.activity_main)
    }
}
