import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';
import { Avatar } from '@components/avatar';
import { getLaunchOptions } from '@ui-scene/utils/launch-options-holder';

export const LocalVideoPlayer = observer(() => {
  const {
    deviceSettingUIStore: {
      isPreviewCameraDeviceEnabled,
      setupLocalVideoPreview,
      isLocalMirrorEnabled,
    },
  } = useStore();
  const videoRef = useRef<HTMLDivElement>(null);
  const { userName } = getLaunchOptions();

  useEffect(() => {
    if (videoRef.current && isPreviewCameraDeviceEnabled) {
      setupLocalVideoPreview(videoRef.current, isLocalMirrorEnabled);
    }
  }, [isLocalMirrorEnabled, isPreviewCameraDeviceEnabled]);

  return (
    <div className="fcr-video-player-wrapper">
      <div ref={videoRef} className="fcr-video-player" />
      <div className="fcr-video-player__placeholder">
        <Avatar size={80} textSize={24} nickName={userName} />
      </div>
    </div>
  );
});

export const RemoteVideoPlayer = observer(() => {
  return <div />;
});
