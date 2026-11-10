import '../../../core/utils/fare_calculator.dart';
import 'driver_brief_entity.dart';
import 'ride_state_machine.dart';
import 'vehicle_entity.dart';

enum TripType { commute, eveningOut, outstation, airport }

class LocationCoordinate {
  final String address;
  final String area;
  final double lat;
  final double lng;

  const LocationCoordinate({
    required this.address,
    required this.area,
    required this.lat,
    required this.lng,
  });

  Map<String, dynamic> toJson() => {
        'address': address,
        'area': area,
        'lat': lat,
        'lng': lng,
      };

  factory LocationCoordinate.fromJson(Map<String, dynamic> json) => LocationCoordinate(
        address: json['address'] as String,
        area: json['area'] as String,
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
      );
}

class RideEntity {
  final String id;
  final String ownerId;
  final String ownerName;
  final String ownerPhone;
  final String? driverId;
  final String? driverName;
  final String? driverPhone;
  final String? driverPhotoUrl;
  final double? driverRating;
  final int? driverTripsCompleted;
  final VehicleEntity vehicle;
  final LocationCoordinate pickupLocation;
  final LocationCoordinate? destinationLocation;
  final TripType tripType;
  final DateTime startDateTime;
  final double durationHours;
  final int outstationDays;
  final DriverBriefEntity driverBrief;
  final FareBreakdown fare;
  final String statusKey;
  final String startOtpCode; // 4-digit code e.g. "4829"
  final LocationCoordinate? driverCurrentLocation;
  final int? etaMinutes;
  final DateTime? tripStartedAt;
  final DateTime? tripCompletedAt;
  final String paymentStatus; // 'pending' | 'paid'
  final DateTime createdAt;

  const RideEntity({
    required this.id,
    required this.ownerId,
    required this.ownerName,
    required this.ownerPhone,
    this.driverId,
    this.driverName,
    this.driverPhone,
    this.driverPhotoUrl,
    this.driverRating,
    this.driverTripsCompleted,
    required this.vehicle,
    required this.pickupLocation,
    this.destinationLocation,
    required this.tripType,
    required this.startDateTime,
    required this.durationHours,
    this.outstationDays = 1,
    required this.driverBrief,
    required this.fare,
    required this.statusKey,
    required this.startOtpCode,
    this.driverCurrentLocation,
    this.etaMinutes,
    this.tripStartedAt,
    this.tripCompletedAt,
    this.paymentStatus = 'pending',
    required this.createdAt,
  });

  RideState get state => RideState.fromKey(statusKey);

  Map<String, dynamic> toJson() => {
        'id': id,
        'ownerId': ownerId,
        'ownerName': ownerName,
        'ownerPhone': ownerPhone,
        'driverId': driverId,
        'driverName': driverName,
        'driverPhone': driverPhone,
        'driverPhotoUrl': driverPhotoUrl,
        'driverRating': driverRating,
        'driverTripsCompleted': driverTripsCompleted,
        'vehicle': vehicle.toJson(),
        'pickupLocation': pickupLocation.toJson(),
        'destinationLocation': destinationLocation?.toJson(),
        'tripType': tripType.name,
        'startDateTime': startDateTime.toIso8601String(),
        'durationHours': durationHours,
        'outstationDays': outstationDays,
        'driverBrief': driverBrief.toJson(),
        'fare': fare.toJson(),
        'statusKey': statusKey,
        'startOtpCode': startOtpCode,
        'driverCurrentLocation': driverCurrentLocation?.toJson(),
        'etaMinutes': etaMinutes,
        'tripStartedAt': tripStartedAt?.toIso8601String(),
        'tripCompletedAt': tripCompletedAt?.toIso8601String(),
        'paymentStatus': paymentStatus,
        'createdAt': createdAt.toIso8601String(),
      };

  factory RideEntity.fromJson(Map<String, dynamic> json) => RideEntity(
        id: json['id'] as String,
        ownerId: json['ownerId'] as String,
        ownerName: json['ownerName'] as String,
        ownerPhone: json['ownerPhone'] as String,
        driverId: json['driverId'] as String?,
        driverName: json['driverName'] as String?,
        driverPhone: json['driverPhone'] as String?,
        driverPhotoUrl: json['driverPhotoUrl'] as String?,
        driverRating: (json['driverRating'] as num?)?.toDouble(),
        driverTripsCompleted: (json['driverTripsCompleted'] as num?)?.toInt(),
        vehicle: VehicleEntity.fromJson(json['vehicle'] as Map<String, dynamic>),
        pickupLocation: LocationCoordinate.fromJson(json['pickupLocation'] as Map<String, dynamic>),
        destinationLocation: json['destinationLocation'] != null
            ? LocationCoordinate.fromJson(json['destinationLocation'] as Map<String, dynamic>)
            : null,
        tripType: TripType.values.byName(json['tripType'] as String),
        startDateTime: DateTime.parse(json['startDateTime'] as String),
        durationHours: (json['durationHours'] as num).toDouble(),
        outstationDays: (json['outstationDays'] as num? ?? 1).toInt(),
        driverBrief: DriverBriefEntity.fromJson(json['driverBrief'] as Map<String, dynamic>),
        fare: FareBreakdown.fromJson(json['fare'] as Map<String, dynamic>),
        statusKey: json['statusKey'] as String,
        startOtpCode: json['startOtpCode'] as String,
        driverCurrentLocation: json['driverCurrentLocation'] != null
            ? LocationCoordinate.fromJson(json['driverCurrentLocation'] as Map<String, dynamic>)
            : null,
        etaMinutes: (json['etaMinutes'] as num?)?.toInt(),
        tripStartedAt: json['tripStartedAt'] != null ? DateTime.parse(json['tripStartedAt'] as String) : null,
        tripCompletedAt:
            json['tripCompletedAt'] != null ? DateTime.parse(json['tripCompletedAt'] as String) : null,
        paymentStatus: json['paymentStatus'] as String? ?? 'pending',
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
