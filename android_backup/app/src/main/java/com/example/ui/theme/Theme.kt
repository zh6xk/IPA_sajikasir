package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = SleekPrimaryDark,
    onPrimary = SleekBackgroundDark,
    primaryContainer = SleekPrimaryContainerDark,
    onPrimaryContainer = SleekOnBackgroundDark,
    secondary = SleekPrimaryContainerDark,
    onSecondary = SleekBackgroundDark,
    tertiary = SleekPrimaryDark,
    background = SleekBackgroundDark,
    surface = SleekSurfaceDark,
    onTertiary = SleekOnBackgroundDark,
    onBackground = SleekOnBackgroundDark,
    onSurface = SleekOnBackgroundDark,
    onSurfaceVariant = SleekOnBackgroundDark.copy(alpha = 0.7f),
    surfaceVariant = SleekSurfaceDark.copy(alpha = 0.8f)
)

private val LightColorScheme = lightColorScheme(
    primary = SleekPrimary,
    onPrimary = SleekOnPrimary,
    primaryContainer = SleekPrimaryContainer,
    onPrimaryContainer = SleekOnPrimaryContainer,
    secondary = SleekPrimaryContainer,
    onSecondary = SleekOnBackground,
    tertiary = SleekOnSurfaceVariant,
    onTertiary = SleekOnSurfaceVariant,
    background = SleekBackground,
    onBackground = SleekOnBackground,
    surface = SleekSurface,
    onSurface = SleekOnSurface,
    surfaceVariant = SleekSurfaceVariant,
    onSurfaceVariant = SleekOnSurfaceVariant,
    outline = SleekOutline
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Set to false by default to show our culinary brand theme, but allow toggling
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
