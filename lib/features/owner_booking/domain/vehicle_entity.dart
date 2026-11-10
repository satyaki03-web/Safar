enum TransmissionType { manual, automatic }
enum FuelType { petrol, diesel, cng, ev }

class VehicleEntity {
  final String id;
  final String ownerId;
  final String make;
  final String model;
  final int year;
  final String registrationNumber; // Must match WB registration regex
  final TransmissionType transmission;
  final FuelType fuelType;

  const VehicleEntity({
    required this.id,
    required this.ownerId,
    required this.make,
    required this.model,
    required this.year,
    required this.registrationNumber,
    required this.transmission,
    required this.fuelType,
  });

  /// Validates standard West Bengal vehicle registration format: WB 02 AB 1234
  static bool isValidWBRegistration(String reg) {
    final cleaned = reg.trim().toUpperCase().replaceAll(RegExp(r'\s+'), ' ');
    final regex = RegExp(r'^WB\s?[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{4}$');
    return regex.hasMatch(cleaned);
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ownerId': ownerId,
        'make': make,
        'model': model,
        'year': year,
        'registrationNumber': registrationNumber,
        'transmission': transmission.name,
        'fuelType': fuelType.name,
      };

  factory VehicleEntity.fromJson(Map<String, dynamic> json) => VehicleEntity(
        id: json['id'] as String,
        ownerId: json['ownerId'] as String,
        make: json['make'] as String,
        model: json['model'] as String,
        year: (json['year'] as num).toInt(),
        registrationNumber: json['registrationNumber'] as String,
        transmission: TransmissionType.values.byName(json['transmission'] as String),
        fuelType: FuelType.values.byName(json['fuelType'] as String),
      );
}
