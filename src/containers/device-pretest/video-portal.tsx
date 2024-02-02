import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { observer } from 'mobx-react';
import { Button } from '@components/button';
import { SvgIconEnum } from '@components/svg-img';
import { PretestDeviceIcon, PretestDeviceIconProps } from '@components/svg-img/clickable-icon';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { BeautySlider } from './beauty-slider';
import { MirrorToggle } from './mirror-toggle';
import { LocalVideoPlayer } from '../video-player';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { DeviceTabKeysContext } from '.';
import { useI18n } from 'agora-common-libs';

const colors = themeVal('colors');
export const VideoPortal = observer(() => {
  const transI18n = useI18n();
  const { setDevicePretestFinished, deviceSettingUIStore } = useStore();
  const pretestDeviceStateRef = useRef({ cameraEnable: false, micEnable: false });
  const cameraIconProps = useMemo<
    { status: string; icon: SvgIconEnum; tooltip: string } & Partial<PretestDeviceIconProps>
  >(() => {
    const isDeviceActive = deviceSettingUIStore.isPreviewCameraDeviceEnabled;
    const isNoDevice = deviceSettingUIStore.cameraDevicesList.length === 0;

    if (isNoDevice) {
      return {
        status: 'disabled' as const,
        icon: SvgIconEnum.FCR_CAMERACRASH,
        tooltip: transI18n('fcr_device_tips_no_device'),
      };
    }

    return isDeviceActive
      ? {
          status: 'active' as const,
          icon: SvgIconEnum.FCR_CAMERA,
          tooltip: transI18n('fcr_device_tips_stop_video'),
        }
      : {
          status: 'inactive' as const,
          icon: SvgIconEnum.FCR_CAMERAOFF,
          iconProps: {
            colors: {
              iconSecondary: colors?.['notsb-inverse'],
            },
          },
          tooltip: transI18n('fcr_device_tips_start_video'),
        };
  }, [
    deviceSettingUIStore.isPreviewCameraDeviceEnabled,
    deviceSettingUIStore.cameraDevicesList.length,
  ]);

  const microphoneIconProps = useMemo(() => {
    const enabled = deviceSettingUIStore.isPreviewAudioRecordingDeviceEnabled;
    const isNoDevice = deviceSettingUIStore.recordingDevicesList.length === 0;

    if (isNoDevice) {
      return {
        status: 'disabled' as const,
        icon: SvgIconEnum.FCR_MUTECRASH,
        tooltip: transI18n('fcr_device_tips_no_device'),
      };
    }

    return enabled
      ? {
          status: 'active' as const,
          icon: SvgIconEnum.FCR_MUTE,
          tooltip: transI18n('fcr_device_tips_mute'),
        }
      : {
          status: 'inactive' as const,
          icon: SvgIconEnum.FCR_NOMUTE,
          iconProps: {
            colors: {
              iconSecondary: colors?.['notsb-inverse'],
            },
          },
          tooltip: transI18n('fcr_device_tips_unmute'),
        };
  }, [
    deviceSettingUIStore.isPreviewAudioRecordingDeviceEnabled,
    deviceSettingUIStore.recordingDevicesList.length,
  ]);

  const speakerIconProps = useMemo(() => {
    const enabled = deviceSettingUIStore.isAudioPlaybackDeviceEnabled;

    return enabled
      ? {
          status: 'active' as const,
          icon: SvgIconEnum.FCR_V2_LOUDER_MIN,
          tooltip: transI18n('fcr_device_tips_disable_speaker'),
        }
      : {
          status: 'inactive' as const,
          icon: SvgIconEnum.FCR_V2_QUITE,
          tooltip: transI18n('fcr_device_tips_enable_speaker'),
        };
  }, [deviceSettingUIStore.isAudioPlaybackDeviceEnabled]);
  const activeTab = useContext(DeviceTabKeysContext);

  const beautyFilterVisible =
    deviceSettingUIStore.isBeautyFilterEnabled &&
    deviceSettingUIStore.activeBeautyType &&
    activeTab === 'beauty-filter';

  useEffect(() => {
    deviceSettingUIStore.startCameraPreview();
    deviceSettingUIStore.startRecordingDeviceTest();

    return () => {
      deviceSettingUIStore.stopCameraPreview();
      deviceSettingUIStore.stopRecordingDeviceTest();
    };
  }, []);
  useEffect(() => {
    pretestDeviceStateRef.current = {
      cameraEnable: deviceSettingUIStore.isPreviewCameraDeviceEnabled,
      micEnable: deviceSettingUIStore.isPreviewAudioRecordingDeviceEnabled,
    };
  }, [
    deviceSettingUIStore.isPreviewAudioRecordingDeviceEnabled,
    deviceSettingUIStore.isPreviewCameraDeviceEnabled,
  ]);
  return (
    <div className="fcr-pretest__video-portal">
      <div className="fcr-pretest__video-portal__header">
        <span>{transI18n('fcr_device_label_device_join')}</span>
        <Button size="S" onClick={setDevicePretestFinished}>
          {transI18n('fcr_device_button_join')}
        </Button>
      </div>
      <div className="fcr-pretest__video-portal__video">
        <VideoOffTips />
        <LocalVideoPlayer />
        {beautyFilterVisible && <BeautySlider />}
      </div>
      <div className="fcr-pretest__video-portal__toggles">
        <PretestDeviceIcon
          onClick={deviceSettingUIStore.toggleCameraPreview}
          {...cameraIconProps}
        />
        <PretestDeviceIcon
          onClick={deviceSettingUIStore.toggleAudioRecordingPreview}
          {...microphoneIconProps}
        />
        {/* <PretestDeviceIcon
          onClick={deviceSettingUIStore.toggleAudioPlaybackDevice}
          {...speakerIconProps}
        /> */}
        <MirrorToggle placement="pretest" />
      </div>
    </div>
  );
});
const VideoOffTips = observer(() => {
  const transI18n = useI18n();
  const activeTab = useContext(DeviceTabKeysContext);
  const {
    deviceSettingUIStore: { isPreviewCameraDeviceEnabled, isBeautyFilterEnabled, activeBeautyType },
  } = useStore();

  const activeBeautySlider =
    activeTab === 'beauty-filter' && isBeautyFilterEnabled && activeBeautyType;
  return !isPreviewCameraDeviceEnabled && activeTab !== 'basic-settings' ? (
    <div
      style={{
        width: `calc(100% - ${activeBeautySlider ? '56px' : '0px'})`,
        borderTopRightRadius: `${activeBeautySlider ? '16px' : '0px'}`,
      }}
      className="fcr-pretest__video-portal__tips">
      {activeTab === 'virtual-background'
        ? transI18n('fcr_device_tips_background')
        : transI18n('fcr_device_tips_beauty_filter')}
    </div>
  ) : null;
});
