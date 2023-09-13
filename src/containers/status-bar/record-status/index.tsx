import './index.css';
import { observer } from 'mobx-react';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { StatusBarItemWrapper } from '..';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classnames from 'classnames';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { useI18n } from 'agora-common-libs';

export const RecordStatus = observer(() => {
  const {
    classroomStore: {
      recordingStore: { pauseRecording, resumeRecording },
      roomStore: { recordOnHold },
    },
    statusBarUIStore: { isRecording, isRecordStoped, isRecordStarting, isHost },
  } = useStore();
  const transI18n = useI18n();
  const colors = themeVal('colors');
  const handleRecordStatus = () => {
    recordOnHold ? resumeRecording() : pauseRecording();
  };
  const text = isRecordStarting
    ? transI18n('fcr_record_waiting')
    : recordOnHold
    ? transI18n('fcr_record_label_paused')
    : transI18n('fcr_record_label_recording');

  const recordActive = isRecording && !recordOnHold;
  return !isRecordStoped ? (
    <StatusBarItemWrapper>
      <div className="fcr-status-bar-record">
        <ToolTip content={transI18n('fcr_room_button_record')}>
          <div className="fcr-status-bar-record-status">
            <SvgImg
              className={classnames({ 'fcr-status-bar-record-starting': recordActive })}
              colors={{
                iconPrimary: recordActive ? colors['red']['6'] : colors['notsb-inverse'],
              }}
              type={SvgIconEnum.FCR_RECORDING_STOP}
              size={20}></SvgImg>
            <span>{text}</span>
          </div>
        </ToolTip>

        {isHost && isRecording && (
          <ToolTip
            content={
              recordOnHold
                ? transI18n('fcr_room_tips_start_record')
                : transI18n('fcr_record_tips_click_pause')
            }>
            <div className="fcr-status-bar-record-action fcr-divider" onClick={handleRecordStatus}>
              <SvgImg
                size={20}
                type={
                  recordOnHold ? SvgIconEnum.FCR_RECORDING_PLAY : SvgIconEnum.FCR_STOP
                }></SvgImg>
            </div>
          </ToolTip>
        )}
      </div>
    </StatusBarItemWrapper>
  ) : null;
});
