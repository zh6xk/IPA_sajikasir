package com.example.data

import kotlinx.coroutines.flow.Flow

class ProductRepository(
    private val productDao: ProductDao,
    private val transactionDao: TransactionDao
) {

    val allProducts: Flow<List<Product>> = productDao.getAllProducts()

    suspend fun insert(product: Product) {
        productDao.insertProduct(product)
    }

    suspend fun update(product: Product) {
        productDao.updateProduct(product)
    }

    suspend fun delete(product: Product) {
        productDao.deleteProduct(product)
    }

    suspend fun getProductById(id: Int): Product? {
        return productDao.getProductById(id)
    }

    // Transactions API
    val allTransactions: Flow<List<TransactionHistory>> = transactionDao.getAllTransactions()

    suspend fun insertTransaction(transaction: TransactionHistory) {
        transactionDao.insertTransaction(transaction)
    }

    suspend fun deleteTransaction(transaction: TransactionHistory) {
        transactionDao.deleteTransaction(transaction)
    }

    suspend fun clearAllTransactions() {
        transactionDao.clearAllTransactions()
    }
}
