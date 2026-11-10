import 'package:flutter/material.dart';

/// Safar strict color tokens. No default Material purple or blue.
abstract class SafarColors {
  /// Primary text, primary button backgrounds
  static const Color ink = Color(0xFF15130F);

  /// Screen paper background
  static const Color paper = Color(0xFFF6F2E9);

  /// Pure card, sheet, and input background
  static const Color surface = Color(0xFFFFFFFF);

  /// Single accent: active states, route line, primary highlights
  static const Color signalYellow = Color(0xFFF2B705);

  /// Secondary: headers, driver-side emphasis, status accents
  static const Color deepGreen = Color(0xFF0F3D36);

  /// Hairline rules and dividers
  static const Color rule = Color(0xFFDDD5C3);

  /// SOS emergency triggers and validation errors only
  static const Color alertRed = Color(0xFFC8321E);

  /// Secondary muted body and caption text
  static const Color mutedText = Color(0xFF6B6558);

  /// Tint for night hours in the Time Block Scrubber (10 PM to 6 AM)
  static const Color nightScrubberTint = Color(0x260F3D36);
}
