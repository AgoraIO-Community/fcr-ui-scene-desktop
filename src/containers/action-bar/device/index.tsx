import { Popover } from '@components/popover';
import { Radio } from '@components/radio';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { MicrophoneIndicator } from '@components/svg-img/mic';
import { FC, useState } from 'react';
import { ActionBarItemWrapper } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useDeviceSwitch } from '@ui-scene/utils/hooks/use-device-switch';
import { EduStreamUI } from '@ui-scene/utils/stream/struct';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { useI18n } from 'agora-common-libs';
const colors = themeVal('colors');
export const AudioRecordinDeviceIcon = observer(
  ({ size = 32, stream }: { size?: number; stream?: EduStreamUI }) => {
    const {
      streamUIStore: { remoteStreamVolume, localVolume },
    } = useStore();
    const isLocalStream = !!stream?.isLocal;

    const { micEnabled } = useDeviceSwitch({ stream, isLocal: isLocalStream });

    const volume = isLocalStream ? localVolume : remoteStreamVolume(stream);
    return !micEnabled ? (
      <SvgImg
        type={SvgIconEnum.FCR_NOMUTE}
        colors={{ iconSecondary: colors['red']['6'] }}
        size={size}></SvgImg>
    ) : (
      <MicrophoneIndicator size={size} voicePercent={volume} />
    );
  },
);
export const MicrophoneDevice: FC = observer(() => {
  const {
    tootipVisible,
    popoverOpened,
    handlePopoverVisibleChanged,
    handleTooltipVisibleChanged,
    setPopoverOpened,
  } = useDeviceTooltipVisible();
  const transI18n = useI18n();
  const {
    streamUIStore: { localStream },
    deviceSettingUIStore: { noAudioRecordingDevice, setDeviceSettingDialogVisible },
  } = useStore();
  const { toggleLocalAudioRecordingDevice, micTooltip } = useDeviceSwitch({
    stream: localStream,
    isLocal: true,
  });
  const text = noAudioRecordingDevice ? transI18n('fcr_device_tips_no_device') : micTooltip;

  return (
    <ToolTip visible={tootipVisible} onVisibleChange={handleTooltipVisibleChanged} content={text}>
      <ActionBarItemWrapper>
        <div className="fcr-action-bar-device" onClick={toggleLocalAudioRecordingDevice}>
          <div className="fcr-action-bar-device-inner">
            {noAudioRecordingDevice ? (
              <SvgImg
                type={SvgIconEnum.FCR_MUTECRASH}
                colors={{ iconSecondary: colors['red']['6'] }}
                size={32}></SvgImg>
            ) : (
              <AudioRecordinDeviceIcon stream={localStream}></AudioRecordinDeviceIcon>
            )}
            <div className="fcr-action-bar-device-text">
              {transI18n('fcr_device_label_microphone')}
            </div>
          </div>
          <Popover
            visible={popoverOpened}
            onVisibleChange={handlePopoverVisibleChanged}
            trigger="click"
            content={
              <AudioDeviceListPopoverContent
                onMoreClick={() => {
                  setDeviceSettingDialogVisible(true);
                  setPopoverOpened(false);
                }}></AudioDeviceListPopoverContent>
            }>
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="fcr-action-bar-device-extra">
              <SvgImg type={SvgIconEnum.FCR_DROPUP4}></SvgImg>
            </div>
          </Popover>
        </div>
      </ActionBarItemWrapper>
    </ToolTip>
  );
});
export const CameraDevice: FC = observer(() => {
  const transI18n = useI18n();

  const {
    tootipVisible,
    popoverOpened,
    handlePopoverVisibleChanged,
    handleTooltipVisibleChanged,
    setPopoverOpened,
  } = useDeviceTooltipVisible();
  const {
    streamUIStore: { localStream },
    deviceSettingUIStore: { noCameraDevice, setDeviceSettingDialogVisible },
  } = useStore();
  const { toggleLocalCameraDevice, cameraEnabled, cameraTooltip } = useDeviceSwitch({
    stream: localStream,
    isLocal: true,
  });
  const icon = noCameraDevice
    ? SvgIconEnum.FCR_CAMERACRASH
    : cameraEnabled
    ? SvgIconEnum.FCR_CAMERA
    : SvgIconEnum.FCR_CAMERAOFF;
  const text = noCameraDevice ? transI18n('fcr_device_tips_no_device') : cameraTooltip;
  const color = !cameraEnabled || noCameraDevice ? { iconSecondary: colors['red']['6'] } : {};
  return (
    <ToolTip onVisibleChange={handleTooltipVisibleChanged} visible={tootipVisible} content={text}>
      <ActionBarItemWrapper>
        <div className="fcr-action-bar-device" onClick={toggleLocalCameraDevice}>
          <div className="fcr-action-bar-device-inner">
            <SvgImg type={icon} colors={color} size={32}></SvgImg>
            <div className="fcr-action-bar-device-text">{transI18n('fcr_device_label_camera')}</div>
          </div>
          <Popover
            visible={popoverOpened}
            onVisibleChange={handlePopoverVisibleChanged}
            content={
              <VideoDeviceListPopoverContent
                onMoreClick={() => {
                  setDeviceSettingDialogVisible(true);
                  setPopoverOpened(false);
                }}></VideoDeviceListPopoverContent>
            }
            trigger="click">
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="fcr-action-bar-device-extra">
              <SvgImg type={SvgIconEnum.FCR_DROPUP4}></SvgImg>
            </div>
          </Popover>
        </div>
      </ActionBarItemWrapper>
    </ToolTip>
  );
});
const useDeviceTooltipVisible = () => {
  const {
    layoutUIStore: { setHasPopoverShowed },
  } = useStore();
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [tootipVisible, setTootipVisible] = useState(false);
  const handleTooltipVisibleChanged = (visible: boolean) => {
    if (popoverOpened) {
      setTootipVisible(false);
    } else {
      setTootipVisible(visible);
    }
  };
  const handlePopoverVisibleChanged = (visible: boolean) => {
    setHasPopoverShowed(visible);
    setPopoverOpened(visible);
    visible && setTootipVisible(false);
  };
  return {
    popoverOpened,
    tootipVisible,
    handleTooltipVisibleChanged,
    handlePopoverVisibleChanged,
    setPopoverOpened,
    setTootipVisible,
  };
};
const VideoDeviceListPopoverContent = observer(({ onMoreClick }: { onMoreClick: () => void }) => {
  const transI18n = useI18n();

  const {
    deviceSettingUIStore: { cameraDevicesList, cameraDeviceId, setCameraDevice },
  } = useStore();
  return (
    <div
      className="fcr-device-popover-content"
      onClick={(e) => {
        e.stopPropagation();
      }}>
      <div className="fcr-device-popover-content-device-list">
        <div className="fcr-device-popover-content-device">
          <div className="fcr-device-popover-content-device-label">
            {transI18n('fcr_device_label_camera')}
          </div>

          <div className="fcr-device-popover-content-device-options">
            {cameraDevicesList.length === 0 && (
              <div>
                <Radio
                  name="No device"
                  styleType="transparent"
                  checked
                  label={transI18n('fcr_device_tips_no_device')}></Radio>
              </div>
            )}
            {cameraDevicesList.map((device) => {
              return (
                <div key={device.value} onClick={() => setCameraDevice(device.value)}>
                  <Radio
                    name="video"
                    styleType="transparent"
                    checked={cameraDeviceId === device.value}
                    label={device.text}></Radio>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="fcr-device-popover-content-more">
        <div className={'fcr-device-popover-content-more-item'} onClick={onMoreClick}>
          <SvgImg type={SvgIconEnum.FCR_SETTING} size={24}></SvgImg>
          <span>{transI18n('fcr_room_button_more_setting')}</span>
        </div>
      </div>
    </div>
  );
});
const AudioDeviceListPopoverContent = observer(({ onMoreClick }: { onMoreClick: () => void }) => {
  const {
    deviceSettingUIStore: {
      recordingDevicesList,
      audioRecordingDeviceId,
      setAudioRecordingDevice,
      playbackDevicesList,
      audioPlaybackDeviceId,
      setAudioPlaybackDevice,
    },
  } = useStore();
  const transI18n = useI18n();
  return (
    <div
      className="fcr-device-popover-content"
      onClick={(e) => {
        e.stopPropagation();
      }}>
      <div className="fcr-device-popover-content-device-list">
        <div className="fcr-device-popover-content-device">
          <div className="fcr-device-popover-content-device-label">
            {transI18n('fcr_device_label_microphone')}
          </div>

          <div className="fcr-device-popover-content-device-options">
            {recordingDevicesList.length === 0 && (
              <div>
                <Radio
                  name="No device"
                  styleType="transparent"
                  checked
                  label={transI18n('fcr_device_tips_no_device')}></Radio>
              </div>
            )}
            {recordingDevicesList.map((device) => {
              return (
                <div onClick={() => setAudioRecordingDevice(device.value)} key={device.value}>
                  <Radio
                    name="mic"
                    styleType="transparent"
                    checked={audioRecordingDeviceId === device.value}
                    label={device.text}></Radio>
                </div>
              );
            })}
          </div>
        </div>
        <div className="fcr-device-popover-content-device">
          <div className="fcr-device-popover-content-device-label">
            {transI18n('fcr_device_label_speaker')}
          </div>

          <div className="fcr-device-popover-content-device-options">
            {playbackDevicesList.length === 0 && (
              <div>
                <Radio
                  name="No device"
                  styleType="transparent"
                  checked
                  label={transI18n('fcr_device_tips_no_device')}></Radio>
              </div>
            )}
            {playbackDevicesList.map((device) => {
              return (
                <div onClick={() => setAudioPlaybackDevice(device.value)} key={device.value}>
                  <Radio
                    name="speaker"
                    styleType="transparent"
                    checked={audioPlaybackDeviceId === device.value}
                    label={device.text}></Radio>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="fcr-device-popover-content-more">
        <div className={'fcr-device-popover-content-more-item'} onClick={onMoreClick}>
          <SvgImg type={SvgIconEnum.FCR_SETTING} size={24}></SvgImg>
          <span>{transI18n('fcr_room_button_more_setting')}</span>
        </div>
      </div>
    </div>
  );
});
