import 'package:flutter/material.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/widgets/safar_ledger_row.dart';

class DriverEarningsScreen extends StatelessWidget {
  const DriverEarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.paper,
        elevation: 0,
        title: const Text('Driver Earnings', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(SafarSpacing.s20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Today / Week Cards
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(SafarSpacing.s16),
                      decoration: BoxDecoration(
                        color: SafarColors.surface,
                        borderRadius: SafarRadii.card,
                        border: Border.all(color: SafarColors.rule),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Today', style: TextStyle(color: SafarColors.mutedText, fontSize: 12)),
                          const SizedBox(height: 4),
                          const Text('₹1,440', style: TextStyle(fontFamily: 'IBM Plex Mono', fontWeight: FontWeight.w700, fontSize: 22)),
                          const SizedBox(height: 2),
                          Text('2 trips completed', style: theme.textTheme.bodySmall?.copyWith(fontSize: 10)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: SafarSpacing.s12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(SafarSpacing.s16),
                      decoration: BoxDecoration(
                        color: SafarColors.surface,
                        borderRadius: SafarRadii.card,
                        border: Border.all(color: SafarColors.rule),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('This Week', style: TextStyle(color: SafarColors.mutedText, fontSize: 12)),
                          const SizedBox(height: 4),
                          const Text('₹8,200', style: TextStyle(fontFamily: 'IBM Plex Mono', fontWeight: FontWeight.w700, fontSize: 22)),
                          const SizedBox(height: 2),
                          Text('11 trips completed', style: theme.textTheme.bodySmall?.copyWith(fontSize: 10)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: SafarSpacing.s16),

              // Payout status
              Container(
                padding: const EdgeInsets.all(SafarSpacing.s16),
                decoration: BoxDecoration(
                  color: SafarColors.surface,
                  borderRadius: SafarRadii.card,
                  border: Border.all(color: SafarColors.rule),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Bank Account Payout Schedule', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 4),
                    const Text(
                      'Direct NEFT/IMPS transfer every Tuesday morning at 06:00 AM IST to State Bank of India account ending in **4821.',
                      style: TextStyle(fontSize: 12, color: SafarColors.mutedText, height: 1.4),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Next Settlement', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: SafarColors.deepGreen.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('Tue, 10 Nov', style: TextStyle(fontFamily: 'IBM Plex Mono', fontWeight: FontWeight.w700, color: SafarColors.deepGreen, fontSize: 11)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: SafarSpacing.s20),

              Text('Per-Trip Earnings Breakdown', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: SafarSpacing.s8),

              SafarLedgerRow(label: 'Sector V ➔ Park Street (4h)', value: '+₹646', valueColor: SafarColors.deepGreen),
              SafarLedgerRow(label: 'Howrah Station ➔ Ballygunge (3h)', value: '+₹484', valueColor: SafarColors.deepGreen),
              SafarLedgerRow(label: 'Airport ➔ New Town AA II (2h)', value: '+₹310', valueColor: SafarColors.deepGreen),
            ],
          ),
        ),
      ),
    );
  }
}
