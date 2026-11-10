import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/app_providers.dart';
import '../../features/auth/domain/user_entity.dart';

// Screens
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/role_choice_screen.dart';
import '../../features/owner_booking/presentation/screens/owner_home_screen.dart';
import '../../features/driver_requests/presentation/screens/driver_home_screen.dart';
import '../../features/active_trip/presentation/screens/active_trip_screen.dart';
import '../../features/receipt/presentation/screens/receipt_screen.dart';
import '../../features/earnings/presentation/screens/driver_earnings_screen.dart';
import '../../features/history/presentation/screens/trip_history_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';

GoRouter createSafarRouter({UserEntity? user}) {
  return GoRouter(
    initialLocation: user == null ? '/splash' : (user.activeRole == UserRole.driver ? '/driver' : '/owner'),
    redirect: (BuildContext context, GoRouterState state) {
      final isAuthFlow = state.matchedLocation.startsWith('/splash') ||
          state.matchedLocation.startsWith('/auth');

      if (user == null) {
        return isAuthFlow ? null : '/splash';
      }

      // If user is authenticated and lands on splash, redirect based on activeRole
      if (isAuthFlow) {
        return user.activeRole == UserRole.driver ? '/driver' : '/owner';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/auth/role-choice',
        builder: (context, state) => const RoleChoiceScreen(),
      ),
      GoRoute(
        path: '/owner',
        builder: (context, state) => const OwnerHomeScreen(),
      ),
      GoRoute(
        path: '/driver',
        builder: (context, state) => const DriverHomeScreen(),
      ),
      GoRoute(
        path: '/active-trip/:id',
        builder: (context, state) {
          final rideId = state.pathParameters['id'] ?? '';
          return ActiveTripScreen(rideId: rideId);
        },
      ),
      GoRoute(
        path: '/receipt/:id',
        builder: (context, state) {
          final rideId = state.pathParameters['id'] ?? '';
          return ReceiptScreen(rideId: rideId);
        },
      ),
      GoRoute(
        path: '/earnings',
        builder: (context, state) => const DriverEarningsScreen(),
      ),
      GoRoute(
        path: '/history',
        builder: (context, state) => const TripHistoryScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
}
