import 'package:flutter/foundation.dart';

/// Sealed class hierarchy modeling the Safar Ride State Machine.
@immutable
sealed class RideState {
  final String statusKey;
  const RideState(this.statusKey);

  bool get isTerminal =>
      this is CompletedState ||
      this is CancelledByOwnerState ||
      this is CancelledByDriverState ||
      this is ExpiredState;

  static RideState fromKey(String key) {
    return switch (key) {
      'looking_for_driver' => const LookingForDriverState(),
      'driver_assigned' => const DriverAssignedState(),
      'driver_en_route' => const DriverEnRouteState(),
      'driver_arrived' => const DriverArrivedState(),
      'ride_active' => const RideActiveState(),
      'completed' => const CompletedState(),
      'cancelled_by_owner' => const CancelledByOwnerState(),
      'cancelled_by_driver' => const CancelledByDriverState(),
      'expired' => const ExpiredState(),
      _ => throw ArgumentError('Unknown ride state key: $key'),
    };
  }

  /// Single transition function that strictly validates legal moves.
  RideState transitionTo(RideState nextState) {
    if (canTransitionTo(nextState)) {
      return nextState;
    }
    throw StateError(
      'Illegal state transition from ${runtimeType.toString()} to ${nextState.runtimeType.toString()}',
    );
  }

  bool canTransitionTo(RideState nextState) {
    return switch (this) {
      LookingForDriverState() => switch (nextState) {
          DriverAssignedState() || CancelledByOwnerState() || ExpiredState() => true,
          _ => false,
        },
      DriverAssignedState() => switch (nextState) {
          DriverEnRouteState() || CancelledByOwnerState() || CancelledByDriverState() => true,
          _ => false,
        },
      DriverEnRouteState() => switch (nextState) {
          DriverArrivedState() || CancelledByOwnerState() || CancelledByDriverState() => true,
          _ => false,
        },
      DriverArrivedState() => switch (nextState) {
          RideActiveState() || CancelledByOwnerState() || CancelledByDriverState() => true,
          _ => false,
        },
      RideActiveState() => switch (nextState) {
          CompletedState() || CancelledByOwnerState() => true,
          _ => false,
        },
      // Terminal states cannot transition anywhere
      CompletedState() => false,
      CancelledByOwnerState() => false,
      CancelledByDriverState() => false,
      ExpiredState() => false,
    };
  }
}

class LookingForDriverState extends RideState {
  const LookingForDriverState() : super('looking_for_driver');
}

class DriverAssignedState extends RideState {
  const DriverAssignedState() : super('driver_assigned');
}

class DriverEnRouteState extends RideState {
  const DriverEnRouteState() : super('driver_en_route');
}

class DriverArrivedState extends RideState {
  const DriverArrivedState() : super('driver_arrived');
}

class RideActiveState extends RideState {
  const RideActiveState() : super('ride_active');
}

class CompletedState extends RideState {
  const CompletedState() : super('completed');
}

class CancelledByOwnerState extends RideState {
  const CancelledByOwnerState() : super('cancelled_by_owner');
}

class CancelledByDriverState extends RideState {
  const CancelledByDriverState() : super('cancelled_by_driver');
}

class ExpiredState extends RideState {
  const ExpiredState() : super('expired');
}
