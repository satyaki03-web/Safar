import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../tokens/colors.dart';
import '../tokens/radii.dart';

@immutable
class SafarThemeExtension extends ThemeExtension<SafarThemeExtension> {
  final Color signalYellow;
  final Color deepGreen;
  final Color paper;
  final Color rule;
  final Color alertRed;
  final Color mutedText;
  final Color nightTint;

  const SafarThemeExtension({
    required this.signalYellow,
    required this.deepGreen,
    required this.paper,
    required this.rule,
    required this.alertRed,
    required this.mutedText,
    required this.nightTint,
  });

  static const defaultInstance = SafarThemeExtension(
    signalYellow: SafarColors.signalYellow,
    deepGreen: SafarColors.deepGreen,
    paper: SafarColors.paper,
    rule: SafarColors.rule,
    alertRed: SafarColors.alertRed,
    mutedText: SafarColors.mutedText,
    nightTint: SafarColors.nightScrubberTint,
  );

  @override
  SafarThemeExtension copyWith({
    Color? signalYellow,
    Color? deepGreen,
    Color? paper,
    Color? rule,
    Color? alertRed,
    Color? mutedText,
    Color? nightTint,
  }) {
    return SafarThemeExtension(
      signalYellow: signalYellow ?? this.signalYellow,
      deepGreen: deepGreen ?? this.deepGreen,
      paper: paper ?? this.paper,
      rule: rule ?? this.rule,
      alertRed: alertRed ?? this.alertRed,
      mutedText: mutedText ?? this.mutedText,
      nightTint: nightTint ?? this.nightTint,
    );
  }

  @override
  SafarThemeExtension lerp(ThemeExtension<SafarThemeExtension>? other, double t) {
    if (other is! SafarThemeExtension) return this;
    return SafarThemeExtension(
      signalYellow: Color.lerp(signalYellow, other.signalYellow, t)!,
      deepGreen: Color.lerp(deepGreen, other.deepGreen, t)!,
      paper: Color.lerp(paper, other.paper, t)!,
      rule: Color.lerp(rule, other.rule, t)!,
      alertRed: Color.lerp(alertRed, other.alertRed, t)!,
      mutedText: Color.lerp(mutedText, other.mutedText, t)!,
      nightTint: Color.lerp(nightTint, other.nightTint, t)!,
    );
  }
}

class SafarTheme {
  static ThemeData get lightTheme {
    // Explicit ColorScheme - zero ColorScheme.fromSeed, no default purple or blue
    const colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: SafarColors.ink,
      onPrimary: SafarColors.surface,
      secondary: SafarColors.deepGreen,
      onSecondary: SafarColors.surface,
      error: SafarColors.alertRed,
      onError: SafarColors.surface,
      surface: SafarColors.surface,
      onSurface: SafarColors.ink,
    );

    // Explicit TextTheme with Fraunces, Schibsted Grotesk, IBM Plex Mono
    final textTheme = TextTheme(
      displayLarge: GoogleFonts.fraunces(
        fontSize: 40.0,
        fontWeight: FontWeight.w700,
        color: SafarColors.ink,
        letterSpacing: -0.5,
      ),
      displayMedium: GoogleFonts.fraunces(
        fontSize: 28.0,
        fontWeight: FontWeight.w700,
        color: SafarColors.ink,
      ),
      headlineMedium: GoogleFonts.fraunces(
        fontSize: 20.0,
        fontWeight: FontWeight.w600,
        color: SafarColors.ink,
      ),
      titleMedium: GoogleFonts.schibstedGrotesk(
        fontSize: 16.0,
        fontWeight: FontWeight.w600,
        color: SafarColors.ink,
      ),
      bodyLarge: GoogleFonts.schibstedGrotesk(
        fontSize: 16.0,
        fontWeight: FontWeight.w400,
        color: SafarColors.ink,
      ),
      bodyMedium: GoogleFonts.schibstedGrotesk(
        fontSize: 14.0,
        fontWeight: FontWeight.w400,
        color: SafarColors.ink,
      ),
      bodySmall: GoogleFonts.schibstedGrotesk(
        fontSize: 12.0,
        fontWeight: FontWeight.w400,
        color: SafarColors.mutedText,
      ),
      labelLarge: GoogleFonts.schibstedGrotesk(
        fontSize: 14.0,
        fontWeight: FontWeight.w600,
        color: SafarColors.ink,
      ),
      labelSmall: GoogleFonts.ibmPlexMono(
        fontSize: 12.0,
        fontWeight: FontWeight.w500,
        color: SafarColors.ink,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: SafarColors.paper,
      textTheme: textTheme,
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      extensions: const [SafarThemeExtension.defaultInstance],
      dividerTheme: const DividerThemeData(
        color: SafarColors.rule,
        thickness: 1.0,
        space: 1.0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: SafarColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
        border: OutlineInputBorder(
          borderRadius: SafarRadii.input,
          borderSide: const BorderSide(color: SafarColors.rule, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: SafarRadii.input,
          borderSide: const BorderSide(color: SafarColors.rule, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: SafarRadii.input,
          borderSide: const BorderSide(color: SafarColors.ink, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: SafarRadii.input,
          borderSide: const BorderSide(color: SafarColors.alertRed, width: 1.0),
        ),
      ),
    );
  }
}
