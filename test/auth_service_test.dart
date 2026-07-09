import 'package:flutter_test/flutter_test.dart';

import 'package:kasir_mobile/services/auth_service.dart';

void main() {
  group('AuthService password hashing', () {
    test('verify succeeds for the correct password', () {
      const salt = 'somesalt';
      final hash = AuthService.hash('rahasia123', salt);
      expect(AuthService.verify('rahasia123', salt, hash), isTrue);
    });

    test('verify fails for the wrong password', () {
      const salt = 'somesalt';
      final hash = AuthService.hash('rahasia123', salt);
      expect(AuthService.verify('salahpassword', salt, hash), isFalse);
    });

    test('same password with different salts produces different hashes', () {
      final hashA = AuthService.hash('rahasia123', 'saltA');
      final hashB = AuthService.hash('rahasia123', 'saltB');
      expect(hashA, isNot(equals(hashB)));
    });
  });
}
