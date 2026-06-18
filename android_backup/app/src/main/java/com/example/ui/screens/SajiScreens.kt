package com.example.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import java.text.SimpleDateFormat
import java.util.Locale
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.example.data.Product
import com.example.ui.ProductViewModel
import java.net.URLEncoder

// Screen Enums for our shared state navigation
enum class AppScreen {
    Splash,
    Dashboard,
    OrderCatalog,
    ManageMenu,
    AddEditProduct,
    CheckoutConfirm,
    TransactionHistory,
    ProfileSettings
}

// Global Preset Emojis & Gradients mapping for Food Cards
fun getFoodPresetDetails(presetName: String?): Pair<String, List<Color>> {
    return when (presetName) {
        "preset_nasigoreng" -> Pair("🍛", listOf(Color(0xFFFF7043), Color(0xFFF4511E)))
        "preset_ayambakar" -> Pair("🍗", listOf(Color(0xFFEF5350), Color(0xFFD84315)))
        "preset_bakso" -> Pair("🍜", listOf(Color(0xFFFFB74D), Color(0xFFE65100)))
        "preset_miegoreng" -> Pair("🍝", listOf(Color(0xFFFFCA28), Color(0xFFF57C00)))
        "preset_esteh" -> Pair("🥤", listOf(Color(0xFF81C784), Color(0xFF2E7D32)))
        "preset_kopi" -> Pair("☕", listOf(Color(0xFF8D6E63), Color(0xFF4E342E)))
        "preset_pisang" -> Pair("🍌", listOf(Color(0xFFFFEE58), Color(0xFFFBC02D)))
        "preset_kentang" -> Pair("🍟", listOf(Color(0xFFFF8A80), Color(0xFFFF1744)))
        else -> Pair("🍲", listOf(Color(0xFFFFAB91), Color(0xFFFF5722)))
    }
}

// App presets mapping specifically for the Add/Edit dropdown
val PRESET_ITEMS = listOf(
    Pair("preset_nasigoreng", "Nasi Goreng (🍛)"),
    Pair("preset_ayambakar", "Ayam Bakar (🍗)"),
    Pair("preset_bakso", "Bakso Mangkuk (🍜)"),
    Pair("preset_miegoreng", "Mie Goreng (🍝)"),
    Pair("preset_esteh", "Minuman Es (🥤)"),
    Pair("preset_kopi", "Kopi Hangat (☕)"),
    Pair("preset_pisang", "Pisang Goreng (🍌)"),
    Pair("preset_kentang", "Snack Kentang (🍟)")
)

@Composable
fun FoodImageHolder(
    imageUri: String?,
    category: String,
    modifier: Modifier = Modifier
) {
    if (imageUri != null && (imageUri.startsWith("content://") || imageUri.startsWith("file://"))) {
        // Image from gallery or camera
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            val painter = rememberAsyncImagePainter(model = Uri.parse(imageUri))
            androidx.compose.foundation.Image(
                painter = painter,
                contentDescription = "Foto Produk",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }
    } else {
        // Draw elegant preset illustration using emojis and gradients
        val (emoji, gradientColors) = getFoodPresetDetails(imageUri)
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.radialGradient(gradientColors)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = emoji,
                fontSize = 32.sp,
                textAlign = TextAlign.Center
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SajiAppNavigation(
    viewModel: ProductViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("saji_kasir_prefs", Context.MODE_PRIVATE) }
    val isFirstTime = remember { sharedPrefs.getBoolean("is_first_time", true) }

    var userName by remember { mutableStateOf(sharedPrefs.getString("user_name", "") ?: "") }
    var userLocation by remember { mutableStateOf(sharedPrefs.getString("user_location", "Jakarta Selatan") ?: "Jakarta Selatan") }
    var userPhotoUri by remember { mutableStateOf(sharedPrefs.getString("user_photo_uri", null)) }

    // Init storeName from sharedPrefs
    androidx.compose.runtime.LaunchedEffect(Unit) {
        val stName = sharedPrefs.getString("store_name", "Warung SajiKasir") ?: "Warung SajiKasir"
        viewModel.setStoreName(stName)
    }

    // Light robust stack-based state navigation to avoid navigation string leaks
    var currentScreen by remember { mutableStateOf(if (isFirstTime) AppScreen.Splash else AppScreen.Dashboard) }
    var productToEdit by remember { mutableStateOf<Product?>(null) }

    // Screen Backstack helper
    val screenHistory = remember { mutableStateListOf<AppScreen>() }

    fun navigateTo(screen: AppScreen) {
        screenHistory.add(currentScreen)
        currentScreen = screen
    }

    fun navigateBack() {
        if (screenHistory.isNotEmpty()) {
            currentScreen = screenHistory.removeAt(screenHistory.lastIndex)
        } else {
            currentScreen = AppScreen.Dashboard
        }
    }

    Scaffold(
        modifier = modifier
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (currentScreen) {
                AppScreen.Splash -> {
                    SajiSplashScreen(
                        viewModel = viewModel,
                        onGetStarted = { name, location, storeName ->
                            sharedPrefs.edit()
                                .putString("user_name", name)
                                .putString("user_location", location)
                                .putString("store_name", storeName)
                                .putBoolean("is_first_time", false)
                                .apply()
                            userName = name
                            userLocation = location
                            viewModel.setStoreName(storeName)
                            currentScreen = AppScreen.Dashboard
                        }
                    )
                }
                AppScreen.Dashboard -> {
                    DashboardScreen(
                        viewModel = viewModel,
                        userName = userName,
                        userLocation = userLocation,
                        userPhotoUri = userPhotoUri,
                        onNavigateToOrder = { navigateTo(AppScreen.OrderCatalog) },
                        onNavigateToMenu = { navigateTo(AppScreen.ManageMenu) },
                        onNavigateToHistory = { navigateTo(AppScreen.TransactionHistory) },
                        onNavigateToProfile = { navigateTo(AppScreen.ProfileSettings) }
                    )
                }
                AppScreen.OrderCatalog -> {
                    OrderCatalogScreen(
                        viewModel = viewModel,
                        onBackPressed = { navigateBack() },
                        onCheckoutPressed = { navigateTo(AppScreen.CheckoutConfirm) }
                    )
                }
                AppScreen.ManageMenu -> {
                    ManageMenuScreen(
                        viewModel = viewModel,
                        onBackPressed = { navigateBack() },
                        onAddProductPressed = {
                            productToEdit = null
                            navigateTo(AppScreen.AddEditProduct)
                        },
                        onEditProductPressed = { product ->
                            productToEdit = product
                            navigateTo(AppScreen.AddEditProduct)
                        }
                    )
                }
                AppScreen.AddEditProduct -> {
                    AddEditProductScreen(
                        viewModel = viewModel,
                        product = productToEdit,
                        onBackPressed = { navigateBack() },
                        onSaved = { navigateBack() }
                    )
                }
                AppScreen.CheckoutConfirm -> {
                    CheckoutScreen(
                        viewModel = viewModel,
                        onBackPressed = { navigateBack() },
                        onSuccess = {
                            // Back to home and clear cart
                            viewModel.clearCart()
                            screenHistory.clear()
                            currentScreen = AppScreen.Dashboard
                        }
                    )
                }
                AppScreen.TransactionHistory -> {
                    TransactionHistoryScreen(
                        viewModel = viewModel,
                        onBackPressed = { navigateBack() }
                    )
                }
                AppScreen.ProfileSettings -> {
                    ProfileSettingsScreen(
                        initialUserName = userName,
                        initialUserLocation = userLocation,
                        initialStoreName = viewModel.storeName.collectAsState().value,
                        initialPhotoUri = userPhotoUri,
                        onSaveProfile = { newName, newLocation, newStoreName, newPhotoUri ->
                            sharedPrefs.edit()
                                .putString("user_name", newName)
                                .putString("user_location", newLocation)
                                .putString("store_name", newStoreName)
                                .putString("user_photo_uri", newPhotoUri)
                                .apply()
                            userName = newName
                            userLocation = newLocation
                            userPhotoUri = newPhotoUri
                            viewModel.setStoreName(newStoreName)
                            navigateBack()
                        },
                        onBackPressed = { navigateBack() }
                    )
                }
            }
        }
    }
}

// ----------------------------------------------------
// SCREEN 1: DASHBOARD SCREEN
// ----------------------------------------------------
@Composable
fun SimpleProductGridItem(
    product: Product,
    formatRupiah: (Double) -> String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column {
            FoodImageHolder(
                imageUri = product.imageUri,
                category = product.category,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp)
            )
            Column(
                modifier = Modifier.padding(10.dp)
            ) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        lineHeight = 16.sp
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = product.category,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "🌶️ ${product.spiciness}",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                    )
                    Text(
                        text = "•",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "🍱 ${product.portion}",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = formatRupiah(product.price),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.primary
                    )
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: ProductViewModel,
    userName: String,
    userLocation: String,
    userPhotoUri: String?,
    onNavigateToOrder: () -> Unit,
    onNavigateToMenu: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToProfile: () -> Unit
) {
    val storeName by viewModel.storeName.collectAsState()
    val products by viewModel.products.collectAsState()
    val transactions by viewModel.transactions.collectAsState()

    val configuration = LocalContext.current.resources.configuration
    val screenWidthDp = configuration.screenWidthDp
    val columns = when {
        screenWidthDp >= 768 -> 4
        screenWidthDp >= 480 -> 3
        else -> 2
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            // --- 1. SLEEK INTERFACE APP BAR GREETING ---
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp, top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = "Lokasi",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = if (userLocation.isNotBlank()) userLocation.uppercase() else "LOKASI TOKO",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            ),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    val firstName = userName.split(" ").firstOrNull() ?: ""
                    Text(
                        text = if (firstName.isNotBlank()) "Halo, Kak $firstName!" else "Halo, Rekan Kasir!",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = (-0.5).sp
                        ),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
                
                // Round profile indicator
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondary)
                        .border(2.dp, Color.White, CircleShape)
                        .clickable { onNavigateToProfile() },
                    contentAlignment = Alignment.Center
                ) {
                    if (!userPhotoUri.isNullOrEmpty()) {
                        androidx.compose.foundation.Image(
                            painter = rememberAsyncImagePainter(userPhotoUri),
                            contentDescription = "Profile Photo",
                            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Text(
                            text = if (userName.isNotEmpty()) userName.take(1).uppercase() else "W",
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondary,
                            fontSize = 17.sp
                        )
                    }
                }
            }



            // --- 3. STORE IDENTITY INFO ---
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = storeName,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Total: ${products.size} Menu Terdaftar",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Store,
                            contentDescription = "Toko",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            // --- 3.5 RIWAYAT BAYAR CARD ---
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
                    .clickable { onNavigateToHistory() }
                    .testTag("riwayat_bayar_button"),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.12f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.History,
                                contentDescription = "Riwayat Bayar",
                                tint = MaterialTheme.colorScheme.onSecondaryContainer,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "Riwayat Bayar",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${transactions.size} Transaksi Terbayar",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f)
                            )
                        }
                    }
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.08f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowForward,
                            contentDescription = "Buka Riwayat",
                            tint = MaterialTheme.colorScheme.onSecondaryContainer,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            Text(
                text = "Katalog Menu",
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                ),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // --- 4. PRODUCTS LIST / GRID ---
            if (products.isEmpty()) {
                // Empty State
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp, horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Storefront,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Katalog Menu Kosong",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Gunakan tombol bulat di kanan bawah untuk mulai menambah menu baru.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                // Main transaction is started by clicking a menu card
                // Chunk products into rows with maximum of 4 columns
                val productRows = products.chunked(columns)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("menu_order_service"), // Keep tag so automated tests know this holds the transaction menu trigger
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    productRows.forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            rowItems.forEach { product ->
                                SimpleProductGridItem(
                                    product = product,
                                    formatRupiah = { viewModel.formatRupiah(it) },
                                    onClick = onNavigateToOrder,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            // Fill remaining slots in row if it has less items than columns
                            if (rowItems.size < columns) {
                                repeat(columns - rowItems.size) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(80.dp)) // Extra spacing so content is not blocked by FAB
        }

        // --- 5. FLOATING ATUR KATALOG MENU BULAT DI KANAN BAWAH ---
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
                .navigationBarsPadding()
                .size(54.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary)
                .clickable { onNavigateToMenu() }
                .testTag("menu_catalog_service") // MUST KEEP!
                .shadow(6.dp, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.RestaurantMenu,
                contentDescription = "Atur Katalog Menu",
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

// ----------------------------------------------------
// SCREEN 2: ORDER CATALOG SCREEN (BUYER CHANNELS)
// ----------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderCatalogScreen(
    viewModel: ProductViewModel,
    onBackPressed: () -> Unit,
    onCheckoutPressed: () -> Unit
) {
    val products by viewModel.products.collectAsState()
    val cart by viewModel.cart.collectAsState()
    val storeName by viewModel.storeName.collectAsState()

    var selectedCategory by remember { mutableStateOf("Semua") }
    val categories = listOf("Semua", "Makanan", "Minuman", "Cemilan", "Lainnya")

    val filteredProducts = remember(products, selectedCategory) {
        if (selectedCategory == "Semua") {
            products
        } else {
            products.filter { it.category == selectedCategory }
        }
    }

    // Map cart items details for summing and showing bottom bar
    val activeCartItems = remember(cart, products) {
        cart.mapNotNull { entry ->
            val product = products.find { it.id == entry.key }
            if (product != null) Pair(product, entry.value) else null
        }
    }

    val totalCartCount = remember(cart) { cart.values.sum() }
    val totalCartPrice = remember(activeCartItems) {
        activeCartItems.sumOf { it.first.price * it.second }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Layanan Order",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = storeName,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali ke Beranda"
                        )
                    }
                },
                actions = {
                    if (cart.isNotEmpty()) {
                        TextButton(
                            onClick = { viewModel.clearCart() },
                            colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                        ) {
                            Text("Kosongkan")
                        }
                    }
                }
            )
        },
        bottomBar = {
            // Elegant slipping-up sliding summary bar if basket has items securely
            AnimatedVisibility(
                visible = cart.isNotEmpty(),
                enter = fadeIn() + slideInVertically(initialOffsetY = { it }),
                exit = fadeOut() + slideOutVertically(targetOffsetY = { it })
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.surfaceColorAtElevation(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(12.dp, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                        .navigationBarsPadding()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "$totalCartCount Item Terpilih",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = viewModel.formatRupiah(totalCartPrice),
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Button(
                            onClick = onCheckoutPressed,
                            modifier = Modifier
                                .testTag("checkout_button")
                                .height(50.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Payment,
                                contentDescription = "Konfirmasi Pemesanan"
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Proses Struk",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Horizontal scrolling Categories selector
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp, horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { cat ->
                    val isSelected = selectedCategory == cat
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedCategory = cat },
                        label = { Text(text = cat) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                        )
                    )
                }
            }

            if (filteredProducts.isEmpty()) {
                // Empty state helper
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Inbox,
                            contentDescription = "Kosong",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Tidak Ada Produk",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Belum ada produk terdaftar untuk kategori $selectedCategory, atau silakan buat produk di menu pengaturan katalog.",
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        )
                    }
                }
            } else {
                // Two column grid showing items with gorgeous layouts
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    contentPadding = PaddingValues(bottom = 90.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredProducts) { product ->
                        val qty = cart[product.id] ?: 0
                        OrderProductCard(
                            product = product,
                            quantity = qty,
                            formatRupiah = { viewModel.formatRupiah(it) },
                            onAdd = { viewModel.addToCart(product) },
                            onDecrease = { viewModel.decreaseInCart(product) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun OrderProductCard(
    product: Product,
    quantity: Int,
    formatRupiah: (Double) -> String,
    onAdd: () -> Unit,
    onDecrease: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(1.dp, RoundedCornerShape(24.dp)),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column {
            FoodImageHolder(
                imageUri = product.imageUri,
                category = product.category,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
            )

            Column(
                modifier = Modifier.padding(14.dp)
            ) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.3).sp
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = product.category,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                    
                    // Styled Rating indicator from the HTML template
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = Color(0xFFFFB300),
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = "4.8",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(MaterialTheme.colorScheme.errorContainer)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "🌶️ ${product.spiciness}",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 10.sp
                            )
                        )
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(MaterialTheme.colorScheme.secondaryContainer)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "🍽️ ${product.portion}",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                fontSize = 10.sp
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = formatRupiah(product.price),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )

                    if (quantity == 0) {
                        Button(
                            onClick = onAdd,
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                            modifier = Modifier
                                .testTag("add_item_${product.id}")
                                .height(36.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text("Pesan", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            IconButton(
                                onClick = onDecrease,
                                modifier = Modifier
                                    .testTag("decrease_item_${product.id}")
                                    .size(30.dp)
                                    .background(
                                        MaterialTheme.colorScheme.surfaceVariant,
                                        CircleShape
                                    )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Remove,
                                    contentDescription = "Kurang",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            Text(
                                text = quantity.toString(),
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                                modifier = Modifier
                                    .testTag("qty_label_${product.id}")
                                    .width(32.dp),
                                textAlign = TextAlign.Center
                            )

                            IconButton(
                                onClick = onAdd,
                                modifier = Modifier
                                    .testTag("increase_item_${product.id}")
                                    .size(30.dp)
                                    .background(MaterialTheme.colorScheme.primary, CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Add,
                                    contentDescription = "Tambah",
                                    tint = MaterialTheme.colorScheme.onPrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------
// SCREEN 3: MENU MANAGEMENT SCREEN (ADMINS CATS)
// ----------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManageMenuScreen(
    viewModel: ProductViewModel,
    onBackPressed: () -> Unit,
    onAddProductPressed: () -> Unit,
    onEditProductPressed: (Product) -> Unit
) {
    val products by viewModel.products.collectAsState()
    var searchKeyword by remember { mutableStateOf("") }

    val filteredProducts = remember(products, searchKeyword) {
        if (searchKeyword.isBlank()) {
            products
        } else {
            products.filter { it.name.contains(searchKeyword, ignoreCase = true) }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Atur Katalog Menu", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali ke Beranda"
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddProductPressed,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier
                    .testTag("add_product_fab")
                    .navigationBarsPadding()
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Tambah Menu Baru")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            // Search field
            OutlinedTextField(
                value = searchKeyword,
                onValueChange = { searchKeyword = it },
                placeholder = { Text("Cari nama makanan / minuman...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search"
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp)
                    .testTag("menu_search_field"),
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f)
                )
            )

            if (filteredProducts.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Restaurant,
                            contentDescription = "Katalog Kosong",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f),
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Katalog Menu Kosong",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Silakan klik tombol '+' di sudut kanan bawah untuk mendaftarkan menu.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(filteredProducts, key = { it.id }) { item ->
                        ManageProductItemCard(
                            product = item,
                            formatRupiah = { viewModel.formatRupiah(it) },
                            onEdit = { onEditProductPressed(item) },
                            onDelete = { viewModel.deleteProduct(item) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ManageProductItemCard(
    product: Product,
    formatRupiah: (Double) -> String,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(1.dp, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FoodImageHolder(
                imageUri = product.imageUri,
                category = product.category,
                modifier = Modifier.size(64.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    SuggestionChip(
                        onClick = {},
                        label = { Text(product.category, fontSize = 10.sp) },
                        modifier = Modifier.height(20.dp)
                    )
                    Text(
                        text = formatRupiah(product.price),
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "🌶️ ${product.spiciness}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                    Text(
                        text = "•",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "🍱 Porsi ${product.portion}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            Row {
                IconButton(
                    onClick = onEdit,
                    modifier = Modifier.testTag("edit_product_${product.id}")
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Edit Menu",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.testTag("delete_product_${product.id}")
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Hapus Menu",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

// ----------------------------------------------------
// SCREEN 4: ADD / EDIT PRODUCT FORM
// ----------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditProductScreen(
    viewModel: ProductViewModel,
    product: Product?,
    onBackPressed: () -> Unit,
    onSaved: () -> Unit
) {
    val isEditMode = product != null

    var name by remember { mutableStateOf(product?.name ?: "") }
    var priceStr by remember { mutableStateOf(product?.price?.toLong()?.toString() ?: "") }
    var category by remember { mutableStateOf(product?.category ?: "Makanan") }
    var spiciness by remember { mutableStateOf(product?.spiciness ?: "Sedang") }
    var portion by remember { mutableStateOf(product?.portion ?: "Normal") }

    // Custom choice flow: Camera/Gallery vs Built-in Preset Emojis
    var usePresetChoice by remember { mutableStateOf(product?.imageUri?.startsWith("preset_") ?: true) }
    var selectedPreset by remember { mutableStateOf(if (isEditMode && usePresetChoice) product?.imageUri ?: "preset_nasigoreng" else "preset_nasigoreng") }
    var selectedGalleryUri by remember { mutableStateOf<String?>(if (isEditMode && !usePresetChoice) product?.imageUri else null) }

    val context = LocalContext.current

    // Media Picker launcher securely
    val mediaPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            // Flag context grant permission if needed or convert to string uri
            selectedGalleryUri = uri.toString()
            usePresetChoice = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEditMode) "Ubah Item Menu" else "Tambah Menu Baru", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Batal"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .background(MaterialTheme.colorScheme.background)
        ) {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                // Name Field
                item {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Nama Menu") },
                        placeholder = { Text("Contoh: Nasi Goreng Gila") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_product_name"),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                // Price Field
                item {
                    OutlinedTextField(
                        value = priceStr,
                        onValueChange = { priceStr = it },
                        label = { Text("Harga (Rupiah)") },
                        placeholder = { Text("Contoh: 15000") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_product_price"),
                        singleLine = true,
                        prefix = { Text("Rp ") },
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                // Category Selector
                item {
                    Text(
                        text = "Kategori Menu",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val categoriesList = listOf("Makanan", "Minuman", "Cemilan", "Lainnya")
                        categoriesList.forEach { cat ->
                            val chipSelected = category == cat
                            FilterChip(
                                selected = chipSelected,
                                onClick = { category = cat },
                                label = { Text(cat, fontSize = 12.sp) }
                            )
                        }
                    }
                }

                // Tingkat Kepedasan Section
                item {
                    Column {
                        Text(
                            text = "Tingkat Kepedasan (Khusus Makanan/Cemilan)",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            val spicinessOptions = listOf("Sedikit", "Sedang", "Banyak")
                            spicinessOptions.forEach { opt ->
                                val chipSelected = spiciness == opt
                                FilterChip(
                                    selected = chipSelected,
                                    onClick = { spiciness = opt },
                                    label = { Text(opt, fontSize = 12.sp) }
                                )
                            }
                        }
                    }
                }

                // Ukuran Porsi Section
                item {
                    Column {
                        Text(
                            text = "Ukuran Porsi",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            val portionOptions = listOf("Sedikit", "Normal", "Banyak")
                            portionOptions.forEach { opt ->
                                val chipSelected = portion == opt
                                FilterChip(
                                    selected = chipSelected,
                                    onClick = { portion = opt },
                                    label = { Text(opt, fontSize = 12.sp) }
                                )
                            }
                        }
                    }
                }

                // Picture Selection Segment
                item {
                    Text(
                        text = "Foto / Tampilan Produk",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        // Presets tab option
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { usePresetChoice = true }
                                .background(
                                    if (usePresetChoice) MaterialTheme.colorScheme.primary else Color.Transparent
                                )
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Preset Ilustrasi",
                                color = if (usePresetChoice) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }

                        // Gallery tab option
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    usePresetChoice = false
                                    if (selectedGalleryUri == null) {
                                        mediaPickerLauncher.launch(
                                            androidx.activity.result.PickVisualMediaRequest(
                                                ActivityResultContracts.PickVisualMedia.ImageOnly
                                            )
                                        )
                                    }
                                }
                                .background(
                                    if (!usePresetChoice) MaterialTheme.colorScheme.primary else Color.Transparent
                                )
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Ambil Dari Galeri",
                                color = if (!usePresetChoice) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                // Dynamic selector controls depending on tab
                item {
                    if (usePresetChoice) {
                        Column {
                            Text(
                                text = "Pilih Ilustrasi Kuliner:",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Live preview of current preset select
                                FoodImageHolder(
                                    imageUri = selectedPreset,
                                    category = category,
                                    modifier = Modifier.size(64.dp)
                                )
                                Spacer(modifier = Modifier.width(16.dp))

                                var expandedDropdown by remember { mutableStateOf(false) }
                                Box(modifier = Modifier.weight(1f)) {
                                    OutlinedButton(
                                        onClick = { expandedDropdown = true },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        val displayLabel = PRESET_ITEMS.find { it.first == selectedPreset }?.second ?: "Pilih preset"
                                        Text(displayLabel)
                                        Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                                    }

                                    DropdownMenu(
                                        expanded = expandedDropdown,
                                        onDismissRequest = { expandedDropdown = false },
                                        modifier = Modifier.fillMaxWidth(0.7f)
                                    ) {
                                        PRESET_ITEMS.forEach { entry ->
                                            DropdownMenuItem(
                                                text = { Text(entry.second) },
                                                onClick = {
                                                    selectedPreset = entry.first
                                                    expandedDropdown = false
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // Gallery selection
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            if (selectedGalleryUri != null) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .border(
                                            1.dp,
                                            MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
                                            RoundedCornerShape(8.dp)
                                        )
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    FoodImageHolder(
                                        imageUri = selectedGalleryUri,
                                        category = category,
                                        modifier = Modifier.size(72.dp)
                                    )
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Gambar Galeri Te-load",
                                            style = MaterialTheme.typography.labelLarge,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "Berhasil memuat item media kustom.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    IconButton(
                                        onClick = {
                                            mediaPickerLauncher.launch(
                                                androidx.activity.result.PickVisualMediaRequest(
                                                    ActivityResultContracts.PickVisualMedia.ImageOnly
                                                )
                                            )
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.PhotoLibrary,
                                            contentDescription = "Ganti Foto",
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            } else {
                                OutlinedButton(
                                    onClick = {
                                        mediaPickerLauncher.launch(
                                            androidx.activity.result.PickVisualMediaRequest(
                                                ActivityResultContracts.PickVisualMedia.ImageOnly
                                            )
                                        )
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(84.dp),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Icon(Icons.Default.UploadFile, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Buka Galeri Foto")
                                }
                            }
                        }
                    }
                }
            }

            // Save actions at bottom
            Button(
                onClick = {
                    if (name.isBlank()) {
                        Toast.makeText(context, "Nama tidak boleh kosong!", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    val priceVal = priceStr.toDoubleOrNull()
                    if (priceVal == null || priceVal <= 0) {
                        Toast.makeText(context, "Masukkan harga yang valid!", Toast.LENGTH_SHORT).show()
                        return@Button
                    }

                    val chosenImageUri = if (usePresetChoice) selectedPreset else selectedGalleryUri

                    if (isEditMode) {
                        val updatedProduct = product!!.copy(
                            name = name,
                            price = priceVal,
                            category = category,
                            imageUri = chosenImageUri,
                            spiciness = spiciness,
                            portion = portion
                        )
                        viewModel.updateProduct(updatedProduct)
                        Toast.makeText(context, "Katalog berhasil diperbarui", Toast.LENGTH_SHORT).show()
                    } else {
                        viewModel.addProduct(
                            name = name,
                            price = priceVal,
                            category = category,
                            imageUri = chosenImageUri,
                            spiciness = spiciness,
                            portion = portion
                        )
                        Toast.makeText(context, "Katalog baru ditambahkan", Toast.LENGTH_SHORT).show()
                    }
                    onSaved()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp)
                    .testTag("save_product_button")
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(imageVector = Icons.Default.Save, contentDescription = "Simpan")
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isEditMode) "Perbarui Menu" else "Daftarkan Menu",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }
        }
    }
}

// ----------------------------------------------------
// SCREEN 5: CHECKOUT & WhatsApp RECEIPT PREVIEW
// ----------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    viewModel: ProductViewModel,
    onBackPressed: () -> Unit,
    onSuccess: () -> Unit
) {
    val products by viewModel.products.collectAsState()
    val cart by viewModel.cart.collectAsState()
    val targetWhatsApp by viewModel.targetWhatsApp.collectAsState()

    val activeCartItems = remember(cart, products) {
        cart.mapNotNull { entry ->
            val product = products.find { it.id == entry.key }
            if (product != null) Pair(product, entry.value) else null
        }
    }

    val totalAmount = remember(activeCartItems) {
        activeCartItems.sumOf { it.first.price * it.second }
    }

    val itemType = remember { androidx.compose.runtime.mutableStateMapOf<Int, String>() }
    val itemLevel = remember { androidx.compose.runtime.mutableStateMapOf<Int, String>() }
    val itemPortion = remember { androidx.compose.runtime.mutableStateMapOf<Int, String>() }
    val itemSugar = remember { androidx.compose.runtime.mutableStateMapOf<Int, Boolean>() }

    val combinedNotes = remember(activeCartItems, itemType.toMap(), itemLevel.toMap(), itemPortion.toMap(), itemSugar.toMap()) {
        val notes = mutableMapOf<Int, String>()
        for (item in activeCartItems) {
            val pid = item.first.id
            if (item.first.category == "Makanan" || item.first.category == "Cemilan") {
                val type = itemType[pid] ?: "Asin/Gurih"
                val level = itemLevel[pid] ?: if (type == "Asin/Gurih") "Sedang" else "Manis"
                val portion = itemPortion[pid] ?: "Standar"
                notes[pid] = "Rasa: $type, Lvl: $level, Porsi: $portion"
            } else if (item.first.category == "Minuman") {
                val isExtra = itemSugar[pid] ?: false
                if (isExtra) {
                    notes[pid] = "Extra Gula"
                } else {
                    notes[pid] = "Gula Normal"
                }
            }
        }
        notes
    }

    // Live preview invoice compilation
    val printBillText = remember(activeCartItems, combinedNotes, viewModel) {
        viewModel.generateWhatsAppText(activeCartItems, combinedNotes)
    }

    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Struk & Konfirmasi", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali ke Catalog"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
                .padding(horizontal = 16.dp)
        ) {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                // WhatsApp Phone Input Component
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Kirim Struk ke Pelanggan",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Masukkan nomor WhatsApp tujuan (disarankan menggunakan kode negara, misal: 62812xxx)",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            OutlinedTextField(
                                value = targetWhatsApp,
                                onValueChange = { viewModel.setTargetWhatsApp(it) },
                                label = { Text("No. WhatsApp Pembeli") },
                                placeholder = { Text("Contoh: 628123456789") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Phone,
                                        contentDescription = "WhatsApp Icon"
                                    )
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("whatsapp_input_field"),
                                shape = RoundedCornerShape(8.dp),
                                singleLine = true
                            )
                        }
                    }
                }

                // Kustomisasi Pesanan
                item {
                    Text(
                        text = "Kustomisasi Pesanan",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(bottom = 8.dp, top = 8.dp)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        activeCartItems.forEach { (product, qty) ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "${product.name} ($qty x)",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    if (product.category == "Makanan" || product.category == "Cemilan") {
                                        val type = itemType[product.id] ?: "Asin/Gurih"
                                        val level = itemLevel[product.id] ?: if (type == "Asin/Gurih") "Sedang" else "Manis"
                                        val portion = itemPortion[product.id] ?: "Standar"

                                        Text("Kategori Rasa", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 4.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 4.dp)) {
                                            FilterChip(selected = type == "Asin/Gurih", onClick = { itemType[product.id] = "Asin/Gurih"; itemLevel[product.id] = "Sedang" }, label = { Text("Asin/Gurih") })
                                            FilterChip(selected = type == "Manis", onClick = { itemType[product.id] = "Manis"; itemLevel[product.id] = "Manis" }, label = { Text("Manis") })
                                        }

                                        Text(if (type == "Asin/Gurih") "Tingkat Kepedasan" else "Tingkat Kemanisan", style = MaterialTheme.typography.labelSmall)
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp), 
                                            modifier = Modifier.padding(bottom = 4.dp).horizontalScroll(rememberScrollState())
                                        ) {
                                            val options = if (type == "Asin/Gurih") listOf("Normal", "Sedang", "Pedas", "Pedas Banget") else listOf("Sedikit Manis", "Manis", "Manis Banget")
                                            for (opt in options) {
                                                FilterChip(selected = level == opt, onClick = { itemLevel[product.id] = opt }, label = { Text(opt) })
                                            }
                                        }

                                        Text("Ukuran Porsi", style = MaterialTheme.typography.labelSmall)
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            FilterChip(selected = portion == "Standar", onClick = { itemPortion[product.id] = "Standar" }, label = { Text("Standar") })
                                            FilterChip(selected = portion == "Besar", onClick = { itemPortion[product.id] = "Besar" }, label = { Text("Besar") })
                                        }
                                    } else if (product.category == "Minuman") {
                                        val isExtraSugar = itemSugar[product.id] ?: false
                                        Text("Kadar Gula", style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 4.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            FilterChip(selected = !isExtraSugar, onClick = { itemSugar[product.id] = false }, label = { Text("Gula Normal") })
                                            FilterChip(selected = isExtraSugar, onClick = { itemSugar[product.id] = true }, label = { Text("Extra Gula") })
                                        }
                                    } else {
                                        Text("Tidak ada opsi khusus.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        }
                    }
                }

                // Billing invoice screen preview
                item {
                    Column {
                        Text(
                            text = "Pratinjau Struk Teks",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceColorAtElevation(1.dp)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                            ) {
                                Text(
                                    text = printBillText,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            // Submit actions: WhatsApp launch or local file log & complete order flow
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        if (targetWhatsApp.isBlank()) {
                            Toast.makeText(context, "Tolong isi nomor WhatsApp pembeli terlebih dahulu!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }

                        // Clean the phone number (keep digits only)
                        var cleanedPhone = targetWhatsApp.filter { it.isDigit() }
                        if (cleanedPhone.length < 9) {
                            Toast.makeText(context, "Format nomor WhatsApp tidak valid!", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        
                        if (cleanedPhone.startsWith("0")) {
                            cleanedPhone = "62" + cleanedPhone.substring(1)
                        } else if (cleanedPhone.startsWith("8")) {
                            cleanedPhone = "62" + cleanedPhone
                        }

                        try {
                            // Encode receipt message with standard URL formats
                            val encodedMsg = URLEncoder.encode(printBillText, "UTF-8")
                            val waUrl = "https://wa.me/$cleanedPhone?text=$encodedMsg"
                            
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)).apply {
                                setPackage("com.whatsapp") // Try to target official WhatsApp app for native bypass if possible
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            }

                            // Try calling native WhatsApp first, fallback to browser url schema resolver
                            try {
                                context.startActivity(intent)
                            } catch (ex: Exception) {
                                // Secondary fallback with standard intent launcher
                                val generalWaIntent = Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)).apply {
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                context.startActivity(generalWaIntent)
                            }

                            Toast.makeText(context, "Membuka WhatsApp...", Toast.LENGTH_SHORT).show()
                            
                            // Save to local transaction database
                            viewModel.addTransaction(
                                receiptText = printBillText,
                                totalAmount = totalAmount,
                                targetWhatsApp = targetWhatsApp
                            )
                            
                            // Complete transactions and clear states
                            onSuccess()
                        } catch (e: Exception) {
                            Toast.makeText(context, "Gagal membuka WhatsApp. Silakan cek instalasi aplikasi WhatsApp Anda.", Toast.LENGTH_LONG).show()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("send_whatsapp_receipt_button")
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(imageVector = Icons.Default.Send, contentDescription = "Kirim WhatsApp")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Kirim ke WhatsApp & Simpan",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    )
                }

                OutlinedButton(
                    onClick = {
                        // Save directly to local transaction database without triggering external apps
                        viewModel.addTransaction(
                            receiptText = printBillText,
                            totalAmount = totalAmount,
                            targetWhatsApp = targetWhatsApp.ifBlank { "Lokal/Offline" }
                        )
                        Toast.makeText(context, "Transaksi berhasil disimpan ke riwayat!", Toast.LENGTH_SHORT).show()
                        onSuccess()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("save_offline_receipt_button")
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary)
                ) {
                    Icon(imageVector = Icons.Default.Save, contentDescription = "Simpan Offline")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Simpan Tanpa Kirim WhatsApp",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 14.sp)
                    )
                }
            }
        }
    }
}

// ----------------------------------------------------
// SCREEN 6: TRANSACTION HISTORY SCREEN
// ----------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionHistoryScreen(
    viewModel: ProductViewModel,
    onBackPressed: () -> Unit
) {
    val transactions by viewModel.transactions.collectAsState()
    val context = LocalContext.current
    var searchRowQuery by remember { mutableStateOf("") }
    
    val filteredTransactions = remember(transactions, searchRowQuery) {
        if (searchRowQuery.isBlank()) {
            transactions
        } else {
            transactions.filter {
                it.receiptText.contains(searchRowQuery, ignoreCase = true) ||
                it.targetWhatsApp.contains(searchRowQuery)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Riwayat Pembayaran", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali ke Dashboard"
                        )
                    }
                },
                actions = {
                    if (transactions.isNotEmpty()) {
                        IconButton(
                            onClick = {
                                viewModel.clearAllTransactions()
                                Toast.makeText(context, "Semua riwayat berhasil dibersihkan", Toast.LENGTH_SHORT).show()
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.DeleteSweep,
                                contentDescription = "Sapu Bersih Riwayat",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
                .padding(horizontal = 16.dp)
        ) {
            // Search Input Field
            OutlinedTextField(
                value = searchRowQuery,
                onValueChange = { searchRowQuery = it },
                placeholder = { Text("Cari berdasarkan menu atau nomor WA...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
                    .testTag("search_history_query"),
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = "Search Icon")
                },
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )

            if (filteredTransactions.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Receipt,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(72.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (searchRowQuery.isNotBlank()) "Riwayat Tidak Ditemukan" else "Belum Ada Riwayat Pembayaran",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (searchRowQuery.isNotBlank()) "Coba kata kunci pencarian yang lain." else "Transaksi yang telah berhasil dibayar atau dikirimkan ke WhatsApp akan muncul di sini.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 24.dp)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 20.dp, top = 4.dp)
                ) {
                    items(filteredTransactions, key = { txn: com.example.data.TransactionHistory -> txn.id }) { txn: com.example.data.TransactionHistory ->
                        TransactionItemCard(
                            transaction = txn,
                            onDelete = {
                                viewModel.deleteTransaction(txn)
                                Toast.makeText(context, "Riwayat transaksi dihapus", Toast.LENGTH_SHORT).show()
                            },
                            formatRupiah = { viewModel.formatRupiah(it) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionItemCard(
    transaction: com.example.data.TransactionHistory,
    onDelete: () -> Unit,
    formatRupiah: (Double) -> String
) {
    var isExpanded by remember { mutableStateOf(false) }
    val dateFormat = remember { SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("id", "ID")) }
    val timeString = remember(transaction.timestamp) { dateFormat.format(java.util.Date(transaction.timestamp)) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { isExpanded = !isExpanded }
            .testTag("transaction_history_item_${transaction.id}"),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Success",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Column {
                        Text(
                            text = timeString,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "WA: ${transaction.targetWhatsApp}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Hapus Riwayat",
                        tint = MaterialTheme.colorScheme.error.copy(alpha = 0.8f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Total Pembayaran",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatRupiah(transaction.totalAmount),
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = if (isExpanded) "Tutup Struk" else "Lihat Struk",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary
                    )
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column {
                    Spacer(modifier = Modifier.height(14.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = transaction.receiptText,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            lineHeight = 15.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier
                                .padding(12.dp)
                                .fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SajiSplashScreen(
    viewModel: ProductViewModel,
    onGetStarted: (String, String, String) -> Unit
) {
    var userNameInput by remember { mutableStateOf("") }
    var locationInput by remember { mutableStateOf("") }
    var storeNameInput by remember { mutableStateOf("Warung SajiKasir") }
    var targetWaInput by remember { mutableStateOf("") }
    val context = LocalContext.current

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { paddingVals ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingVals)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.background,
                            MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f)
                        )
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Spacer(modifier = Modifier.height(32.dp))

                // Beautiful culinary logo badge
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(
                                    MaterialTheme.colorScheme.primary,
                                    MaterialTheme.colorScheme.secondary
                                )
                            )
                        )
                        .shadow(8.dp, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(124.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surface),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "🍛🧾",
                            fontSize = 60.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // Brand details
                Text(
                    text = "SajiKasir",
                    style = MaterialTheme.typography.displayMedium.copy(
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.primary,
                        letterSpacing = (-1).sp
                    ),
                    modifier = Modifier.testTag("splash_title")
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Selamat Datang di SajiKasir!",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    ),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Kelola menu digital, kasir pesanan kilat, dan langsung kirimkan struk pembayaran modern via WhatsApp ke pelanggan UMKM Anda.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Setup Welcome Details Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(4.dp, RoundedCornerShape(24.dp)),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Konfigurasi Awal Toko Anda",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        )

                        // Store Name Field
                        OutlinedTextField(
                            value = storeNameInput,
                            onValueChange = { storeNameInput = it },
                            label = { Text("Nama Toko / Warung Anda") },
                            placeholder = { Text("Contoh: Warung Sejahtera") },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.Store,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            },
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("setup_store_name"),
                            shape = RoundedCornerShape(12.dp)
                        )

                        // User Name Field
                        OutlinedTextField(
                            value = userNameInput,
                            onValueChange = { userNameInput = it },
                            label = { Text("Nama Panggilan Anda") },
                            placeholder = { Text("Contoh: Vina") },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        // Location Field
                        OutlinedTextField(
                            value = locationInput,
                            onValueChange = { locationInput = it },
                            label = { Text("Kota / Lokasi") },
                            placeholder = { Text("Contoh: Jakarta Selatan") },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        // WhatsApp Default Field
                        OutlinedTextField(
                            value = targetWaInput,
                            onValueChange = { targetWaInput = it },
                            label = { Text("No. WhatsApp Toko / Admin (Opsional)") },
                            placeholder = { Text("Contoh: 628123456789") },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.Phone,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("setup_whatsapp"),
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        // Large beautiful button
                        Button(
                            onClick = {
                                val storeNameValue = storeNameInput.trim().ifBlank { "Warung SajiKasir" }
                                val userNameValue = userNameInput.trim().ifBlank { "Kasir" }
                                val locationValue = locationInput.trim().ifBlank { "Lokasi Toko" }

                                if (targetWaInput.isNotBlank()) {
                                    viewModel.setTargetWhatsApp(targetWaInput.trim())
                                }

                                Toast.makeText(
                                    context,
                                    "Selamat datang, Kak $userNameValue!",
                                    Toast.LENGTH_LONG
                                ).show()

                                onGetStarted(userNameValue, locationValue, storeNameValue)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("start_button"),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            ),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                text = "Mulai Kelola Toko 🚀",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

// ----------------------------------------------------
// SCREEN 8: PROFILE SETTINGS SCREEN
// ----------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSettingsScreen(
    initialUserName: String,
    initialUserLocation: String,
    initialStoreName: String,
    initialPhotoUri: String?,
    onSaveProfile: (String, String, String, String?) -> Unit,
    onBackPressed: () -> Unit
) {
    var userNameInput by remember { mutableStateOf(initialUserName) }
    var locationInput by remember { mutableStateOf(initialUserLocation) }
    var storeNameInput by remember { mutableStateOf(initialStoreName) }
    var photoUri by remember { mutableStateOf(initialPhotoUri) }

    val photoPickerLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            photoUri = uri.toString()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pengaturan Profil", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile photo editor
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .clickable {
                        photoPickerLauncher.launch(
                            androidx.activity.result.PickVisualMediaRequest(
                                androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia.ImageOnly
                            )
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                if (!photoUri.isNullOrEmpty()) {
                    androidx.compose.foundation.Image(
                        painter = rememberAsyncImagePainter(photoUri),
                        contentDescription = "Foto Profil",
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Pilih Foto",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Ketuk untuk ubah foto",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = userNameInput,
                onValueChange = { userNameInput = it },
                label = { Text("Nama Panggilan") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                shape = RoundedCornerShape(12.dp)
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = locationInput,
                onValueChange = { locationInput = it },
                label = { Text("Kota / Lokasi") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = storeNameInput,
                onValueChange = { storeNameInput = it },
                label = { Text("Nama Toko / Warung") },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Store, contentDescription = null) },
                shape = RoundedCornerShape(12.dp)
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = {
                    onSaveProfile(userNameInput, locationInput, storeNameInput, photoUri)
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Simpan Profil", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}

