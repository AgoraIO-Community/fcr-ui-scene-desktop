import { enUs } from './utils/i18n/enUs';
import { zhCn } from './utils/i18n/zhCn';

declare global {
  type I18nResouceTypes = typeof enUs | typeof zhCn;
}
