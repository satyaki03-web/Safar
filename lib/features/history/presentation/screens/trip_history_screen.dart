import 'package:flutter/material.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';

class TripHistoryScreen extends StatelessWidget {
  const TripHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.paper,
        elevation: 0,
        title: const Text('Trip History', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(SafarSpacing.s20),
          children: [
            _HistoryCard(
              date: '07 Nov 2026',
              route: 'Sector V, Salt Lake ➔ Park Street',
              car: 'Hyundai Creta SX (WB 02 AM 4892)',
              driver: 'Subhashish Das (WB-01-2016)',
              fare: '₹760',
              status: 'Completed',
            ),
            const SizedBox(height: SafarSpacing.s12),
            _HistoryCard(
              date: '04 Nov 2026',
              route: 'Ballygunge Circular Road ➔ Airport T2',
              car: 'Hyundai Creta SX (WB 02 AM 4892)',
              driver: 'Anirban Mukherjee',
              fare: '₹580',
              status: 'Completed',
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final String date;
  final String route;
  final String car;
  final String driver;
  final String fare;
  final String status;

  const _HistoryCard({
    required this.date,
    required this.route,
    required this.car,
    required this.driver,
    required this.fare,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(SafarSpacing.s16),
      decoration: BoxDecoration(
        color: SafarColors.surface,
        borderRadius: SafarRadii.card,
        border: Border.all(color: SafarColors.rule),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(date, style: const TextStyle(fontFamily: 'IBM Plex Mono', fontSize: 11, color: SafarColors.mutedText)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: SafarColors.deepGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  status,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: SafarColors.deepGreen),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(route, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 2),
          Text('$car • $driver', style: const TextStyle(fontSize: 12, color: SafarColors.mutedText)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Fare', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
              Text(fare, style: const TextStyle(fontFamily: 'IBM Plex Mono', fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
        ],
      ),
    );
  }
}
