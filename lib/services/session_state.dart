import 'package:flutter/foundation.dart';

import '../models/user.dart';

/// App-wide current-user session. Only one user session is active on the
/// device at a time; switching users requires logout then login.
class SessionState extends ChangeNotifier {
  AppUser? _currentUser;

  AppUser? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  bool get isKasir => _currentUser?.role == 'kasir';
  bool get isAdmin => _currentUser?.role == 'admin';
  bool get isOwner => _currentUser?.role == 'owner';

  /// Kasir role: KASIR screen only. Admin/Owner: everything.
  bool get canAccessOtherModules => isAdmin || isOwner;

  void login(AppUser user) {
    _currentUser = user;
    notifyListeners();
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }
}
