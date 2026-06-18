package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelProvider
import com.example.data.AppDatabase
import com.example.data.ProductRepository
import com.example.ui.ProductViewModel
import com.example.ui.ProductViewModelFactory
import com.example.ui.screens.SajiAppNavigation
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Initialize Room persistence safely
        val database = AppDatabase.getDatabase(this)
        val repository = ProductRepository(database.productDao(), database.transactionDao())
        
        // 2. Instantiate our central SajiKasir ViewModel
        val viewModelFactory = ProductViewModelFactory(repository)
        val viewModel = ViewModelProvider(this, viewModelFactory)[ProductViewModel::class.java]
        
        // 3. Enable edge-to-edge drawing
        enableEdgeToEdge()
        
        setContent {
            MyApplicationTheme {
                // A surface container using the background color from our culinary theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SajiAppNavigation(viewModel = viewModel)
                }
            }
        }
    }
}
