import 'package:cloud_firestore/cloud_firestore.dart';
import '../domain/ride_entity.dart';
import '../domain/ride_state_machine.dart';

abstract class BookingRepository {
  Future<String> createRide(RideEntity ride);
  Stream<RideEntity?> watchActiveRide(String rideId);
  Stream<List<RideEntity>> watchAvailableDispatches();
  Future<bool> driverAcceptRideTransaction({
    required String rideId,
    required String driverId,
    required String driverName,
    required String driverPhone,
    required String driverPhotoUrl,
    required double driverRating,
    required int driverTripsCompleted,
  });
  Future<void> updateDriverLocation(String rideId, double lat, double lng);
  Future<void> markDriverEnRoute(String rideId);
  Future<void> markDriverArrived(String rideId);
  Future<bool> verifyOtpAndStartTrip({required String rideId, required String enteredOtp});
  Future<void> completeTrip(String rideId);
  Future<void> cancelRide(String rideId, bool isOwner);
  Future<void> submitRating({
    required String rideId,
    required String raterId,
    required int score,
    String? note,
  });
}

class FirestoreBookingRepository implements BookingRepository {
  final FirebaseFirestore _firestore;

  FirestoreBookingRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  @override
  Future<String> createRide(RideEntity ride) async {
    final ref = _firestore.collection('rides').doc(ride.id);
    await ref.set(ride.toJson());
    return ride.id;
  }

  @override
  Stream<RideEntity?> watchActiveRide(String rideId) {
    return _firestore.collection('rides').doc(rideId).snapshots().map((doc) {
      if (!doc.exists || doc.data() == null) return null;
      return RideEntity.fromJson(doc.data()!);
    });
  }

  @override
  Stream<List<RideEntity>> watchAvailableDispatches() {
    return _firestore
        .collection('rides')
        .where('statusKey', isEqualTo: 'looking_for_driver')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => RideEntity.fromJson(doc.data())).toList();
    });
  }

  /// Critical: Firestore transaction guarantees that two drivers cannot accept the same ride.
  @override
  Future<bool> driverAcceptRideTransaction({
    required String rideId,
    required String driverId,
    required String driverName,
    required String driverPhone,
    required String driverPhotoUrl,
    required double driverRating,
    required int driverTripsCompleted,
  }) async {
    final rideRef = _firestore.collection('rides').doc(rideId);

    return await _firestore.runTransaction<bool>((transaction) async {
      final snapshot = await transaction.get(rideRef);
      if (!snapshot.exists) return false;

      final currentData = snapshot.data()!;
      final currentStatus = currentData['statusKey'] as String?;

      if (currentStatus != 'looking_for_driver') {
        // Already claimed by another driver
        return false;
      }

      transaction.update(rideRef, {
        'statusKey': 'driver_assigned',
        'driverId': driverId,
        'driverName': driverName,
        'driverPhone': driverPhone,
        'driverPhotoUrl': driverPhotoUrl,
        'driverRating': driverRating,
        'driverTripsCompleted': driverTripsCompleted,
        'etaMinutes': 6,
      });

      return true;
    });
  }

  @override
  Future<void> updateDriverLocation(String rideId, double lat, double lng) async {
    await _firestore.collection('rides').doc(rideId).update({
      'driverCurrentLocation': {
        'address': 'Kolkata en-route',
        'area': 'En-route',
        'lat': lat,
        'lng': lng,
      },
    });
  }

  @override
  Future<void> markDriverEnRoute(String rideId) async {
    await _firestore.collection('rides').doc(rideId).update({
      'statusKey': 'driver_en_route',
      'etaMinutes': 4,
    });
  }

  @override
  Future<void> markDriverArrived(String rideId) async {
    await _firestore.collection('rides').doc(rideId).update({
      'statusKey': 'driver_arrived',
      'etaMinutes': 0,
    });
  }

  @override
  Future<bool> verifyOtpAndStartTrip({
    required String rideId,
    required String enteredOtp,
  }) async {
    final doc = await _firestore.collection('rides').doc(rideId).get();
    if (!doc.exists) return false;

    final expectedOtp = doc.data()!['startOtpCode'] as String?;
    if (expectedOtp != enteredOtp.trim()) {
      return false;
    }

    await _firestore.collection('rides').doc(rideId).update({
      'statusKey': 'ride_active',
      'tripStartedAt': DateTime.now().toIso8601String(),
    });

    return true;
  }

  @override
  Future<void> completeTrip(String rideId) async {
    await _firestore.collection('rides').doc(rideId).update({
      'statusKey': 'completed',
      'tripCompletedAt': DateTime.now().toIso8601String(),
    });
  }

  @override
  Future<void> cancelRide(String rideId, bool isOwner) async {
    await _firestore.collection('rides').doc(rideId).update({
      'statusKey': isOwner ? 'cancelled_by_owner' : 'cancelled_by_driver',
    });
  }

  @override
  Future<void> submitRating({
    required String rideId,
    required String raterId,
    required int score,
    String? note,
  }) async {
    await _firestore.collection('ratings').add({
      'rideId': rideId,
      'raterId': raterId,
      'score': score.clamp(1, 5),
      'note': note,
      'createdAt': DateTime.now().toIso8601String(),
    });
  }
}
