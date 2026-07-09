import '../db/app_database.dart';
import '../models/setting.dart';

class SettingRepository {
  Future<AppSetting> get() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('setting', where: 'id = 1');
    if (rows.isEmpty) {
      await db.insert('setting', AppSetting().toMap());
      return AppSetting();
    }
    return AppSetting.fromMap(rows.first);
  }

  Future<void> save(AppSetting setting) async {
    final db = await AppDatabase.instance.database;
    final map = setting.toMap();
    final count = await db.update('setting', map, where: 'id = 1');
    if (count == 0) {
      await db.insert('setting', map);
    }
  }
}
