import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { ActionBarItem } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { useI18n } from 'agora-common-libs';

export const Record = observer(() => {
  const {
    statusBarUIStore: { isRecordStoped },
    layoutUIStore: { addDialog },
    actionBarUIStore: { startRecording, stopRecording },
  } = useStore();
  const transI18n = useI18n();
  const colors = themeVal('colors');
  const handleRecord = () => {
    if (isRecordStoped) {
      addDialog('confirm', {
        title: transI18n('fcr_record_label_recording'),
        content: transI18n('fcr_record_start'),
        cancelText: transI18n('fcr_record_button_confirm_cancel'),
        okText: transI18n('fcr_record_start_confirm_ok'),
        onOk: startRecording,
      });
    } else {
      addDialog('confirm', {
        title: transI18n('fcr_record_label_recording'),
        content: transI18n('fcr_record_stop'),
        cancelText: transI18n('fcr_record_button_confirm_cancel'),
        okText: transI18n('fcr_record_stop_confirm_ok'),
        okButtonProps: { styleType: 'danger' },
        onOk: stopRecording,
      });
    }
  };
  const icon = isRecordStoped ? SvgIconEnum.FCR_RECORDING_ON : SvgIconEnum.FCR_RECORDING_STOP;
  const iconColor = isRecordStoped ? colors['icon-1'] : colors['red']['6'];
  const tooltip = isRecordStoped
    ? transI18n('fcr_room_tips_start_record')
    : transI18n('fcr_room_tips_stop_record');
  const text = isRecordStoped
    ? transI18n('fcr_room_button_record')
    : transI18n('fcr_room_button_recording');

  return (
    <ToolTip content={tooltip}>
      <ActionBarItem
        onClick={handleRecord}
        icon={{
          type: icon,
          colors: { iconPrimary: iconColor },
        }}
        text={text}></ActionBarItem>
    </ToolTip>
  );
});
