import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { ActionBarItem } from '..';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';

export const Setting = () => {
  const transI18n = useI18n();
  const {
    deviceSettingUIStore: { setDeviceSettingDialogVisible },
  } = useStore();
  const actionClickHandler = (action: 'settings') => {
    return () => {
      switch (action) {
        case 'settings':
          setDeviceSettingDialogVisible(true);
          break;
      }
    };
  };
  return (
    <ToolTip content={transI18n('fcr_room_button_setting')}>
      <ActionBarItem
        icon={SvgIconEnum.FCR_SETTING}
        text={transI18n('fcr_room_button_setting')}
        onClick={actionClickHandler('settings')}></ActionBarItem>
    </ToolTip>
  );
};
