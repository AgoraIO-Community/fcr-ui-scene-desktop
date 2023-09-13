import { SvgIconEnum } from '@components/svg-img';
import { PretestDeviceIcon } from '@components/svg-img/clickable-icon';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { useMemo } from 'react';

export const MirrorToggle = observer(({ placement }: { placement: 'setting' | 'pretest' }) => {
  const transI18n = useI18n();
  const { deviceSettingUIStore } = useStore();
  const mirrorIconProps = useMemo(() => {
    const enabled = deviceSettingUIStore.isLocalMirrorEnabled;
    return enabled
      ? {
          icon: SvgIconEnum.FCR_MIRRORIMAGE_LEFT,
        }
      : {
          icon: SvgIconEnum.FCR_MIRRORIMAGE_RIGHT,
        };
  }, [deviceSettingUIStore.isLocalMirrorEnabled]);
  const isCameraDeviceEnabled = deviceSettingUIStore.isPreviewCameraDeviceEnabled;
  return (
    <PretestDeviceIcon
      size={placement === 'pretest' ? 'large' : 'small'}
      classNames="fcr-pretest__video-portal__toggles__mirror"
      status={isCameraDeviceEnabled ? 'idle' : 'disabled'}
      tooltip={
        isCameraDeviceEnabled
          ? transI18n('fcr_device_tips_mirror')
          : transI18n('fcr_device_tips_mirror_turo_on_camera')
      }
      onClick={deviceSettingUIStore.toggleLocalMirror}
      {...mirrorIconProps}
    />
  );
});
