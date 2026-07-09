import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:kasir_mobile/screens/root_screen.dart';
import 'package:kasir_mobile/services/session_state.dart';

import 'test_helper.dart';

void main() {
  late String dbPath;

  setUp(() async {
    dbPath = await setUpTestDatabase();
  });

  tearDown(() async {
    await tearDownTestDatabase(dbPath);
  });

  testWidgets('fresh install shows the create-owner screen, not login', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => SessionState(),
        child: const MaterialApp(home: RootScreen()),
      ),
    );
    // sqflite_common_ffi talks to a real background isolate, which the fake
    // async clock behind pumpAndSettle never lets finish — break out to the
    // real event loop briefly, then do a single real pump.
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
    await tester.pump();

    expect(find.text('Buat Akun Owner'), findsOneWidget);
    expect(find.text('Masuk'), findsNothing);
  });
}
