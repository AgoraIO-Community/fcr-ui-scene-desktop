import { CloudDriveResourceUploadStatus } from 'agora-edu-core';

export enum Layout {
  ListOnTop = 'list-on-top',
  ListOnRight = 'list-on-right',
  Grid = 'grid',
}
export type StreamWindowPlacement = 'main-view' | 'list-view';

export type DialogType = 'confirm' | 'class-info';
export type CustomMessageData<T> = {
  cmd: CustomMessageCommandType;
  data: T;
};
export enum CustomMessageCommandType {
  deviceSwitch = 'deviceSwitch',
  deviceSwitchBatch = 'deviceSwitchBatch',
  handsUp = 'handsUp',
  handsUpAll = 'handsUpAll',
}
export type CustomMessageDeviceSwitchType = {
  deviceState: CustomMessageDeviceState;
  deviceType: CustomMessageDeviceType;
};
export enum CustomMessageDeviceType {
  camera = 1,
  mic = 2,
}
export enum CustomMessageDeviceState {
  close = 0,

  open = 1,
}
export type CustomMessageHandsUpType = {
  userUuid: string;
  state: CustomMessageHandsUpState;
};
export enum CustomMessageHandsUpState {
  lowerHand = 0,
  raiseHand = 1,
}
export type CustomMessageHandsUpAllType = {
  operation: CustomMessageHandsUpState;
};
export type CommonDialogType<T = unknown> = {
  id?: string;
} & T;
export enum DeviceSwitchDialogId {
  StartVideo = 'start-video',
  Unmute = 'unmute',
}

//cloud
export const h5Type = 'ah5';
export const linkType = 'alf';
export const imageTypes = ['bmp', 'jpg', 'png', 'gif', 'jpeg'];
export const mediaVideoTypes = ['mp4'];
export const mediaAudioTypes = ['mp3'];
export const convertableTypes = ['ppt', 'pptx', 'doc', 'docx', 'pdf'];
export const convertableDynamicTypes = ['pptx'];

export const supportedTypes = [
  h5Type,
  linkType,
  ...imageTypes,
  ...mediaAudioTypes,
  ...mediaVideoTypes,
  ...convertableTypes,
];
export interface UploadItem {
  resourceUuid: string;
  iconType?: string;
  fileName?: string;
  fileSize?: string;
  currentProgress?: number;
  status: CloudDriveResourceUploadStatus;
}
export const MimeTypesKind: Record<string, string> = {
  opus: 'video/ogg',
  ogv: 'video/ogg',
  mp4: 'video/mp4',
  mov: 'video/mp4',
  m4v: 'video/mp4',
  mkv: 'video/x-matroska',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  caf: 'audio/x-caf',
  flac: 'audio/flac',
  oga: 'audio/ogg',
  wav: 'audio/wav',
  m3u8: 'application/x-mpegURL',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};
export type BoardMediaWindowConfig = {
  resourceUuid: string;
  resourceUrl: string;
  title: string;
  mimeType: string;
};

export type BoardH5WindowConfig = {
  resourceUuid: string;
  resourceUrl: string;
  title: string;
};
export type WebviewOpenParams = {
  resourceUuid: string;
  url: string;
  title: string;
};

export type StreamMediaPlayerOpenParams = {
  resourceUuid: string;
  url: string;
  title: string;
};
//rtt功能类型枚举
export enum RttTypeEnum{
  //字幕
  SUBTITLE = "rtt",
  //转写
  CONVERSION = "rttbox",
}