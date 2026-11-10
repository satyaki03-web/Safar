import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/utils/fare_calculator.dart';
import '../../../../core/widgets/safar_icon.dart';
import '../../../../core/widgets/safar_ledger_row.dart';

class DriverHomeScreen extends ConsumerStatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  ConsumerState<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends ConsumerState<DriverHomeScreen> {
  bool _isOnline = true;
  int _activeTripStep = 0; // 0 = idle/queue, 1 = accepted/navigate, 2 = arrived/otp, 3 = active
  int _countdownSeconds = 30;
  Timer? _countdownTimer;

  final TextEditingController _otpInputController = TextEditingController();
  String? _otpErrorMessage;

  static const LatLng _kolkataCenter = LatLng(22.5735, 88.4331); // Sector V

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownSeconds = 30;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_countdownSeconds > 0) {
            _countdownSeconds--;
          } else {
            _countdownTimer?.cancel();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _otpInputController.dispose();
    super.dispose();
  }

  void _acceptTrip() {
    _countdownTimer?.cancel();
    setState(() => _activeTripStep = 1);
  }

  void _markArrived() {
    setState(() => _activeTripStep = 2);
  }

  void _verifyOtpAndStart() {
    if (_otpInputController.text == '4829') {
      setState(() {
        _activeTripStep = 3;
        _otpErrorMessage = null;
      });
    } else {
      setState(() => _otpErrorMessage = 'Invalid code. Ask the owner for their 4-digit token.');
    }
  }

  void _completeTrip() {
    setState(() {
      _activeTripStep = 0;
      _otpInputController.clear();
      _startCountdown();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.surface,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: SafarColors.deepGreen,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'DRIVER',
                style: TextStyle(
                  color: Colors.white,
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text('Dispatch Console', style: theme.textTheme.titleMedium),
          ],
        ),
        actions: [
          Row(
            children: [
              Text(
                _isOnline ? 'Online' : 'Offline',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _isOnline ? SafarColors.deepGreen : SafarColors.mutedText,
                ),
              ),
              Switch(
                value: _isOnline,
                activeColor: SafarColors.deepGreen,
                onChanged: (val) => setState(() => _isOnline = val),
              ),
            ],
          ),
        ],
      ),
      body: Stack(
        children: [
          // Ola Maps Background with flutter_map
          FlutterMap(
            options: const MapOptions(
              initialCenter: _kolkataCenter,
              initialZoom: 14.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://api.olamaps.io/tiles/vector/v1/styles/default/{z}/{x}/{y}.png?api_key=6iWlDgYtwdTuGrbJso3Vbq17GU6lMsiV',
                fallbackUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.safar.app',
                maxZoom: 19,
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _kolkataCenter,
                    width: 36,
                    height: 36,
                    child: Container(
                      decoration: BoxDecoration(
                        color: SafarColors.signalYellow,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: const [
                          BoxShadow(color: Color(0x33000000), blurRadius: 6, offset: Offset(0, 2)),
                        ],
                      ),
                      child: const Center(
                        child: SafarIcon(SafarIconType.carSide, size: 20, color: SafarColors.ink),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Bottom Sheet Dispatch / Active Trip Overlay
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(SafarSpacing.s20),
              decoration: BoxDecoration(
                color: SafarColors.surface,
                borderRadius: SafarRadii.bottomSheet,
                border: Border.all(color: SafarColors.rule),
                boxShadow: const [
                  BoxShadow(color: Color(0x18000000), blurRadius: 16, offset: Offset(0, -4)),
                ],
              ),
              child: SafeArea(
                top: false,
                child: _buildDriverContent(theme),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDriverContent(ThemeData theme) {
    if (!_isOnline) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SafarIcon(SafarIconType.steeringWheel, size: 32, color: SafarColors.mutedText),
          const SizedBox(height: 8),
          const Text('You are offline', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 4),
          const Text('Toggle online above to receive Kolkata dispatches in your 5 km radius.', textAlign: TextAlign.center),
        ],
      );
    }

    if (_activeTripStep == 0) {
      // Incoming Request Card with 30s Countdown
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: SafarColors.deepGreen,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('NEW DISPATCH', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
              ),
              Row(
                children: [
                  const Icon(Icons.timer_outlined, size: 14, color: SafarColors.alertRed),
                  const SizedBox(width: 4),
                  Text(
                    '${_countdownSeconds}s',
                    style: const TextStyle(
                      fontFamily: 'IBM Plex Mono',
                      fontWeight: FontWeight.w700,
                      color: SafarColors.alertRed,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: SafarSpacing.s12),

          Text('Salt Lake Sector V ➔ Park Street', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Owner: Debashis Banerjee • Tata Nexon (Manual Gear)', style: theme.textTheme.bodySmall),

          const SizedBox(height: SafarSpacing.s12),

          // Driver Brief Tag Highlights
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _BriefBadge('Eco AC'),
              _BriefBadge('Low Music'),
              _BriefBadge('No Phone Calls'),
            ],
          ),

          const SizedBox(height: SafarSpacing.s12),

          SafarLedgerRow(label: 'Trip Duration', value: '4 Hours (Commute)'),
          SafarLedgerRow(
            label: 'Estimated Driver Net Payout',
            value: '₹646 (85%)',
            isBold: true,
            valueColor: SafarColors.deepGreen,
          ),

          const SizedBox(height: SafarSpacing.s16),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: SafarColors.deepGreen,
                foregroundColor: Colors.white,
                shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
              ),
              onPressed: _acceptTrip,
              child: const Text('Accept Trip Request', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      );
    }

    if (_activeTripStep == 1) {
      // Accepted: Navigate to Pickup
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Drive to Pickup Location', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Sector V, Salt Lake (Near College More)', style: TextStyle(fontSize: 13, color: SafarColors.mutedText)),
          const SizedBox(height: SafarSpacing.s16),

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: SafarColors.rule),
                    shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                  ),
                  icon: const SafarIcon(SafarIconType.route, size: 16),
                  label: const Text('Google Maps Directions', style: TextStyle(color: SafarColors.ink, fontSize: 12)),
                  onPressed: () {},
                ),
              ),
            ],
          ),
          const SizedBox(height: SafarSpacing.s12),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: SafarColors.ink,
                foregroundColor: Colors.white,
                shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
              ),
              onPressed: _markArrived,
              child: const Text('Tap When Arrived at Car', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      );
    }

    if (_activeTripStep == 2) {
      // Arrived: Enter Owner's 4-digit code
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Enter Owner\'s 4-Digit Code', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Ask the car owner for the start code on their phone screen.', style: TextStyle(fontSize: 12, color: SafarColors.mutedText)),
          const SizedBox(height: SafarSpacing.s16),

          TextField(
            controller: _otpInputController,
            keyboardType: TextInputType.number,
            maxLength: 4,
            textAlign: TextAlign.center,
            style: const TextStyle(fontFamily: 'IBM Plex Mono', fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: 10),
            decoration: InputDecoration(
              counterText: '',
              errorText: _otpErrorMessage,
              hintText: '0000',
            ),
          ),
          const SizedBox(height: SafarSpacing.s16),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: SafarColors.ink,
                foregroundColor: Colors.white,
                shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
              ),
              onPressed: _verifyOtpAndStart,
              child: const Text('Verify Code & Start Trip', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      );
    }

    // Trip Active
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.between,
          children: [
            Row(
              children: [
                Container(width: 8, height: 8, decoration: const BoxDecoration(color: SafarColors.signalYellow, shape: BoxShape.circle)),
                const SizedBox(width: 6),
                Text('Trip in Progress', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              ],
            ),
            const Text('GPS Telemetry: Active (4s)', style: TextStyle(fontFamily: 'IBM Plex Mono', fontSize: 10, color: SafarColors.deepGreen)),
          ],
        ),
        const SizedBox(height: SafarSpacing.s12),

        const Text('Operating: Tata Nexon (WB 06 H 4210)', style: TextStyle(fontSize: 13, color: SafarColors.mutedText)),
        const SizedBox(height: SafarSpacing.s16),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: SafarColors.ink,
              foregroundColor: Colors.white,
              shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
            ),
            onPressed: _completeTrip,
            child: const Text('Complete Trip & Finalize Payment', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }

  Widget _BriefBadge(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: SafarColors.paper,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: SafarColors.rule),
      ),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}
