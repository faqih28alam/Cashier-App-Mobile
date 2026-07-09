import 'package:flutter/material.dart';

/// Runs [action] and surfaces any failure (e.g. a local DB write error from
/// full phone storage) as a SnackBar instead of letting it disappear
/// silently. Returns whether it succeeded, so callers can skip a reload/pop
/// on failure.
Future<bool> runSafely(BuildContext context, Future<void> Function() action) async {
  try {
    await action();
    return true;
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal menyimpan: $e')));
    }
    return false;
  }
}
