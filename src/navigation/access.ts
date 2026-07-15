import {Role} from '../types';

export type ModuleKey =
  | 'KASIR'
  | 'PURCHAS'
  | 'KEUANGAN'
  | 'LAPORAN'
  | 'MASTER'
  | 'SETTING';

/**
 * Role/module permission matrix (spec requirement 10):
 * - Kasir: KASIR module only.
 * - Admin: all modules.
 * - Owner: all modules, plus the financial report specifically ("Owner ...
 *   + financial reports" implies Owner sees Laporan Keuangan; Admin sees
 *   the other LAPORAN reports but not that one).
 */
export const MODULE_ACCESS: Record<ModuleKey, Role[]> = {
  KASIR: ['kasir', 'admin', 'owner'],
  PURCHAS: ['admin', 'owner'],
  KEUANGAN: ['admin', 'owner'],
  LAPORAN: ['admin', 'owner'],
  MASTER: ['admin', 'owner'],
  SETTING: ['admin', 'owner'],
};

export function canAccessModule(role: Role, module: ModuleKey): boolean {
  return MODULE_ACCESS[module].includes(role);
}

/** Only Owner may view the finance report within LAPORAN. */
export function canViewFinanceReport(role: Role): boolean {
  return role === 'owner';
}
