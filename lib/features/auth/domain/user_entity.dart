enum UserRole { owner, driver, both }

class UserEntity {
  final String uid;
  final String name;
  final String phone;
  final UserRole role;
  final UserRole activeRole;
  final String? avatarUrl;
  final DateTime createdAt;

  const UserEntity({
    required this.uid,
    required this.name,
    required this.phone,
    required this.role,
    required this.activeRole,
    this.avatarUrl,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'name': name,
        'phone': phone,
        'role': role.name,
        'activeRole': activeRole.name,
        'avatarUrl': avatarUrl,
        'createdAt': createdAt.toIso8601String(),
      };

  factory UserEntity.fromJson(Map<String, dynamic> json) => UserEntity(
        uid: json['uid'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String,
        role: UserRole.values.byName(json['role'] as String),
        activeRole: UserRole.values.byName(json['activeRole'] as String? ?? json['role'] as String),
        avatarUrl: json['avatarUrl'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
