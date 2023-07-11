import { extractUserStreams } from '@onlineclass/utils/stream';
import { EduStreamUI } from '@onlineclass/utils/stream/struct';
import { EduClassroomConfig, EduRoleTypeEnum, EduStream } from 'agora-edu-core';
import { AgoraRteMediaSourceState, AgoraRteVideoSourceType } from 'agora-rte-sdk';
import { computed } from 'mobx';
import { computedFn } from 'mobx-utils';
import { OnlineclassUIStore } from '.';

export class Getters {
  constructor(private _classroomUIStore: OnlineclassUIStore) {}

  get classroomUIStore() {
    return this._classroomUIStore;
  }

  get boardApi() {
    return this._classroomUIStore.boardApi;
  }

  get eduTool() {
    return this._classroomUIStore.eduToolApi;
  }

  @computed
  get widgetInstanceList() {
    return this.classroomUIStore.widgetUIStore.widgetInstanceList;
  }

  @computed
  get isGranted() {
    return this._classroomUIStore.boardApi.granted;
  }

  get roomName() {
    return EduClassroomConfig.shared.sessionInfo.roomName;
  }
  get roomUuid() {
    return EduClassroomConfig.shared.sessionInfo.roomUuid;
  }

  get isHost() {
    return EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.teacher;
  }

  get isStudent() {
    return EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.student;
  }
  @computed
  get localUser() {
    return this._classroomUIStore.classroomStore.userStore.localUser;
  }
  @computed
  get videoStreams() {
    const { streamByUserUuid, streamByStreamUuid } =
      this._classroomUIStore.classroomStore.streamStore;
    const videoStreams = extractUserStreams(
      this._classroomUIStore.classroomStore.userStore.users,
      streamByUserUuid,
      streamByStreamUuid,
      [AgoraRteVideoSourceType.Camera, AgoraRteVideoSourceType.ScreenShare],
    );
    return videoStreams;
  }
  @computed
  get videoUIStreams() {
    return Array.from(this.videoStreams).map((stream) => new EduStreamUI(stream));
  }
  @computed
  get cameraStreams() {
    const { streamByUserUuid, streamByStreamUuid } =
      this._classroomUIStore.classroomStore.streamStore;
    const cameraStreams = extractUserStreams(
      this._classroomUIStore.classroomStore.userStore.users,
      streamByUserUuid,
      streamByStreamUuid,
      [AgoraRteVideoSourceType.Camera],
    );
    return cameraStreams;
  }

  @computed
  get cameraUIStreams() {
    return Array.from(this.cameraStreams).map((stream) => new EduStreamUI(stream));
  }
  @computed
  get teacherUIStream() {
    return this.cameraUIStreams.find((stream) => {
      return stream.role === EduRoleTypeEnum.teacher;
    });
  }
  @computed
  get localCameraStream() {
    return this.cameraUIStreams.find((stream) => {
      return stream.isLocal;
    });
  }
  @computed
  get screenShareUIStream() {
    const streamUuid = this._classroomUIStore.classroomStore.roomStore
      .screenShareStreamUuid as string;
    const stream =
      this._classroomUIStore.classroomStore.streamStore.streamByStreamUuid.get(streamUuid);
    return stream ? new EduStreamUI(stream) : null;
  }
  @computed
  get isScreenSharing() {
    return !!this.screenShareUIStream;
  }
  @computed
  get isLocalScreenSharing() {
    return (
      this.classroomUIStore.classroomStore.mediaStore.localScreenShareTrackState ===
      AgoraRteMediaSourceState.started
    );
  }
  @computed
  get pinnedUIStream() {
    const stream = this._classroomUIStore.classroomStore.streamStore.streamByStreamUuid.get(
      this.classroomUIStore.streamUIStore.pinnedStreamUuid,
    );
    return stream ? new EduStreamUI(stream) : null;
  }
  userCameraStreamByUserUuid = computedFn((userUuid: string) => {
    const cameraStreams: EduStream[] = [];
    this.cameraStreams.forEach((stream) => {
      if (stream.fromUser.userUuid === userUuid) cameraStreams.push(stream);
    });
    return cameraStreams[0];
  });

  get layoutReady() {
    return this._classroomUIStore.layoutUIStore.layoutReady;
  }

  get isBoardWidgetActive() {
    return this._classroomUIStore.widgetUIStore.widgetInstanceList.some((widget) => {
      return widget.widgetName === 'netlessBoard';
    });
  }

  get viewportBoundaries() {
    return this._classroomUIStore.layoutUIStore.viewportBoundaries;
  }

  get activeWidgetIds() {
    return this._classroomUIStore.widgetUIStore.widgetInstanceList.map((w) => w.widgetId);
  }

  get isBreakoutActive() {
    return (
      this._classroomUIStore.breakoutUIStore.breakoutDialogVisible ||
      this.eduTool.isWidgetMinimized('breakout') ||
      !!this.classroomUIStore.breakoutUIStore.groupState
    );
  }

  get isJoiningSubRoom() {
    return this.classroomUIStore.breakoutUIStore.isJoiningSubRoom;
  }
}
