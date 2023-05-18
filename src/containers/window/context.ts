import { Layout, StreamWindowPlacement } from '@onlineclass/uistores/type';
import { EduStreamUI } from '@onlineclass/utils/stream/struct';
import { EduRoleTypeEnum } from 'agora-edu-core';
import { createContext } from 'react';
export const StreamWindowContext = createContext<ReturnType<typeof convertStreamUIStatus> | null>(
  null,
);
interface StreamWindowMouseContext {
  mouseEnterWindow: boolean;
  mouseEnterClass: boolean;
}
export const StreamWindowMouseContext = createContext<StreamWindowMouseContext | null>(null);
export const convertStreamUIStatus = (
  stream: EduStreamUI,
  placement: StreamWindowPlacement,
  layout: Layout,
  isGrid: boolean,
) => {
  const renderAtMainView = placement === 'main-view';
  const renderAtListView = placement === 'list-view';
  const videoBackgroundGray = renderAtMainView && !isGrid && layout !== Layout.Grid;

  const topLabelAnimation = renderAtMainView && !isGrid;
  const bottomLabelAnimation = renderAtMainView && !isGrid;
  const streamWindowBackgroundColorCls = videoBackgroundGray
    ? 'fcr-bg-3'
    : renderAtMainView && !isGrid
    ? 'fcr-bg-1'
    : 'fcr-bg-4';
  const showMicrophoneIconOnUserLabel = renderAtMainView;
  const showMicrophoneIconOnBottomRight = renderAtListView;
  const labelSize = renderAtMainView ? 'large' : 'small';
  const isVideoStreamPublished = stream.isVideoStreamPublished;
  const showNameOnBottomLeft = renderAtMainView || (renderAtListView && isVideoStreamPublished);
  const showRoundedNamePlaceholder = renderAtMainView;
  const labelIconSize = labelSize === 'large' ? 30 : 24;
  const audioIconSize = labelSize === 'large' ? 24 : 16;
  const isHostStream = stream.role === EduRoleTypeEnum.teacher;
  const renderMode = renderAtMainView && !isGrid ? 0 : 1;
  const disableAudioVolumeEffect = renderAtMainView;
  return {
    topLabelAnimation,
    bottomLabelAnimation,
    labelSize,
    streamPlayerVisible: isVideoStreamPublished,
    stream,
    labelIconSize,
    audioIconSize,
    renderMode,
    showMicrophoneIconOnUserLabel,
    showMicrophoneIconOnBottomRight,
    showNameOnBottomLeft,
    showRoundedNamePlaceholder,
    showHostLabel: isHostStream,
    streamWindowBackgroundColorCls,
    renderAtMainView,
    renderAtListView,
    isHostStream,
    placement,
    videoBackgroundGray,
    disableAudioVolumeEffect,
  };
};
