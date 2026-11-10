import 'package:flutter_test/flutter_test.dart';
import 'package:safar/features/owner_booking/domain/ride_state_machine.dart';

void main() {
  group('Ride State Machine Transitions', () {
    test('Initial looking_for_driver can legally transition to driver_assigned', () {
      const initial = LookingForDriverState();
      const next = DriverAssignedState();

      expect(initial.canTransitionTo(next), isTrue);
      final transitioned = initial.transitionTo(next);
      expect(transitioned, isA<DriverAssignedState>());
    });

    test('looking_for_driver can transition to cancelled_by_owner or expired', () {
      const initial = LookingForDriverState();
      expect(initial.canTransitionTo(const CancelledByOwnerState()), isTrue);
      expect(initial.canTransitionTo(const ExpiredState()), isTrue);
    });

    test('Illegal leapfrog transition throws StateError', () {
      const initial = LookingForDriverState();
      const illegalHop = CompletedState();

      expect(initial.canTransitionTo(illegalHop), isFalse);
      expect(() => initial.transitionTo(illegalHop), throwsStateError);
    });

    test('driver_assigned -> driver_en_route -> driver_arrived -> ride_active -> completed sequence', () {
      RideState state = const LookingForDriverState();

      state = state.transitionTo(const DriverAssignedState());
      expect(state, isA<DriverAssignedState>());

      state = state.transitionTo(const DriverEnRouteState());
      expect(state, isA<DriverEnRouteState>());

      state = state.transitionTo(const DriverArrivedState());
      expect(state, isA<DriverArrivedState>());

      state = state.transitionTo(const RideActiveState());
      expect(state, isA<RideActiveState>());

      state = state.transitionTo(const CompletedState());
      expect(state, isA<CompletedState>());
      expect(state.isTerminal, isTrue);
    });

    test('Terminal completed state cannot transition anywhere', () {
      const completed = CompletedState();
      expect(completed.isTerminal, isTrue);
      expect(completed.canTransitionTo(const RideActiveState()), isFalse);
      expect(() => completed.transitionTo(const RideActiveState()), throwsStateError);
    });
  });
}
