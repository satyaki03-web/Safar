import 'package:flutter/material.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/widgets/safar_icon.dart';
import '../../../../core/widgets/safar_ledger_row.dart';

class ActiveTripScreen extends StatelessWidget {
  final String rideId;

  const ActiveTripScreen({super.key, required this.rideId});

  void _showSOSDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(SafarSpacing.s24),
          decoration: const BoxDecoration(
            color: SafarColors.surface,
            borderRadius: SafarRadii.bottomSheet,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(color: SafarColors.alertRed, shape: BoxShape.circle),
                    child: const SafarIcon(SafarIconType.alert, size: 20, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  const Text('Emergency SOS Assistance', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: SafarColors.alertRed)),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Tapping emergency dispatch will transmit your live vehicle coordinates and trip details to Kolkata Police Control Room (112).',
                style: TextStyle(fontSize: 13, color: SafarColors.mutedText, height: 1.4),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SafarColors.alertRed,
                    foregroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                  ),
                  icon: const SafarIcon(SafarIconType.phone, size: 18, color: Colors.white),
                  label: const Text('Call Kolkata Police (112)', style: TextStyle(fontWeight: FontWeight.w700)),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel & Return to Trip', style: TextStyle(color: SafarColors.mutedText)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.surface,
        title: const Text('Trip in Progress', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const SafarIcon(SafarIconType.alert, size: 22, color: SafarColors.alertRed),
            onPressed: () => _showSOSDialog(context),
            tooltip: 'Emergency SOS',
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(SafarSpacing.s20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(SafarSpacing.s16),
                decoration: BoxDecoration(
                  color: SafarColors.surface,
                  borderRadius: SafarRadii.card,
                  border: Border.all(color: SafarColors.rule),
                ),
                child: Column(
                  children: [
                    SafarLedgerRow(label: 'Trip ID', value: rideId.isEmpty ? 'WB-KOL-8912' : rideId),
                    SafarLedgerRow(label: 'Elapsed Time', value: '00:42:18'),
                    SafarLedgerRow(label: 'Vehicle', value: 'Creta SX • WB 02 AM 4892'),
                    SafarLedgerRow(label: 'Driver', value: 'Subhashish Das (WB-01-2016)'),
                    SafarLedgerRow(
                      label: 'Running Fare (Fixed 4h)',
                      value: '₹760',
                      isBold: true,
                    ),
                  ],
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: SafarColors.ink),
                    shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                  ),
                  icon: const Icon(Icons.share, size: 18, color: SafarColors.ink),
                  label: const Text('Share Trip Live Link', style: TextStyle(color: SafarColors.ink, fontWeight: FontWeight.w700)),
                  onPressed: () {},
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SafarColors.alertRed,
                    foregroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                  ),
                  onPressed: () => _showSOSDialog(context),
                  child: const Text('Emergency SOS (112)', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
