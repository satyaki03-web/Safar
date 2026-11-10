enum AcPreference { full, eco, windowsOpen }
enum MusicPreference { silent, lowVolume, ownerChoice }

class DriverBriefEntity {
  final AcPreference acPreference;
  final MusicPreference musicPreference;
  final bool avoidHighways;
  final bool noPhoneCallsWhileDriving;
  final String? specialInstructions;

  const DriverBriefEntity({
    this.acPreference = AcPreference.eco,
    this.musicPreference = MusicPreference.lowVolume,
    this.avoidHighways = false,
    this.noPhoneCallsWhileDriving = true,
    this.specialInstructions,
  });

  Map<String, dynamic> toJson() => {
        'acPreference': acPreference.name,
        'musicPreference': musicPreference.name,
        'avoidHighways': avoidHighways,
        'noPhoneCallsWhileDriving': noPhoneCallsWhileDriving,
        'specialInstructions': specialInstructions,
      };

  factory DriverBriefEntity.fromJson(Map<String, dynamic> json) => DriverBriefEntity(
        acPreference: AcPreference.values.byName(json['acPreference'] as String? ?? 'eco'),
        musicPreference: MusicPreference.values.byName(json['musicPreference'] as String? ?? 'lowVolume'),
        avoidHighways: json['avoidHighways'] as bool? ?? false,
        noPhoneCallsWhileDriving: json['noPhoneCallsWhileDriving'] as bool? ?? true,
        specialInstructions: json['specialInstructions'] as String?,
      );
}
