import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/root_screen.dart';
import 'services/session_state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KasirMobileApp());
}

class KasirMobileApp extends StatelessWidget {
  const KasirMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SessionState(),
      child: MaterialApp(
        title: 'Kasir Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorSchemeSeed: Colors.indigo,
          useMaterial3: true,
        ),
        home: const RootScreen(),
      ),
    );
  }
}
