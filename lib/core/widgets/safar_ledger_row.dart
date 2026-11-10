import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';

class SafarLedgerRow extends StatelessWidget {
  final String label;
  final String value;
  final String? subtitle;
  final bool isBold;
  final bool isMono;
  final Color? valueColor;

  const SafarLedgerRow({
    super.key,
    required this.label,
    required this.value,
    this.subtitle,
    this.isBold = false,
    this.isMono = true,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: SafarSpacing.s8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isBold ? SafarColors.ink : SafarColors.mutedText,
                        fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: SafarSpacing.s12),
              Text(
                value,
                style: isMono
                    ? theme.textTheme.labelSmall?.copyWith(
                        fontSize: isBold ? 15.0 : 13.0,
                        fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
                        color: valueColor ?? SafarColors.ink,
                      )
                    : theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
                        color: valueColor ?? SafarColors.ink,
                      ),
              ),
            ],
          ),
        ),
        const Divider(color: SafarColors.rule, height: 1.0, thickness: 1.0),
      ],
    );
  }
}
