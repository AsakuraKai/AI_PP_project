package com.example.multimoduletest

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.core.CoreUtils

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Using core module which is compiled with Kotlin 2.0.0
        val result = CoreUtils.doSomething()
    }
}
