import { extractUserStreams } from '@ui-scene/utils/stream';
import { EduStreamUI } from '@ui-scene/utils/stream/struct';
import { EduClassroomConfig, EduRoleTypeEnum, EduStream } from 'agora-edu-core';
import { AgoraRteMediaSourceState, AgoraRteVideoSourceType } from 'agora-rte-sdk';
import { computed } from 'mobx';
import { computedFn } from 'mobx-utils';
import { SceneUIStore } from '.';

export class Getters {
  constructor(private _classroomUIStore: SceneUIStore) {}

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
  get layout() {
    return this.classroomUIStore.layoutUIStore.layout;
  }
  @computed
  get widgetInstanceList() {
    return this.classroomUIStore.widgetUIStore.widgetInstanceList;
  }

  @computed
  get isGranted() {
    return this._classroomUIStore.boardApi.granted || this.isHost;
  }

  get roomName() {
    return EduClassroomConfig.shared.sessionInfo.roomName;
  }
  get roomUuid() {
    return EduClassroomConfig.shared.sessionInfo.roomUuid;
  }

  get isHost() {
    return this.isTeacher || this.isAssistant;
  }
  get isTeacher() {
    return EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.teacher;
  }
  get isAssistant() {
    return EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.assistant;
  }
  get isStudent() {
    return EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.student;
  }
  get isAudience() {
    return EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.invisible;
  }
  @computed
  get localUser() {
    return this._classroomUIStore.classroomStore.userStore.localUser;
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
    const isIngroupLocal = this._classroomUIStore.classroomStore.groupStore.groupUuidByUserUuid.get(
      this.localUser?.userUuid || '',
    );
    return Array.from(this.cameraStreams)
      .filter((stream) => {
        return isIngroupLocal
          ? true
          : !this._classroomUIStore.classroomStore.groupStore.groupUuidByUserUuid.get(
              stream.fromUser.userUuid,
            );
      })
      .map((stream) => new EduStreamUI(stream));
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
  get isBoardWidgetMinimized() {
    return this._classroomUIStore.eduToolApi.isWidgetMinimized('netlessBoard');
  }
  @computed
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

  get isBreakoutStarted() {
    return !!this.classroomUIStore.breakoutUIStore.groupState;
  }

  get isBreakoutMinimized() {
    return this._classroomUIStore.eduToolApi.isWidgetMinimized('breakout');
  }

  get isJoiningSubRoom() {
    return this.classroomUIStore.breakoutUIStore.isJoiningSubRoom;
  }
}
