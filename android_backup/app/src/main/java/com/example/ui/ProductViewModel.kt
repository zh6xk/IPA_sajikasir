package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.Product
import com.example.data.ProductRepository
import com.example.data.TransactionHistory
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ProductViewModel(private val repository: ProductRepository) : ViewModel() {

    // All available products from database
    val products: StateFlow<List<Product>> = repository.allProducts
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // All transaction history from database
    val transactions: StateFlow<List<TransactionHistory>> = repository.allTransactions
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Cart representation: Map of ProductId to Quantity
    private val _cart = MutableStateFlow<Map<Int, Int>>(emptyMap())
    val cart: StateFlow<Map<Int, Int>> = _cart

    // Store Name details (Persistable in-memory, defaults to "Warung SajiKasir")
    private val _storeName = MutableStateFlow("Warung SajiKasir")
    val storeName: StateFlow<String> = _storeName

    // Recipient WhatsApp number state
    private val _targetWhatsApp = MutableStateFlow("")
    val targetWhatsApp: StateFlow<String> = _targetWhatsApp

    fun setStoreName(name: String) {
        if (name.isNotBlank()) {
            _storeName.value = name
        }
    }

    fun setTargetWhatsApp(number: String) {
        _targetWhatsApp.value = number
    }

    // Cart Management
    fun addToCart(product: Product) {
        val currentQty = _cart.value[product.id] ?: 0
        val updatedMap = _cart.value.toMutableMap()
        updatedMap[product.id] = currentQty + 1
        _cart.value = updatedMap
    }

    fun decreaseInCart(product: Product) {
        val currentQty = _cart.value[product.id] ?: return
        val updatedMap = _cart.value.toMutableMap()
        if (currentQty <= 1) {
            updatedMap.remove(product.id)
        } else {
            updatedMap[product.id] = currentQty - 1
        }
        _cart.value = updatedMap
    }

    fun updateQuantity(product: Product, qty: Int) {
        val updatedMap = _cart.value.toMutableMap()
        if (qty <= 0) {
            updatedMap.remove(product.id)
        } else {
            updatedMap[product.id] = qty
        }
        _cart.value = updatedMap
    }

    fun removeFromCart(product: Product) {
        val updatedMap = _cart.value.toMutableMap()
        updatedMap.remove(product.id)
        _cart.value = updatedMap
    }

    fun clearCart() {
        _cart.value = emptyMap()
    }

    // Database CRUD Operations (Seeded automatically, editable by user)
    fun addProduct(name: String, price: Double, category: String, imageUri: String?, spiciness: String = "Sedang", portion: String = "Normal") {
        viewModelScope.launch {
            repository.insert(Product(name = name, price = price, category = category, imageUri = imageUri, spiciness = spiciness, portion = portion))
        }
    }

    fun updateProduct(product: Product) {
        viewModelScope.launch {
            repository.update(product)
        }
    }

    fun deleteProduct(product: Product) {
        viewModelScope.launch {
            // Also remove from cart if present
            if (_cart.value.containsKey(product.id)) {
                val updatedMap = _cart.value.toMutableMap()
                updatedMap.remove(product.id)
                _cart.value = updatedMap
            }
            repository.delete(product)
        }
    }

    // Currency Formatter
    fun formatRupiah(amount: Double): String {
        val formatted = String.format(Locale.GERMAN, "%,d", amount.toLong())
        return "Rp $formatted"
    }

    // WhatsApp Receipt Generator
    fun generateWhatsAppText(cartItems: List<Pair<Product, Int>>, itemNotes: Map<Int, String> = emptyMap()): String {
        val dateFormat = java.text.SimpleDateFormat("dd MMM yyyy - HH:mm 'WIB'", java.util.Locale("id", "ID")).apply {
            timeZone = java.util.TimeZone.getTimeZone("Asia/Jakarta")
        }
        val currentDate = dateFormat.format(java.util.Date())
        
        val header = """
        *STRUK PESANAN* 🧾
        *${_storeName.value.uppercase()}*
        ========================
        Tanggal : $currentDate
        """.trimIndent()

        var itemsText = ""
        var totalAmount = 0.0

        for (item in cartItems) {
            val product = item.first
            val qty = item.second
            val subtotal = product.price * qty
            totalAmount += subtotal
            
            itemsText += "*${product.name}*\n"
            val notes = itemNotes[product.id]
            if (!notes.isNullOrBlank()) {
                itemsText += " _( $notes )_\n"
            }
            itemsText += "$qty x ${formatRupiah(product.price)} = *${formatRupiah(subtotal)}*\n"
        }

        val footer = """
        ------------------------
        *TOTAL       : ${formatRupiah(totalAmount)}*
        ========================
        _Terima kasih telah memesan!_ 🙏
        """.trimIndent()

        return "$header\n\n$itemsText\n$footer"
    }

    fun addTransaction(receiptText: String, totalAmount: Double, targetWhatsApp: String) {
        viewModelScope.launch {
            val transaction = TransactionHistory(
                receiptText = receiptText,
                totalAmount = totalAmount,
                timestamp = System.currentTimeMillis(),
                targetWhatsApp = targetWhatsApp
            )
            repository.insertTransaction(transaction)
        }
    }

    fun deleteTransaction(transaction: TransactionHistory) {
        viewModelScope.launch {
            repository.deleteTransaction(transaction)
        }
    }

    fun clearAllTransactions() {
        viewModelScope.launch {
            repository.clearAllTransactions()
        }
    }
}

class ProductViewModelFactory(private val repository: ProductRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ProductViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ProductViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
