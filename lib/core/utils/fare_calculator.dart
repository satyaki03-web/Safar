import 'package:intl/intl.dart';

class FareBreakdown {
  final int hourlyRate;
  final double hours;
  final int baseFare;
  final int nightSurcharge;
  final int outstationAllowance;
  final int platformFee;
  final int totalFare;

  const FareBreakdown({
    required this.hourlyRate,
    required this.hours,
    required this.baseFare,
    required this.nightSurcharge,
    required this.outstationAllowance,
    required this.platformFee,
    required this.totalFare,
  });

  Map<String, dynamic> toJson() => {
        'hourlyRate': hourlyRate,
        'hours': hours,
        'baseFare': baseFare,
        'nightSurcharge': nightSurcharge,
        'outstationAllowance': outstationAllowance,
        'platformFee': platformFee,
        'totalFare': totalFare,
      };

  factory FareBreakdown.fromJson(Map<String, dynamic> json) => FareBreakdown(
        hourlyRate: (json['hourlyRate'] as num).toInt(),
        hours: (json['hours'] as num).toDouble(),
        baseFare: (json['baseFare'] as num).toInt(),
        nightSurcharge: (json['nightSurcharge'] as num).toInt(),
        outstationAllowance: (json['outstationAllowance'] as num).toInt(),
        platformFee: (json['platformFee'] as num).toInt(),
        totalFare: (json['totalFare'] as num).toInt(),
      );
}

class FareCalculator {
  static const int baseHourlyRate = 180;
  static const int nightSurchargeFlat = 250;
  static const int outstationDailyAllowance = 500;
  static const int platformFee = 40;

  /// Computes fare breakdown accurately.
  /// Night window: 10 PM (22:00) to 6 AM (06:00).
  static FareBreakdown calculate({
    required double durationHours,
    required DateTime startDateTime,
    bool isOutstation = false,
    int outstationDays = 1,
  }) {
    final baseFare = (durationHours * baseHourlyRate).round();

    // Check if trip start or duration intersects with 22:00 - 06:00
    bool touchesNight = false;
    final endDateTime = startDateTime.add(Duration(minutes: (durationHours * 60).round()));

    DateTime cursor = startDateTime;
    while (cursor.isBefore(endDateTime)) {
      final hour = cursor.hour;
      if (hour >= 22 || hour < 6) {
        touchesNight = true;
        break;
      }
      cursor = cursor.add(const Duration(minutes: 30));
    }

    final nightSurcharge = touchesNight ? nightSurchargeFlat : 0;
    final outstationFee = isOutstation ? (outstationDays * outstationDailyAllowance) : 0;
    final total = baseFare + nightSurcharge + outstationFee + platformFee;

    return FareBreakdown(
      hourlyRate: baseHourlyRate,
      hours: durationHours,
      baseFare: baseFare,
      nightSurcharge: nightSurcharge,
      outstationAllowance: outstationFee,
      platformFee: platformFee,
      totalFare: total,
    );
  }

  /// Format Indian Rupee currency with Indian numbering system (e.g. ₹1,450)
  static String formatRupee(num amount) {
    final format = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return format.format(amount);
  }

  /// Format 12-hour IST time
  static String formatTimeIST(DateTime date) {
    final format = DateFormat('hh:mm a');
    return '${format.format(date)} IST';
  }

  /// Format Indian date (e.g. 07 Nov 2026)
  static String formatDateIN(DateTime date) {
    final format = DateFormat('dd MMM yyyy');
    return format.format(date);
  }
}
