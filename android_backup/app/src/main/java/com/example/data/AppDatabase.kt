package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [Product::class, TransactionHistory::class], version = 3, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun transactionDao(): TransactionDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "saji_kasir_database"
                )
                .fallbackToDestructiveMigration()
                .addCallback(object : RoomDatabase.Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Pre-populate database with popular Indonesian food & drink items with spiciness and portion
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Nasi Goreng Spesial', 20000.0, 'Makanan', 'preset_nasigoreng', 1, 'Sedang', 'Normal')")
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Ayam Bakar Rica', 25000.0, 'Makanan', 'preset_ayambakar', 1, 'Banyak', 'Normal')")
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Bakso Sapi Urat', 18000.0, 'Makanan', 'preset_bakso', 1, 'Sedikit', 'Banyak')")
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Mie Goreng Special', 17000.0, 'Makanan', 'preset_miegoreng', 1, 'Sedang', 'Normal')")
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Es Teh Manis', 5000.0, 'Minuman', 'preset_esteh', 1, 'Sedikit', 'Normal')")
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Kopi Susu Dingin', 8000.0, 'Minuman', 'preset_kopi', 1, 'Sedikit', 'Normal')")
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Pisang Goreng Keju', 12000.0, 'Cemilan', 'preset_pisang', 1, 'Sedikit', 'Normal')")
                        db.execSQL("INSERT INTO products (name, price, category, imageUri, isAvailable, spiciness, portion) VALUES ('Kentang Goreng', 10000.0, 'Cemilan', 'preset_kentang', 1, 'Sedikit', 'Normal')")
                    }
                })
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
