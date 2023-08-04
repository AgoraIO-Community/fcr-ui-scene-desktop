import { enUs } from './resources/translations/enUs';
import { zhCn } from './resources/translations/zhCn';

declare global {
  type I18nResouceTypes = typeof enUs | typeof zhCn;
}
