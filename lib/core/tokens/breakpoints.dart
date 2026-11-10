import 'package:flutter/material.dart';

/// Responsive breakpoints helper.
/// Mobile phones: 360 - 430 px width
/// Foldables and tablets: >= 700 px width (two-pane layout)
abstract class Breakpoints {
  static const double tabletOrDesktop = 700.0;
  static const double sidePaneWidth = 420.0;

  static bool isTablet(BuildContext context) {
    return MediaQuery.sizeOf(context).width >= tabletOrDesktop;
  }
}
