import { Checkbox } from '@components/checkbox';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react-lite';
import { VolumeIndicator } from '@components/volume';
import { CameraSelect, MicrophoneSelect, SpeakerSelect } from './device-select';
import { useI18n } from 'agora-common-libs';

export const BasicSettings = observer(() => {
  const transI18n = useI18n();
  const { deviceSettingUIStore } = useStore();

  const { localRecordingTestVolume, localPlaybackTestVolume, toggleAiDenoiser } =
    deviceSettingUIStore;

  return (
    <div className="fcr-pretest-settings">
      <div className="fcr-pretest__settings__item">
        <span className="fcr-pretest__settings__label fcr-pretest__settings__label-title">
          {transI18n('fcr_device_label_camera')}
        </span>
        <CameraSelect />
      </div>
      <div className="fcr-pretest__settings__item">
        <div className="fcr-pretest__settings__label">
          <span className="fcr-pretest__settings__label-title">
            {transI18n('fcr_device_label_microphone')}
          </span>
          <Checkbox
            size="small"
            label={transI18n('fcr_device_label_noise_cancellation')}
            onChange={toggleAiDenoiser}
          />
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
          <span className="fcr-pretest__settings__label-title">
            {transI18n('fcr_device_label_speaker')}
          </span>
          <SvgImg type={SvgIconEnum.FCR_V2_LOUDER} colors={{ iconPrimary: 'currentColor' }} />
          <VolumeIndicator value={localPlaybackTestVolume} />
        </div>
        <SpeakerSelect />
      </div>
    </div>
  );
});
