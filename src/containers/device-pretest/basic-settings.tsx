import { Checkbox } from '@onlineclass/components/checkbox';
import { SvgIconEnum, SvgImg } from '@onlineclass/components/svg-img';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react-lite';
import { VolumeIndicator } from '@onlineclass/components/volume';
import { CameraSelect, MicrophoneSelect, SpeakerSelect } from './device-select';

export const BasicSettings = observer(() => {
  const { deviceSettingUIStore } = useStore();

  const { localRecordingTestVolume, localPlaybackTestVolume, toggleAiDenoiser } =
    deviceSettingUIStore;

  return (
    <div className="fcr-pretest-settings">
      <div className="fcr-pretest__settings__item">
        <span className="fcr-pretest__settings__label">Camera</span>
        <CameraSelect />
      </div>
      <div className="fcr-pretest__settings__item">
        <div className="fcr-pretest__settings__label">
          <span className="fcr-pretest__settings__label-title">Microphone</span>
          <Checkbox size="small" label={'AI noise reduction'} onChange={toggleAiDenoiser} />
          <SvgImg
            type={SvgIconEnum.FCR_MUTE}
            colors={{ iconPrimary: 'currentColor', iconSecondary: 'currentColor' }}
          />
          <VolumeIndicator value={localRecordingTestVolume} />
        </div>
        <MicrophoneSelect />
      </div>
      <div className="fcr-pretest__settings__item">
        <div className="fcr-pretest__settings__label">
          <span className="fcr-pretest__settings__label-title">Speaker</span>
          <SvgImg type={SvgIconEnum.FCR_V2_LOUDER} colors={{ iconPrimary: 'currentColor' }} />
          <VolumeIndicator value={localPlaybackTestVolume} />
        </div>
        <SpeakerSelect />
      </div>
    </div>
  );
});
