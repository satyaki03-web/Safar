import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/radii.dart';

class StartCodeToken extends StatelessWidget {
  final String code; // 4 digits, e.g. "4829"

  const StartCodeToken({super.key, required this.code});

  @override
  Widget build(BuildContext context) {
    final digits = code.padRight(4, '-').split('');

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: digits.map((digit) {
        return Container(
          width: 54,
          height: 64,
          margin: const EdgeInsets.symmetric(horizontal: 5),
          decoration: BoxDecoration(
            color: SafarColors.surface,
            borderRadius: SafarRadii.button,
            border: Border.all(color: SafarColors.ink, width: 2.0),
            boxShadow: const [
              BoxShadow(
                color: Color(0x15000000),
                offset: Offset(0, 2),
                blurRadius: 4,
              ),
            ],
          ),
          child: Center(
            child: Text(
              digit,
              style: const TextStyle(
                fontFamily: 'IBM Plex Mono',
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: SafarColors.ink,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
