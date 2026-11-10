import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/domain/user_entity.dart';
import '../../features/owner_booking/data/booking_repository.dart';
import '../../features/owner_booking/domain/ride_entity.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return FirebaseAuthRepository();
});

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  return FirestoreBookingRepository();
});

/// Stream of authenticated User
final authStateProvider = StreamProvider<UserEntity?>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return repo.authStateChanges();
});

/// Active Ride ID state
final activeRideIdProvider = StateProvider<String?>((ref) => null);

/// Stream of active ride document
final activeRideStreamProvider = StreamProvider<RideEntity?>((ref) {
  final rideId = ref.watch(activeRideIdProvider);
  if (rideId == null) return Stream.value(null);
  final repo = ref.watch(bookingRepositoryProvider);
  return repo.watchActiveRide(rideId);
});

/// Stream of open dispatches for verified drivers
final availableDispatchesProvider = StreamProvider<List<RideEntity>>((ref) {
  final repo = ref.watch(bookingRepositoryProvider);
  return repo.watchAvailableDispatches();
});

/// Demo mode developer toggle
final demoModeProvider = StateProvider<bool>((ref) => false);
