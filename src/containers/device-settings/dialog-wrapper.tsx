import { useStore } from '@ui-scene/utils/hooks/use-store';
import { FC } from 'react';
import { DeviceSettings } from '.';
import { GlobalDialog } from '@components/dialog/global-dialog';
import { observer } from 'mobx-react';
import { useI18n } from 'agora-common-libs';

export const DeviceSettingsDialog: FC = observer(() => {
  const {
    deviceSettingUIStore: { deviceSettingDialogVisible, setDeviceSettingDialogVisible },
  } = useStore();
  const transI18n = useI18n();
  return (
    <GlobalDialog
      header={
        <div className="fcr-device-settings__dialog-title">
          {transI18n('fcr_room_tips_setting')}
        </div>
      }
      visible={deviceSettingDialogVisible}
      onClose={() => {
        setDeviceSettingDialogVisible(false);
      }}>
      <DeviceSettings></DeviceSettings>
    </GlobalDialog>
  );
});
