import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { ActionBarItem } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { useI18n } from 'agora-common-libs';

export const Record = observer(() => {
  const transI18n = useI18n();
  const {
    statusBarUIStore: { isRecordStoped },
    layoutUIStore: { addDialog },
    actionBarUIStore: { startRecording, stopRecording },
  } = useStore();
  const colors = themeVal('colors');
  const handleRecord = () => {
    if (isRecordStoped) {
      addDialog('confirm', {
        title: 'Recording',
        content: 'Are you sure you want to start recording?',
        cancelText: 'Cancel',
        okText: 'Record',
        onOk: startRecording,
      });
    } else {
      addDialog('confirm', {
        title: 'Recording',
        content:
          'Are you sure you want to stop recording？\nThe recording file will be generated after the course ends and displayed on the course details page.',
        cancelText: 'Cancel',
        okText: 'Stop',
        onOk: stopRecording,
      });
    }
  };
  const icon = isRecordStoped ? SvgIconEnum.FCR_RECORDING_ON : SvgIconEnum.FCR_RECORDING_STOP;
  const iconColor = isRecordStoped ? colors['icon-1'] : colors['red']['6'];
  const tooltip = isRecordStoped
    ? transI18n('fcr_room_tips_start_record')
    : transI18n('fcr_room_tips_stop_record');
  const text = isRecordStoped ? transI18n('fcr_room_button_record') : 'Recording';

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
