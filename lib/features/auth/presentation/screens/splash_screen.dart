import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/widgets/safar_icon.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: SafarSpacing.s24, vertical: SafarSpacing.s32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Header brand
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: SafarColors.signalYellow,
                      border: Border.all(color: SafarColors.ink, width: 1.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: SafarIcon(SafarIconType.steeringWheel, size: 28, color: SafarColors.ink),
                    ),
                  ),
                  const SizedBox(height: SafarSpacing.s16),
                  Text(
                    'Safar',
                    style: theme.textTheme.displayLarge?.copyWith(
                      color: SafarColors.ink,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: SafarSpacing.s4),
                  Text(
                    'সফর',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: SafarColors.mutedText,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: SafarSpacing.s16),
                  Text(
                    'Peer-to-peer Driver-as-a-Service for Kolkata. Hire verified chauffeurs by the hour to drive your personal car.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: SafarColors.mutedText,
                      height: 1.4,
                    ),
                  ),
                ],
              ),

              // Action buttons
              Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: SafarColors.ink,
                        foregroundColor: SafarColors.surface,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () => context.go('/auth/role-choice'),
                      child: Text(
                        'Get Started',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: SafarColors.surface,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: SafarSpacing.s12),
                  Text(
                    'Verified with West Bengal Transport Authority records',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontFamily: 'IBM Plex Mono',
                      fontSize: 11,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
