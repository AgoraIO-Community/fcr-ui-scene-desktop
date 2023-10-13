import { EduUIStoreBase } from './base';
import { observable, computed, reaction, action, runInAction } from 'mobx';
import { ShareStreamStateKeeper } from '@ui-scene/utils/stream/state-keeper';
import { ClassroomState, EduClassroomConfig, LeaveReason, RecordMode } from 'agora-edu-core';
import {
  AgoraRteAudioSourceType,
  AgoraRteCustomMessage,
  AgoraRteMediaPublishState,
  AgoraRteMediaSourceState,
  Scheduler,
  bound,
} from 'agora-rte-sdk';
import { computedFn } from 'mobx-utils';

import { isElectron } from '@ui-scene/utils/check';
import { ToastApi } from '@components/toast';
import { getRandomInt } from '@ui-scene/utils';
import {
  CustomMessageCommandType,
  CustomMessageData,
  CustomMessageHandsUpAllType,
  CustomMessageHandsUpState,
  CustomMessageHandsUpType,
} from './type';
import { chatroomWidgetId } from '@ui-scene/extension/type';
import { getLanguage, transI18n } from 'agora-common-libs';
export class ActionBarUIStore extends EduUIStoreBase {
  // for student hands up
  private _handsUpTask: Scheduler.Task | null = null;
  @observable isHandsUp = false;

  @action.bound
  raiseHand() {
    if (this.isHandsUp) return;
    const localUserUuid = this.classroomStore.userStore.localUser!.userUuid;
    this.isHandsUp = true;
    this.addHandsUpStudent(localUserUuid);
    const intervalInMs = getRandomInt(2000, 4000);
    this._handsUpTask = Scheduler.shared.addIntervalTask(
      () => {
        const message: CustomMessageData<CustomMessageHandsUpType> = {
          cmd: CustomMessageCommandType.handsUp,
          data: {
            userUuid: localUserUuid,
            state: CustomMessageHandsUpState.raiseHand,
          },
        };
        this.classroomStore.roomStore.sendCustomChannelMessage(message);
        this.addHandsUpStudent(localUserUuid);
      },
      intervalInMs,
      true,
    );
  }
  @action.bound
  lowerHand(userUuid?: string) {
    const localUserUuid = this.classroomStore.userStore.localUser!.userUuid;

    const uuid = userUuid || localUserUuid;
    this.isHandsUp = false;
    this.removeHandsUpStudent(uuid);
    this._handsUpTask?.stop();
    const message: CustomMessageData<CustomMessageHandsUpType> = {
      cmd: CustomMessageCommandType.handsUp,
      data: {
        userUuid: uuid,
        state: CustomMessageHandsUpState.lowerHand,
      },
    };
    this.classroomStore.roomStore.sendCustomChannelMessage(message);
  }
  //for all hands up
  @observable
  handsUpMap: Map<string, number> = new Map();
  private _handsUpListScanTask: Scheduler.Task | null = null;
  @action.bound
  addHandsUpStudent(userUuid: string) {
    this.handsUpMap.set(userUuid, Date.now());
  }
  @action.bound
  removeHandsUpStudent(userUuid: string) {
    this.handsUpMap.delete(userUuid);
  }
  @action.bound
  clearHandsUpStudent() {
    this.handsUpMap.clear();
  }
  isHandsUpByUserUuid = computedFn((userUuid: string) => {
    return this.handsUpMap.has(userUuid);
  });
  @action.bound
  startHandsUpMapScan() {
    const gapInMs = 6000;
    this._handsUpListScanTask = Scheduler.shared.addIntervalTask(() => {
      const now = Date.now();
      this.handsUpMap.forEach((time, key) => {
        if (now - time > gapInMs) {
          runInAction(() => {
            this.removeHandsUpStudent(key);
          });
        }
      });
    }, gapInMs);
  }
  @action.bound
  stopHandsUpListScan() {
    this._handsUpListScanTask?.stop();
  }
  @action.bound
  lowerAllHands() {
    const message: CustomMessageData<CustomMessageHandsUpAllType> = {
      cmd: CustomMessageCommandType.handsUpAll,
      data: {
        operation: CustomMessageHandsUpState.lowerHand,
      },
    };
    this.classroomStore.roomStore.sendCustomChannelMessage(message);
    this.handsUpMap.clear();
  }
  @computed get isHost() {
    return this.getters.isHost;
  }
  @computed get showEndClassButton() {
    return this.getters.isHost;
  }

  @computed get showToolBox() {
    return this.getters.isHost;
  }
  @computed get showWhiteBoard() {
    return this.getters.isHost;
  }
  @computed get showScreenShare() {
    return this.getters.isHost;
  }
  @computed get showRecord() {
    return this.getters.isHost;
  }
  @computed get showRaiseHands() {
    return this.getters.isStudent;
  }
  @computed get showCloud() {
    return this.getters.isHost;
  }
  @observable showLeaveOption = false;
  @observable leaveFlag = 1;

  shareScreenStateKeeperMap: Map<string, ShareStreamStateKeeper> = new Map();
  @computed
  get isScreenSharing() {
    return this.getters.isScreenSharing;
  }
  @computed
  get isLocalScreenSharing() {
    return this.getters.isLocalScreenSharing;
  }

  @bound
  openChatDialog() {
    this.getters.eduTool.setWidgetVisible(chatroomWidgetId, true);
  }
  @bound
  closeChatDialog() {
    this.getters.eduTool.setWidgetVisible(chatroomWidgetId, false);
  }
  @bound
  setPrivateChat(userId: string) {
    this.getters.eduTool.sendWidgetPrivateChat(chatroomWidgetId, userId);
  }
  @action.bound
  setShowLeaveOption(show: boolean, flag: number /* 1 leave clasroom, 2 leave group  */) {
    this.showLeaveOption = show;
    this.leaveFlag = flag;
  }
  @bound
  startRecording() {
    this.classroomStore.recordingStore.startRecording(this.recordArgs);
  }
  @bound
  stopRecording() {
    this.classroomStore.recordingStore.stopRecording();
  }
  get recordArgs() {
    const { recordUrl, recordRetryTimeout } = EduClassroomConfig.shared;

    const args = {
      webRecordConfig: {
        rootUrl: `${recordUrl}?language=${getLanguage()}`,
        videoBitrate: 3000,
      },
      mode: RecordMode.Web,
      retryTimeout: recordRetryTimeout,
    };

    return args;
  }
  @bound
  startLocalScreenShare() {
    this.preCheckScreenShareStatus();
    if (this.classroomStore.mediaStore.isScreenDeviceEnumerateSupported()) {
      //electron
      //   this.selectScreenShareDevice();
    } else {
      //web
      this.classroomStore.mediaStore.startScreenShareCapture({ withAudio: true });
    }
  }
  preCheckScreenShareStatus() {
    if (!this.classroomStore.mediaStore.hasScreenSharePermission()) {
      //   this.shareUIStore.addToast(transI18n('toast2.screen_permission_denied'), 'warning');
    }
    if (this.isLocalScreenSharing) {
      this.stopLocalScreenShare();
    }
  }
  @bound
  stopLocalScreenShare() {
    this.classroomStore.mediaStore.stopScreenShareCapture();
  }
  @computed
  get screenShareStateAccessor() {
    return {
      trackState: this.classroomStore.mediaStore.localScreenShareTrackState,
      classroomState: this.classroomStore.connectionStore.classroomState,
    };
  }
  @bound
  leaveClassroom() {
    this.classroomStore.connectionStore.leaveClassroom(LeaveReason.leave);
  }
  @bound
  private _onReceiveChannelMessage(message: AgoraRteCustomMessage) {
    const cmd = message.payload.cmd as CustomMessageCommandType;
    const localUserUuid = this.classroomStore.userStore.localUser?.userUuid;

    if (message.fromUser.userUuid !== localUserUuid) {
      switch (cmd) {
        case CustomMessageCommandType.handsUp: {
          const data = message.payload.data as CustomMessageHandsUpType;
          const { userUuid, state } = data;

          if (state === CustomMessageHandsUpState.raiseHand) {
            this.addHandsUpStudent(userUuid);
          } else if (state === CustomMessageHandsUpState.lowerHand) {
            this.removeHandsUpStudent(userUuid);
          }
          if (this.getters.isStudent) {
            if (state === CustomMessageHandsUpState.lowerHand) {
              const localUserUuid = this.classroomStore.userStore.localUser?.userUuid;
              if (userUuid === localUserUuid) {
                this.lowerHand();
                ToastApi.open({
                  toastProps: {
                    type: 'info',
                    content: transI18n('fcr_room_tips_lower_hand'),
                  },
                });
              }
            }
          }
          break;
        }
        case CustomMessageCommandType.handsUpAll: {
          if (this.getters.isStudent) {
            const data = message.payload.data as CustomMessageHandsUpAllType;
            const { operation } = data;
            if (operation === CustomMessageHandsUpState.lowerHand) {
              this.lowerHand();
              ToastApi.open({
                toastProps: {
                  type: 'info',
                  content: transI18n('fcr_room_tips_lower_all_hand'),
                },
              });
            }
          }
        }
      }
    }
  }
  @bound
  private _onReceivePeerMessage(message: AgoraRteCustomMessage) {}
  onDestroy(): void {
    this._disposers.forEach((d) => d());
    this._disposers = [];
    this.classroomStore.roomStore.removeCustomMessageObserver({
      onReceiveChannelMessage: this._onReceiveChannelMessage,
      onReceivePeerMessage: this._onReceivePeerMessage,
    });
    this.stopHandsUpListScan();
  }
  onInstall(): void {
    this.startHandsUpMapScan();
    this.classroomStore.roomStore.addCustomMessageObserver({
      onReceiveChannelMessage: this._onReceiveChannelMessage,
      onReceivePeerMessage: this._onReceivePeerMessage,
    });
    this._disposers.push(
      computed(() => this.classroomStore.mediaStore.localScreenShareTrackState).observe(
        ({ oldValue, newValue }) => {
          if (oldValue && !newValue) {
            ToastApi.open({
              toastProps: {
                type: 'info',
                content: transI18n('fcr_room_tips_stop_sharing'),
              },
            });
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.isScreenSharing,
        () => {
          if (this.isScreenSharing && this.getters.isBoardWidgetActive && this.getters.isHost) {
            this.getters.boardApi.disable();
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.screenShareStateAccessor,
        (value) => {
          const { trackState, classroomState } = value;
          if (classroomState === ClassroomState.Connected) {
            //only set state when classroom is connected, the state will also be refreshed when classroom state become connected
            this.shareScreenStateKeeperMap
              .get(this.classroomStore.connectionStore.sceneId)
              ?.setShareScreenState(trackState);
          }
        },
      ),
    );
    this._disposers.push(
      computed(() => this.classroomStore.streamStore.localShareStreamUuid).observe(
        ({ newValue, oldValue }) => {
          const { userUuid } = EduClassroomConfig.shared.sessionInfo;

          if (newValue && !oldValue) {
            this.classroomStore.widgetStore.setActive(
              `streamWindow-${newValue}`,
              {
                position: { xaxis: 1, yaxis: 1 },
                size: { width: 1, height: 1 },
                extra: {
                  userUuid,
                },
              },
              userUuid,
            );
          }
          if (!newValue && oldValue) {
            this.classroomStore.widgetStore.deleteWidget(`streamWindow-${oldValue}`);
          }
        },
      ),
    );
    this._disposers.push(
      computed(() => this.classroomStore.connectionStore.scene).observe(
        ({ newValue, oldValue }) => {
          if (oldValue) {
            this.shareScreenStateKeeperMap.get(oldValue.sceneId)?.stop();
          }
          if (newValue) {
            const stateKeeper = new ShareStreamStateKeeper(
              async (targetState: AgoraRteMediaSourceState) => {
                if (targetState === AgoraRteMediaSourceState.started) {
                  const enableAudio =
                    this.classroomStore.mediaStore.localScreenShareAudioTrackState ===
                    AgoraRteMediaSourceState.started;
                  //electron声卡采集合并到本地音频流,所以electron下屏幕共享流的audioPublishState设为Unpublished
                  const audioPublishState = !isElectron()
                    ? enableAudio
                      ? AgoraRteMediaPublishState.Published
                      : AgoraRteMediaPublishState.Unpublished
                    : AgoraRteMediaPublishState.Unpublished;

                  const { rtcToken, streamUuid }: { rtcToken: string; streamUuid: string } =
                    await this.classroomStore.streamStore.publishScreenShare(newValue, {
                      audioState: audioPublishState,
                      audioSourceState:
                        this.classroomStore.mediaStore.localScreenShareAudioTrackState,
                      audioSourceType: AgoraRteAudioSourceType.Loopback,
                    });
                  this.classroomStore.streamStore.initializeScreenShareStream(
                    newValue,
                    streamUuid,
                    rtcToken,
                  );
                } else if (
                  targetState === AgoraRteMediaSourceState.stopped ||
                  targetState === AgoraRteMediaSourceState.error
                ) {
                  await this.classroomStore.streamStore.unpublishScreenShare(newValue);
                  this.classroomStore.streamStore.destroyScreenShareStream(newValue);
                }
              },
            );
            this.shareScreenStateKeeperMap.set(newValue.sceneId, stateKeeper);
          }
        },
      ),
    );
  }
}
