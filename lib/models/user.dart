class AppUser {
  final int? id;
  final String username;
  final String passwordHash;
  final String passwordSalt;
  final String nama;
  final String role; // kasir | admin | owner
  final bool active;

  AppUser({
    this.id,
    required this.username,
    required this.passwordHash,
    required this.passwordSalt,
    required this.nama,
    required this.role,
    this.active = true,
  });

  factory AppUser.fromMap(Map<String, Object?> map) => AppUser(
        id: map['id'] as int?,
        username: map['username'] as String,
        passwordHash: map['password_hash'] as String,
        passwordSalt: map['password_salt'] as String,
        nama: map['nama'] as String,
        role: map['role'] as String,
        active: (map['active'] as int) == 1,
      );

  Map<String, Object?> toMap() => {
        if (id != null) 'id': id,
        'username': username,
        'password_hash': passwordHash,
        'password_salt': passwordSalt,
        'nama': nama,
        'role': role,
        'active': active ? 1 : 0,
      };

  AppUser copyWith({
    int? id,
    String? username,
    String? passwordHash,
    String? passwordSalt,
    String? nama,
    String? role,
    bool? active,
  }) =>
      AppUser(
        id: id ?? this.id,
        username: username ?? this.username,
        passwordHash: passwordHash ?? this.passwordHash,
        passwordSalt: passwordSalt ?? this.passwordSalt,
        nama: nama ?? this.nama,
        role: role ?? this.role,
        active: active ?? this.active,
      );
}
