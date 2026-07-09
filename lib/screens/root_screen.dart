import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import 'login_screen.dart';
import 'onboarding/create_owner_screen.dart';

/// Decides whether to show the first-run "create Owner account" screen
/// (fresh install, empty user table) or the normal login screen.
class RootScreen extends StatefulWidget {
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  late Future<bool> _hasUserFuture;

  @override
  void initState() {
    super.initState();
    _hasUserFuture = AuthService().hasAnyUser();
  }

  void _refresh() {
    setState(() {
      _hasUserFuture = AuthService().hasAnyUser();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _hasUserFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (snapshot.data == true) {
          return const LoginScreen();
        }
        return CreateOwnerScreen(onDone: _refresh);
      },
    );
  }
}
