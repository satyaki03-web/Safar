import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/providers/app_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  int _versionTapCount = 0;

  void _onVersionTapped() {
    setState(() => _versionTapCount++);
    if (_versionTapCount == 5) {
      final current = ref.read(demoModeProvider);
      ref.read(demoModeProvider.notifier).state = !current;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(!current ? 'Developer Demo Mode Activated (Route Simulation Enabled)!' : 'Demo Mode Disabled.'),
          backgroundColor: SafarColors.signalYellow,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _versionTapCount = 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDemoMode = ref.watch(demoModeProvider);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.paper,
        elevation: 0,
        title: const Text('Profile & Settings', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(SafarSpacing.s20),
          children: [
            // User Card
            Container(
              padding: const EdgeInsets.all(SafarSpacing.s16),
              decoration: BoxDecoration(
                color: SafarColors.surface,
                borderRadius: SafarRadii.card,
                border: Border.all(color: SafarColors.rule),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: SafarColors.signalYellow,
                    child: Text(
                      'DB',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontFamily: 'IBM Plex Mono',
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: SafarSpacing.s12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Debashis Banerjee', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const SizedBox(height: 2),
                      const Text('+91 98301 44521', style: TextStyle(fontFamily: 'IBM Plex Mono', fontSize: 12, color: SafarColors.mutedText)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: SafarColors.paper,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: SafarColors.rule),
                        ),
                        child: const Text('Kolkata Registered Owner', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: SafarSpacing.s20),

            // Navigation Links
            Container(
              decoration: BoxDecoration(
                color: SafarColors.surface,
                borderRadius: SafarRadii.card,
                border: Border.all(color: SafarColors.rule),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.directions_car, color: SafarColors.ink, size: 20),
                    title: const Text('Registered Vehicles (1)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.chevron_right, color: SafarColors.mutedText, size: 20),
                    onTap: () {},
                  ),
                  const Divider(color: SafarColors.rule, height: 1),
                  ListTile(
                    leading: const Icon(Icons.receipt_long, color: SafarColors.ink, size: 20),
                    title: const Text('Past Journey Receipts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.chevron_right, color: SafarColors.mutedText, size: 20),
                    onTap: () => context.push('/history'),
                  ),
                  const Divider(color: SafarColors.rule, height: 1),
                  ListTile(
                    leading: const Icon(Icons.account_balance_wallet, color: SafarColors.ink, size: 20),
                    title: const Text('Driver Earnings Ledger', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.chevron_right, color: SafarColors.mutedText, size: 20),
                    onTap: () => context.push('/earnings'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: SafarSpacing.s20),

            // Demo Mode status box
            if (isDemoMode)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: SafarColors.signalYellow.withOpacity(0.15),
                  borderRadius: SafarRadii.card,
                  border: Border.all(color: SafarColors.signalYellow),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.developer_mode, color: SafarColors.ink, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Demo Mode Active: GPS movement along Maa Flyover route simulated on single device.',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

            // Version info with 5-tap hidden demo mode toggle
            Center(
              child: GestureDetector(
                onTap: _onVersionTapped,
                child: Column(
                  children: [
                    Text(
                      'Safar v1.0.0 (Build 42)',
                      style: theme.textTheme.bodySmall?.copyWith(fontFamily: 'IBM Plex Mono', fontSize: 11),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Tap version 5 times for hidden demo simulation',
                      style: theme.textTheme.bodySmall?.copyWith(fontSize: 10, color: SafarColors.mutedText),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
