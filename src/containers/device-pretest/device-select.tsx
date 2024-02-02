import { Button } from '@components/button';
import { Dropdown } from '@components/dropdown';
import { SvgIconEnum } from '@components/svg-img';
import { getAssetURL } from '@ui-scene/utils/asset';
import { isElectron } from '@ui-scene/utils/check';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { useMemo, useRef, useEffect } from 'react';
import pretestAudio from '@res/pretest.mp3';
import { Scheduler } from 'agora-rte-sdk';
import { useI18n } from 'agora-common-libs';

export const CameraSelect = observer(() => {
  const { deviceSettingUIStore } = useStore();
  const transI18n = useI18n();
  const { cameraDevicesList, setCameraDevice, cameraDeviceId } = deviceSettingUIStore;

  return (
    <Dropdown
      options={cameraDevicesList}
      onChange={setCameraDevice}
      value={cameraDeviceId}
      placeholder={transI18n('fcr_device_tips_no_device')}
      disabled={cameraDevicesList.length === 0}
    />
  );
});

export const MicrophoneSelect = observer(() => {
  const { deviceSettingUIStore } = useStore();
  const transI18n = useI18n();
  const {
    recordingDevicesList,
    setAudioRecordingDevice,
    setUserHasSelectedAudioRecordingDevice,
    audioRecordingDeviceId,
  } = deviceSettingUIStore;

  return (
    <Dropdown
      options={recordingDevicesList}
      onChange={(deviceId) => {
        setAudioRecordingDevice(deviceId);
        setUserHasSelectedAudioRecordingDevice();
      }}
      value={audioRecordingDeviceId}
      placeholder={transI18n('fcr_device_tips_no_device')}
      disabled={recordingDevicesList.length === 0}
    />
  );
});

export const SpeakerSelect = observer(() => {
  const transI18n = useI18n();
  const { deviceSettingUIStore } = useStore();
  const {
    playbackDevicesList,
    setAudioPlaybackDevice,
    setUserHasSelectedAudioPlaybackDevice,
    audioPlaybackDeviceId,
    isAudioPlaybackDeviceEnabled,
    startPlaybackDeviceTest,
    stopPlaybackDeviceTest,
  } = deviceSettingUIStore;

  const testAudioUrl = useMemo(() => {
    if (isElectron()) {
      return getAssetURL('pretest.mp3');
    }

    return pretestAudio;
  }, []);

  const ref = useRef<Scheduler.Task>();

  const handleTest = () => {
    if (ref.current) return;
    if (!isAudioPlaybackDeviceEnabled) return;
    ref.current = Scheduler.shared.addDelayTask(() => {
      stopPlaybackDeviceTest();
      ref.current = undefined;
    }, Scheduler.Duration.second(3));
    startPlaybackDeviceTest(testAudioUrl);
  };

  useEffect(() => {
    return () => {
      ref.current?.stop();
      ref.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (!isAudioPlaybackDeviceEnabled) {
      stopPlaybackDeviceTest();
    }
  }, [isAudioPlaybackDeviceEnabled]);

  return (
    <div className="fcr-pretest__settings__combined-item">
      <Dropdown
        options={playbackDevicesList}
        onChange={(deviceId) => {
          setAudioPlaybackDevice(deviceId);
          setUserHasSelectedAudioPlaybackDevice();
        }}
        value={audioPlaybackDeviceId}
        placeholder={transI18n('fcr_device_tips_no_device')}
        disabled={playbackDevicesList.length === 0}
      />
      <Button
        styleType="white"
        preIcon={SvgIconEnum.FCR_V2_LOUDER}
        size="S"
        shape="rounded"
        onClick={handleTest}>
        {transI18n('fcr_device_button_test')}
      </Button>
    </div>
  );
});
