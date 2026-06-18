package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable

@Entity(tableName = "products")
data class Product(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val price: Double,
    val category: String, // "Makanan", "Minuman", "Cemilan", "Lainnya"
    val imageUri: String? = null, // Path ke galeri/kamera atau nama preset illustrasi
    val isAvailable: Boolean = true,
    val spiciness: String = "Sedang", // "Sedikit", "Sedang", "Banyak"
    val portion: String = "Normal"    // "Sedikit", "Normal", "Banyak"
) : Serializable
