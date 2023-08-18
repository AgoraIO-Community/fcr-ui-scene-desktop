import { SvgIconEnum } from '@components/svg-img';
import { EduRoleTypeEnum } from 'agora-edu-core';

export enum BoardConnectionState {
  Disconnected = 0,
  Connecting = 1,
  Connected = 2,
  Reconnecting = 3,
  Disconnecting = 4,
}

export enum BoardMountState {
  NotMounted = 0,
  Mounted = 1,
}

export enum FcrBoardTool {
  Selector = 1,
  LaserPointer = 2,
  Eraser = 3,
  Clicker = 4,
  Hand = 5,
  Text = 6,
}

export enum FcrBoardShape {
  Curve = 1,
  Straight = 2,
  Arrow = 3,
  Rectangle = 4,
  Triangle = 5,
  Rhombus = 6,
  Pentagram = 7,
  Ellipse = 8,
}
export type FcrBoardMaterialWindowConfig<T = unknown> = {
  resourceUuid: string;
  urlPrefix: string;
  title: string;
  pageList: T[];
  taskUuid: string;
  resourceHasAnimation: boolean;
};
export const chatroomWidgetId = 'easemobIM';

export type CabinetToolItem = {
  name: string;
  id: string;
  iconType: SvgIconEnum;
};
export enum AgoraIMMessageType {
  Text = 'text',
  Image = 'image',
  Custom = 'custom',
}
export class AgoraIMMessageBase<B = unknown, E extends AgoraIMMessageExt = AgoraIMMessageExt> {
  id: string;
  from?: string;
  to?: string;
  type?: AgoraIMMessageType;
  body?: B;
  ext?: E;
  ts?: number;
  receiverList?: AgoraIMUserInfo[];
  constructor(params: AgoraIMMessageBase<B, E>) {
    this.id = params.id;
    this.from = params.from;
    this.to = params.to;
    this.type = params.type;
    this.body = params.body;
    this.ext = params.ext;
    this.ts = params.ts || new Date().getTime();
    this.receiverList = params.receiverList;
  }
}
export class AgoraIMTextMessage extends AgoraIMMessageBase {
  msg: string;

  constructor(params: AgoraIMTextMessage) {
    super(params);
    this.type = AgoraIMMessageType.Text;
    this.msg = params.msg;
  }
}
export interface AgoraIMMessageExt {
  nickName: string;
  roomUuid: string;
  role: EduRoleTypeEnum;
  avatarUrl: string;
  muteMember?: string;
  muteNickName?: string;
  receiverList: AgoraIMUserInfo[];
}
export interface AgoraIMUserInfoExt {
  role: EduRoleTypeEnum;
  userUuid: string;
}
export interface AgoraIMUserInfo<E extends AgoraIMUserInfoExt = AgoraIMUserInfoExt> {
  userId: string;
  nickName: string;
  avatarUrl: string;
  ext: E;
}
export class AgoraIMImageMessage<
  E extends AgoraIMMessageExt = AgoraIMMessageExt,
> extends AgoraIMMessageBase<unknown, E> {
  url?: string;
  file?: File;
  width?: number;
  height?: number;
  onFileUploadError?(): void;
  onFileUploadProgress?(e: unknown): void;
  onFileUploadComplete?(): void;

  constructor(params: AgoraIMImageMessage<E>) {
    super(params);
    this.type = AgoraIMMessageType.Image;

    this.url = params.url;
    this.file = params.file;
    this.width = params.width;
    this.height = params.height;
    this.onFileUploadComplete = params.onFileUploadComplete;
    this.onFileUploadError = params.onFileUploadError;
    this.onFileUploadProgress = params.onFileUploadProgress;
  }
}
