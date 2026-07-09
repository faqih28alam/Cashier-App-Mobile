import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';

import '../models/user.dart';
import '../repositories/user_repository.dart';

class InvalidCredentialsException implements Exception {
  @override
  String toString() => 'Username atau password salah';
}

class InactiveUserException implements Exception {
  @override
  String toString() => 'Akun tidak aktif';
}

class AuthService {
  final UserRepository _userRepo;
  AuthService({UserRepository? userRepo}) : _userRepo = userRepo ?? UserRepository();

  static String _randomSalt() {
    final rand = Random.secure();
    final bytes = List<int>.generate(16, (_) => rand.nextInt(256));
    return base64Url.encode(bytes);
  }

  static String hash(String password, String salt) {
    return sha256.convert(utf8.encode('$salt:$password')).toString();
  }

  static bool verify(String password, String salt, String expectedHash) {
    return hash(password, salt) == expectedHash;
  }

  Future<bool> hasAnyUser() async {
    return (await _userRepo.countUsers()) > 0;
  }

  Future<AppUser> createUser({
    required String username,
    required String password,
    required String nama,
    required String role,
    bool active = true,
  }) async {
    final salt = _randomSalt();
    final user = AppUser(
      username: username,
      passwordHash: hash(password, salt),
      passwordSalt: salt,
      nama: nama,
      role: role,
      active: active,
    );
    final id = await _userRepo.insert(user);
    return user.copyWith(id: id);
  }

  Future<void> changePassword(AppUser user, String newPassword) async {
    final salt = _randomSalt();
    await _userRepo.update(
      user.copyWith(passwordHash: hash(newPassword, salt), passwordSalt: salt),
    );
  }

  Future<AppUser> login(String username, String password) async {
    final user = await _userRepo.findByUsername(username);
    if (user == null || !verify(password, user.passwordSalt, user.passwordHash)) {
      throw InvalidCredentialsException();
    }
    if (!user.active) {
      throw InactiveUserException();
    }
    return user;
  }
}
