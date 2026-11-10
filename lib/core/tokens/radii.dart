import 'package:flutter/material.dart';

/// Safar corner radii standards: 8px for sheets & inputs, 20px top on bottom sheets.
abstract class SafarRadii {
  static const double r4 = 4.0;
  static const double r6 = 6.0;
  static const double r8 = 8.0;
  static const double r12 = 12.0;
  static const double r20 = 20.0;

  static const BorderRadius button = BorderRadius.all(Radius.circular(r8));
  static const BorderRadius input = BorderRadius.all(Radius.circular(r8));
  static const BorderRadius card = BorderRadius.all(Radius.circular(r8));
  static const BorderRadius bottomSheet = BorderRadius.vertical(top: Radius.circular(r20));
}
