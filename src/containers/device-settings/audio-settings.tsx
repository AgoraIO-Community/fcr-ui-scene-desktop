import React from 'react';
import { VolumeIndicator } from '@onlineclass/components/volume';
import { observer } from 'mobx-react';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { MicrophoneSelect, SpeakerSelect } from '../device-pretest/device-select';
import { Checkbox } from '@onlineclass/components/checkbox';
import { SvgIconEnum, SvgImg } from '@onlineclass/components/svg-img';

export const AudioSettings = observer(() => {
  const { deviceSettingUIStore } = useStore();
  const { localRecordingTestVolume, localPlaybackTestVolume, toggleAiDenoiser } =
    deviceSettingUIStore;

  return (
    <div className="fcr-device-settings__audio">
      <div className="fcr-device-settings__microphone">
        <div className="fcr-device-settings__label">
          <span>Microphone</span>
        </div>
        <MicrophoneSelect />
        <div className="fcr-pretest__settings__volume">
          <SvgImg type={SvgIconEnum.FCR_MUTE} />
          <VolumeIndicator value={localRecordingTestVolume} barCount={18} />
        </div>
      </div>
      <div className="fcr-device-settings__speaker">
        <div className="fcr-device-settings__label">
          <span>Speaker</span>
        </div>
        <SpeakerSelect />
        <div className="fcr-pretest__settings__volume">
          <SvgImg type={SvgIconEnum.FCR_MUTE} />
          <VolumeIndicator value={localPlaybackTestVolume} barCount={18} />
        </div>

        <Checkbox size="small" label={'AI noise reduction'} onChange={toggleAiDenoiser} />
      </div>
    </div>
  );
});
