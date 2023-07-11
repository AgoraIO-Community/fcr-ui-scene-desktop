import { StreamWindowContext } from '@onlineclass/containers/stream-window/context';
import { Layout } from '@onlineclass/uistores/type';
import { useContext } from 'react';
import { useStore } from './use-store';
import { AgoraRteVideoSourceType } from 'agora-rte-sdk';

export const useVideoRenderable = () => {
  const streamWindowContext = useContext(StreamWindowContext);
  const stream = streamWindowContext?.stream;
  const {
    layoutUIStore: { layout },
    deviceSettingUIStore: { deviceSettingDialogVisible },
    presentationUIStore: { mainViewStream, isBoardWidgetActive },
  } = useStore();
  const checkVideoVisible = () => {
    if (stream?.isLocal && deviceSettingDialogVisible) return false;
    if (stream?.stream.videoSourceType === AgoraRteVideoSourceType.ScreenShare) return true;
    if (layout === Layout.Grid) return true;
    if (streamWindowContext?.renderAtMainView) {
      return (
        mainViewStream?.stream.streamUuid === stream?.stream.streamUuid && !isBoardWidgetActive
      );
    }
    if (streamWindowContext?.renderAtListView) {
      return (
        mainViewStream?.stream.streamUuid !== stream?.stream.streamUuid ||
        (mainViewStream?.stream.streamUuid === stream?.stream.streamUuid && isBoardWidgetActive)
      );
    }
    return true;
  };
  return {
    videoRenderable: checkVideoVisible(),
  };
};
