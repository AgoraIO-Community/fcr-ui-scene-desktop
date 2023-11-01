import React, { useEffect } from 'react';
import { VolumeIndicator } from '@components/volume';
import { observer } from 'mobx-react';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { MicrophoneSelect, SpeakerSelect } from '../device-pretest/device-select';
import { Checkbox } from '@components/checkbox';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useI18n } from 'agora-common-libs';

export const AudioSettings = observer(() => {
  const transI18n = useI18n();
  const { deviceSettingUIStore } = useStore();
  const {
    localRecordingTestVolume,
    localPlaybackTestVolume,
    toggleAiDenoiser,
    startAudioRecordingPreview,
    stopAudioRecordingPreview,
    isAiDenoiserEnabled,
  } = deviceSettingUIStore;
  useEffect(() => {
    startAudioRecordingPreview();
    return stopAudioRecordingPreview;
  }, []);
  return (
    <div className="fcr-device-settings__audio">
      <div className="fcr-device-settings__microphone">
        <div className="fcr-device-settings__label">
          <span>{transI18n('fcr_device_label_microphone')}</span>
        </div>
        <MicrophoneSelect />
        <div className="fcr-pretest__settings__volume">
          <SvgImg type={SvgIconEnum.FCR_MUTE} />
          <VolumeIndicator value={localRecordingTestVolume} barCount={15} />
        </div>
      </div>
      <div className="fcr-device-settings__speaker">
        <div className="fcr-device-settings__label">
          <span>{transI18n('fcr_device_label_speaker')}</span>
        </div>
        <SpeakerSelect />
        <div className="fcr-pretest__settings__volume">
          <SvgImg type={SvgIconEnum.FCR_V2_LOUDER} />
          <VolumeIndicator value={localPlaybackTestVolume} barCount={15} />
        </div>

        <Checkbox
          checked={isAiDenoiserEnabled}
          size="small"
          label={transI18n('fcr_device_label_noise_cancellation')}
          onChange={toggleAiDenoiser}
        />
      </div>
    </div>
  );
});
