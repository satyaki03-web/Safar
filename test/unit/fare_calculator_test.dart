import 'package:flutter_test/flutter_test.dart';
import 'package:safar/core/utils/fare_calculator.dart';

void main() {
  group('FareCalculator Logic', () {
    test('Calculates daytime standard commute fare without night surcharge', () {
      final daytime = DateTime(2026, 11, 7, 10, 0); // 10:00 AM
      final fare = FareCalculator.calculate(
        durationHours: 4.0,
        startDateTime: daytime,
      );

      expect(fare.hourlyRate, equals(180));
      expect(fare.hours, equals(4.0));
      expect(fare.baseFare, equals(720)); // 4 * 180
      expect(fare.nightSurcharge, equals(0));
      expect(fare.platformFee, equals(40));
      expect(fare.totalFare, equals(760)); // 720 + 40
    });

    test('Applies night surcharge when trip begins after 10:00 PM', () {
      final nightTime = DateTime(2026, 11, 7, 23, 0); // 11:00 PM
      final fare = FareCalculator.calculate(
        durationHours: 3.0,
        startDateTime: nightTime,
      );

      expect(fare.baseFare, equals(540)); // 3 * 180
      expect(fare.nightSurcharge, equals(250)); // Flat ₹250
      expect(fare.platformFee, equals(40));
      expect(fare.totalFare, equals(830)); // 540 + 250 + 40
    });

    test('Includes outstation driver allowance per day', () {
      final dayTime = DateTime(2026, 11, 7, 8, 0);
      final fare = FareCalculator.calculate(
        durationHours: 8.0,
        startDateTime: dayTime,
        isOutstation: true,
        outstationDays: 2,
      );

      expect(fare.baseFare, equals(1440)); // 8 * 180
      expect(fare.outstationAllowance, equals(1000)); // 2 * 500
      expect(fare.platformFee, equals(40));
      expect(fare.totalFare, equals(2480)); // 1440 + 1000 + 40
    });

    test('Formats Indian Rupees with standard lakh/crore commas', () {
      expect(FareCalculator.formatRupee(180), equals('₹180'));
      expect(FareCalculator.formatRupee(1450), equals('₹1,450'));
      expect(FareCalculator.formatRupee(125000), equals('₹1,25,000'));
    });
  });
}
