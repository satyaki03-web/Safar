import 'package:flutter/material.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/widgets/journey_ticket_clip_path.dart';
import '../../../../core/widgets/safar_icon.dart';
import '../../../../core/widgets/safar_ledger_row.dart';

class ReceiptScreen extends StatefulWidget {
  final String rideId;

  const ReceiptScreen({super.key, required this.rideId});

  @override
  State<ReceiptScreen> createState() => _ReceiptScreenState();
}

class _ReceiptScreenState extends State<ReceiptScreen> {
  bool _isPaid = false;
  int _rating = 5;
  final TextEditingController _reviewController = TextEditingController();

  void _simulateUPIPayment() {
    setState(() => _isPaid = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('UPI Payment Confirmed (Ref: UPI-984210B)'),
        backgroundColor: SafarColors.deepGreen,
      ),
    );
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.paper,
        elevation: 0,
        title: const Text('Journey Receipt', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(SafarSpacing.s20),
          child: Column(
            children: [
              // Journey Ticket Clipper
              ClipPath(
                clipper: const JourneyTicketClipper(notchRadius: 10.0, notchPositionFromTop: 110.0),
                child: Container(
                  padding: const EdgeInsets.all(SafarSpacing.s20),
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
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Safar Kolkata',
                                style: theme.textTheme.headlineMedium?.copyWith(fontSize: 18),
                              ),
                              const Text('Driver-as-a-Service', style: TextStyle(fontSize: 11, color: SafarColors.mutedText)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: SafarColors.paper,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: SafarColors.rule),
                            ),
                            child: Text(
                              'TRIP #${widget.rideId.isEmpty ? '8912' : widget.rideId.substring(0, 4).toUpperCase()}',
                              style: const TextStyle(fontFamily: 'IBM Plex Mono', fontWeight: FontWeight.w700, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: SafarSpacing.s20),
                      const Divider(color: SafarColors.rule),
                      const SizedBox(height: SafarSpacing.s12),

                      SafarLedgerRow(label: 'Driver', value: 'Subhashish Das'),
                      SafarLedgerRow(label: 'Car', value: 'Hyundai Creta SX (WB 02 AM 4892)'),
                      SafarLedgerRow(label: 'Billed Hours', value: '4.0 Hours'),
                      SafarLedgerRow(label: 'Base Rate (4h × ₹180)', value: '₹720'),
                      SafarLedgerRow(label: 'Night Surcharge', value: '₹0'),
                      SafarLedgerRow(label: 'Platform & Safety Fee', value: '₹40'),

                      // Stubbed Micro-Insurance
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Trip Cover', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                Text('Coming soon: per-trip micro-insurance', style: theme.textTheme.bodySmall?.copyWith(fontSize: 10)),
                              ],
                            ),
                            const Text('₹0', style: TextStyle(fontFamily: 'IBM Plex Mono', fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                      const Divider(color: SafarColors.rule),

                      SafarLedgerRow(
                        label: 'Total Amount',
                        value: '₹760',
                        isBold: true,
                        valueColor: SafarColors.ink,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: SafarSpacing.s20),

              // Payment Action
              if (!_isPaid)
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SafarColors.ink,
                      foregroundColor: Colors.white,
                      shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                    ),
                    onPressed: _simulateUPIPayment,
                    child: const Text('Pay ₹760 via Razorpay UPI', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: SafarColors.deepGreen.withOpacity(0.1),
                    borderRadius: SafarRadii.card,
                    border: Border.all(color: SafarColors.deepGreen),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle, color: SafarColors.deepGreen, size: 20),
                      SizedBox(width: 8),
                      Text('Payment Settled via UPI', style: TextStyle(fontWeight: FontWeight.w700, color: SafarColors.deepGreen)),
                    ],
                  ),
                ),

              const SizedBox(height: SafarSpacing.s24),

              // Mutual 1 to 5 Rating Section
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
                    const Text('Rate your driver', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 4),
                    const Text('How was your trip with Subhashish?', style: TextStyle(fontSize: 12, color: SafarColors.mutedText)),
                    const SizedBox(height: SafarSpacing.s12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final starValue = index + 1;
                        return IconButton(
                          icon: SafarIcon(
                            SafarIconType.star,
                            size: 24,
                            color: starValue <= _rating ? SafarColors.signalYellow : SafarColors.rule,
                          ),
                          onPressed: () => setState(() => _rating = starValue),
                        );
                      }),
                    ),
                    const SizedBox(height: SafarSpacing.s12),
                    TextField(
                      controller: _reviewController,
                      decoration: const InputDecoration(
                        hintText: 'Optional driver review (e.g. smooth driving on Maa Flyover)',
                        hintStyle: TextStyle(fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: SafarSpacing.s12),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: SafarColors.ink),
                          shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Rating saved to WB transport records!')),
                          );
                        },
                        child: const Text('Submit Review', style: TextStyle(fontWeight: FontWeight.w700, color: SafarColors.ink)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
