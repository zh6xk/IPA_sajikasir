package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import java.io.Serializable

@Entity(tableName = "transactions")
data class TransactionHistory(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val receiptText: String,
    val totalAmount: Double,
    val timestamp: Long,
    val targetWhatsApp: String
) : Serializable

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
    fun getAllTransactions(): Flow<List<TransactionHistory>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionHistory)

    @Delete
    suspend fun deleteTransaction(transaction: TransactionHistory)

    @Query("DELETE FROM transactions")
    suspend fun clearAllTransactions()
}
