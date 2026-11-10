import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/tokens/breakpoints.dart';
import '../../../../core/utils/fare_calculator.dart';
import '../../../../core/widgets/safar_icon.dart';
import '../../../../core/widgets/safar_ledger_row.dart';
import '../../../../core/widgets/start_code_token.dart';
import '../../../../core/widgets/status_rail.dart';
import '../widgets/time_block_scrubber.dart';
import '../../domain/driver_brief_entity.dart';
import '../../domain/ride_entity.dart';
import '../../domain/vehicle_entity.dart';

class OwnerHomeScreen extends ConsumerStatefulWidget {
  const OwnerHomeScreen({super.key});

  @override
  ConsumerState<OwnerHomeScreen> createState() => _OwnerHomeScreenState();
}

class _OwnerHomeScreenState extends ConsumerState<OwnerHomeScreen> {
  final MapController _mapController = MapController();

  static const LatLng _kolkataCenter = LatLng(22.5726, 88.3639); // Kolkata BBD Bagh

  // Booking Parameters
  double _startHour = 10.0;
  double _endHour = 14.0;
  TripType _selectedTripType = TripType.commute;
  String _pickupAddress = 'Sector V, Salt Lake (Near College More)';
  String _pickupArea = 'Salt Lake';
  LatLng _pickupLatLng = const LatLng(22.5735, 88.4331);

  // Default Vehicle
  final VehicleEntity _vehicle = const VehicleEntity(
    id: 'veh_01',
    ownerId: 'usr_01',
    make: 'Hyundai',
    model: 'Creta SX',
    year: 2023,
    registrationNumber: 'WB 02 AM 4892',
    transmission: TransmissionType.automatic,
    fuelType: FuelType.petrol,
  );

  // Driver Brief
  DriverBriefEntity _driverBrief = const DriverBriefEntity();

  // Booking Flow State: 0 = idle, 1 = searching, 2 = matched
  int _bookingState = 0;
  final String _startCode = '4829';

  @override
  void initState() {
    super.initState();
  }

  void _startSearching() {
    setState(() => _bookingState = 1);
    // In demo flow, match verified driver after 3.5s
    Future.delayed(const Duration(milliseconds: 3500), () {
      if (mounted) {
        setState(() => _bookingState = 2);
      }
    });
  }

  void _cancelBooking() {
    setState(() => _bookingState = 0);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final durationHours = (_endHour - _startHour).clamp(1.0, 16.0);

    final fare = FareCalculator.calculate(
      durationHours: durationHours,
      startDateTime: DateTime.now().copyWith(hour: _startHour.toInt()),
      isOutstation: _selectedTripType == TripType.outstation,
    );

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.surface,
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: SafarColors.signalYellow,
                border: Border.all(color: SafarColors.ink, width: 1.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Center(
                child: SafarIcon(SafarIconType.steeringWheel, size: 16, color: SafarColors.ink),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Safar',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: SafarColors.paper,
                borderRadius: BorderRadius.circular(3),
                border: Border.all(color: SafarColors.rule),
              ),
              child: Text(
                'Kolkata',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const SafarIcon(SafarIconType.carSide, size: 20),
            onPressed: () {},
            tooltip: 'My Vehicles',
          ),
          IconButton(
            icon: const Icon(Icons.tune, color: SafarColors.ink, size: 20),
            onPressed: () {},
            tooltip: 'Driver Brief',
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isTablet = Breakpoints.isTablet(context);

          if (isTablet) {
            // Adaptive Two-Pane Layout for tablets and foldables
            return Row(
              children: [
                SizedBox(
                  width: Breakpoints.sidePaneWidth,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: SafarColors.surface,
                      border: Border(right: BorderSide(color: SafarColors.rule)),
                    ),
                    child: _buildBookingContent(theme, fare, durationHours),
                  ),
                ),
                Expanded(
                  child: _buildMapCanvas(),
                ),
              ],
            );
          }

          // Single Column Mobile View with Interactive DraggableScrollableSheet
          return Stack(
            children: [
              _buildMapCanvas(),

              // Bottom Sheet with Snap Heights
              DraggableScrollableSheet(
                initialChildSize: _bookingState == 0 ? 0.50 : 0.42,
                minChildSize: 0.25,
                maxChildSize: 0.90,
                snap: true,
                snapSizes: const [0.25, 0.50, 0.90],
                builder: (context, scrollController) {
                  return Container(
                    decoration: BoxDecoration(
                      color: SafarColors.surface,
                      borderRadius: SafarRadii.bottomSheet,
                      border: Border.all(color: SafarColors.rule),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x18000000),
                          blurRadius: 16,
                          offset: Offset(0, -4),
                        ),
                      ],
                    ),
                    child: SingleChildScrollView(
                      controller: scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: SafarSpacing.s20, vertical: SafarSpacing.s12),
                      child: _buildBookingContent(theme, fare, durationHours),
                    ),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMapCanvas() {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _pickupLatLng,
        initialZoom: 13.5,
        onTap: (tapPosition, point) {
          setState(() {
            _pickupLatLng = point;
          });
        },
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
            // Pickup Marker: ink dot with white outline
            Marker(
              point: _pickupLatLng,
              width: 24,
              height: 24,
              child: Container(
                decoration: BoxDecoration(
                  color: SafarColors.ink,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2.5),
                  boxShadow: const [
                    BoxShadow(color: Color(0x33000000), blurRadius: 4, offset: Offset(0, 2)),
                  ],
                ),
              ),
            ),
            // Nearby Driver Marker
            Marker(
              point: const LatLng(22.5745, 88.4345),
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
    );
  }

  Widget _buildBookingContent(ThemeData theme, FareBreakdown fare, double durationHours) {
    if (_bookingState == 1) {
      // Searching State with Pulsing Radar
      return Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(color: SafarColors.rule, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: SafarSpacing.s20),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: SafarColors.signalYellow.withOpacity(0.2),
              border: Border.all(color: SafarColors.signalYellow, width: 2),
            ),
            child: const Center(
              child: SafarIcon(SafarIconType.steeringWheel, size: 28, color: SafarColors.ink),
            ),
          ),
          const SizedBox(height: SafarSpacing.s16),
          Text('Broadcasting Request...', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text(
            'Locating verified drivers within 5 km of $_pickupArea',
            style: theme.textTheme.bodyMedium?.copyWith(color: SafarColors.mutedText),
          ),
          const SizedBox(height: SafarSpacing.s24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: SafarColors.alertRed),
                foregroundColor: SafarColors.alertRed,
                shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
              ),
              onPressed: _cancelBooking,
              child: const Text('Cancel Request', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      );
    }

    if (_bookingState == 2) {
      // Driver Matched State with OTP Token and Status Rail
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(color: SafarColors.rule, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: SafarSpacing.s12),
          const StatusRail(currentStep: RideProgressStep.assigned),
          const SizedBox(height: SafarSpacing.s16),

          // Driver matched card
          Container(
            padding: const EdgeInsets.all(SafarSpacing.s12),
            decoration: BoxDecoration(
              color: SafarColors.surface,
              borderRadius: SafarRadii.card,
              border: Border.all(color: SafarColors.rule),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: Image.network(
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: SafarSpacing.s12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text('Subhashish Das', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: SafarColors.deepGreen,
                              borderRadius: BorderRadius.circular(3),
                            ),
                            child: const Text(
                              'Verified',
                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const SafarIcon(SafarIconType.star, size: 12, color: SafarColors.signalYellow),
                          const SizedBox(width: 3),
                          const Text('4.92 • 840 trips • 9 yrs exp', style: TextStyle(fontSize: 11, color: SafarColors.mutedText)),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: SafarColors.paper,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: SafarColors.rule),
                  ),
                  child: const Center(child: SafarIcon(SafarIconType.phone, size: 18)),
                ),
              ],
            ),
          ),
          const SizedBox(height: SafarSpacing.s16),

          // Start Code Token Box
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(SafarSpacing.s16),
            decoration: BoxDecoration(
              color: SafarColors.paper,
              borderRadius: SafarRadii.card,
              border: Border.all(color: SafarColors.ink),
            ),
            child: Column(
              children: [
                Text(
                  'Trip Start Code',
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontFamily: 'IBM Plex Mono',
                    color: SafarColors.mutedText,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Share this 4-digit code with your driver on arrival',
                  style: TextStyle(fontSize: 12, color: SafarColors.ink),
                ),
                const SizedBox(height: SafarSpacing.s12),
                StartCodeToken(code: _startCode),
              ],
            ),
          ),
        ],
      );
    }

    // Default Booking Form with Signature Time Block Scrubber & Ledger
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(color: SafarColors.rule, borderRadius: BorderRadius.circular(2)),
          ),
        ),
        const SizedBox(height: SafarSpacing.s12),

        // Selected Vehicle Card
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: SafarColors.paper,
            borderRadius: SafarRadii.card,
            border: Border.all(color: SafarColors.rule),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Row(
                children: [
                  const SafarIcon(SafarIconType.carSide, size: 20),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${_vehicle.make} ${_vehicle.model}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      Text(
                        '${_vehicle.registrationNumber} • ${_vehicle.transmission.name.toUpperCase()}',
                        style: const TextStyle(fontFamily: 'IBM Plex Mono', fontSize: 10, color: SafarColors.mutedText),
                      ),
                    ],
                  ),
                ],
              ),
              const Text('Change', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, decoration: TextDecoration.underline)),
            ],
          ),
        ),
        const SizedBox(height: SafarSpacing.s16),

        // Pickup Location Row
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.only(top: 2),
              child: SafarIcon(SafarIconType.pin, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Pickup Address', style: theme.textTheme.bodySmall),
                  Text(_pickupAddress, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: SafarSpacing.s16),

        // Signature Time Block Scrubber (24h)
        TimeBlockScrubber(
          startHour: _startHour,
          endHour: _endHour,
          onStartChanged: (s) => setState(() => _startHour = s),
          onEndChanged: (e) => setState(() => _endHour = e),
        ),
        const SizedBox(height: SafarSpacing.s16),

        // Fare Estimate Ledger Breakdown
        Text('Fare Estimate', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: SafarSpacing.s8),

        SafarLedgerRow(
          label: 'Base Rate (${durationHours.toStringAsFixed(1)}h × ₹180)',
          value: FareCalculator.formatRupee(fare.baseFare),
        ),
        if (fare.nightSurcharge > 0)
          SafarLedgerRow(
            label: 'Night Surcharge (10 PM to 6 AM)',
            value: FareCalculator.formatRupee(fare.nightSurcharge),
          ),
        SafarLedgerRow(
          label: 'Platform & Safety Fee',
          value: FareCalculator.formatRupee(fare.platformFee),
        ),
        SafarLedgerRow(
          label: 'Total Estimated Fare',
          value: FareCalculator.formatRupee(fare.totalFare),
          isBold: true,
        ),

        const SizedBox(height: SafarSpacing.s20),

        // Confirm & Find Driver Button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: SafarColors.ink,
              foregroundColor: SafarColors.surface,
              shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
            ),
            onPressed: _startSearching,
            child: Text(
              'Find a driver (${FareCalculator.formatRupee(fare.totalFare)})',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
          ),
        ),
      ],
    );
  }
}
