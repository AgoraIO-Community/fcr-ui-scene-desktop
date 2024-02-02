import { AgoraEduClassroomEvent, EduEventCenter, EduStream } from 'agora-edu-core';
import {
  AgoraRteEventType,
  AgoraRteMediaPublishState,
  AgoraRteMediaSourceState,
  AgoraRteVideoSourceType,
  AgoraUser,
  AGRemoteVideoStreamType,
  AGRenderMode,
  AGRtcState,
  bound,
  Scheduler,
} from 'agora-rte-sdk';
import { action, computed, observable, reaction, runInAction } from 'mobx';
import { EduUIStoreBase } from './base';
import { computedFn } from 'mobx-utils';
import { EduStreamUI } from '@ui-scene/utils/stream/struct';
import { v4 as uuidv4 } from 'uuid';
import { Layout } from './type';
type RenderableVideoDom = {
  dom: HTMLDivElement;
  renderMode: AGRenderMode;
};
export class StreamUIStore extends EduUIStoreBase {
  @observable pinnedStreamUuid = '';
  @action.bound
  addPin(streamUuid: string) {
    this.pinnedStreamUuid = streamUuid;
  }
  @action.bound
  removePin() {
    this.pinnedStreamUuid = '';
  }
  @computed get pinDisabled() {
    return this.getters.isScreenSharing && !this.getters.isLocalScreenSharing;
  }

  subSet = new Set<string>();
  @observable awardAnims: { id: string; userUuid: string }[] = [];

  @observable
  waitingSub: EduStream[] = [];
  @observable
  doneSub: EduStream[] = [];
  @observable
  quitSub: EduStream[] = [];
  private _subscribeTask?: Scheduler.Task;
  private _videoDoms = new Map<string, RenderableVideoDom>();
  streamAwardAnims = computedFn((stream: EduStreamUI): { id: string; userUuid: string }[] => {
    return this.awardAnims.filter((anim) => anim.userUuid === stream.fromUser.userUuid);
  });
  @computed get pinnedStream() {
    return this.getters.pinnedUIStream;
  }
  @computed
  get cameraUIStreams() {
    return this.getters.cameraUIStreams;
  }
  @computed
  get localStream() {
    const stream = this.classroomStore.streamStore.streamByStreamUuid.get(
      this.classroomStore.streamStore.localCameraStreamUuid || '',
    );
    return stream ? new EduStreamUI(stream) : stream;
  }

  @action.bound
  subscribeMass(streams: EduStream[]) {
    const subst = streams.filter((s) => {
      return !s.isLocal;
    });
    this.waitingSub = subst;
  }
  @bound
  updateVideoDom(streamUuid: string, renderableVideoDom: RenderableVideoDom) {
    this._videoDoms.set(streamUuid, renderableVideoDom);
  }

  @bound
  removeVideoDom(streamUuid: string) {
    this._videoDoms.delete(streamUuid);
  }
  @bound
  private async _handleSubscribe() {
    if (this.classroomStore.connectionStore.rtcState !== AGRtcState.Connected) {
      return;
    }

    // 页面上显示的视频创列表
    const waitingSub = this.waitingSub.slice();
    // timer休眠时退出的用户
    const quitSub = this.quitSub.slice();

    // 过滤掉timer休眠时退出的用户
    let doneSub = this.doneSub.filter((s) => {
      return !quitSub.includes(s);
    });
    // 先清空列表
    runInAction(() => {
      this.quitSub = [];
    });
    // 已订阅 diff 当前页面视频列表 = 需要取消订阅的流列表
    const toUnsub = doneSub
      .filter((stream) => {
        return !waitingSub.find((waitingStream) => waitingStream.streamUuid === stream.streamUuid);
      })
      .concat(quitSub);
    // 当前页面视频列表 diff 已订阅 = 需要订阅的流列表
    const toSub = waitingSub.filter((stream) => {
      return (
        !doneSub.includes(stream) &&
        stream.videoState === AgoraRteMediaPublishState.Published &&
        stream.videoSourceState === AgoraRteMediaSourceState.started
      );
    });

    const { muteRemoteVideoStreamMass, setupRemoteVideo } = this.classroomStore.streamStore;

    if (toUnsub.length) {
      await muteRemoteVideoStreamMass(toUnsub, true);
      toUnsub.forEach(({ streamUuid }) => {
        this.subSet.delete(streamUuid);
      });

      // 从已订阅列表移除
      doneSub = doneSub.filter((stream) => {
        return !toUnsub.includes(stream);
      });
    }

    let subList: string[] = [];

    if (toSub.length) {
      // 订阅成功的列表
      subList = (await muteRemoteVideoStreamMass(toSub, false)) || [];
      subList.forEach((streamUuid) => {
        this.subSet.add(streamUuid);
      });

      // 取到流对象
      const newSub = toSub.filter(({ streamUuid }) => {
        return subList.includes(streamUuid);
      });

      // 加入已订阅
      doneSub = doneSub.concat(newSub);
    }

    // 重新渲染视频流
    doneSub.forEach((stream) => {
      const renderableVideoDom = this._videoDoms.get(stream.streamUuid);
      if (renderableVideoDom) {
        const needMirror = stream.videoSourceType !== AgoraRteVideoSourceType.ScreenShare;
        setupRemoteVideo(stream, renderableVideoDom.dom, needMirror, renderableVideoDom.renderMode);
        this._videoDoms.delete(stream.streamUuid);
      }
    });
    // 更新已订阅列表
    runInAction(() => {
      this.doneSub = doneSub;
    });
  }
  isUserGranted = computedFn((userUuid: string) => {
    return this.getters.boardApi.grantedUsers.has(userUuid);
  });

  remoteStreamVolume = computedFn((stream?: EduStreamUI) => {
    if (stream) {
      const volume =
        this.classroomStore.streamStore.streamVolumes.get(stream.stream.streamUuid) || 0;
      return volume * 100;
    }
    return 0;
  });

  @computed get localVolume(): number {
    return this.classroomStore.mediaStore.localMicAudioVolume * 100;
  }

  @action.bound
  private _handleUserRemoved(users: AgoraUser[]) {
    const uuids = users.map(({ userUuid }) => userUuid);

    const quitSub = Array.from(this.classroomStore.streamStore.streamByStreamUuid.values()).filter(
      (s) => {
        return uuids.includes(s.fromUser.userUuid);
      },
    );

    this.quitSub = this.quitSub.concat(quitSub);
  }

  /**
   * 移除奖励动画
   * @param id
   */
  @action.bound
  removeAward(id: string) {
    this.awardAnims = this.awardAnims.filter((anim) => anim.id !== id);
  }

  @bound
  _handleRewardsChange(e: AgoraEduClassroomEvent, params: unknown) {
    if (
      e === AgoraEduClassroomEvent.RewardReceived ||
      e === AgoraEduClassroomEvent.BatchRewardReceived
    ) {
      const users = params as { userUuid: string; userName: string }[];
      const anims: { id: string; userUuid: string }[] = [];
      users.forEach((user) => {
        anims.push({ id: uuidv4(), userUuid: user.userUuid });
      });
      if (anims.length > 0) {
        runInAction(() => {
          this.awardAnims = this.awardAnims.concat(anims);
        });
      }
    }
  }
  onDestroy(): void {
    this._disposers.forEach((d) => d());
    this._disposers = [];
    this._subscribeTask?.stop();
    EduEventCenter.shared.offClassroomEvents(this._handleRewardsChange);
  }
  onInstall(): void {
    EduEventCenter.shared.onClassroomEvents(this._handleRewardsChange);
    // todo 定时器优化
    this._subscribeTask = Scheduler.shared.addPollingTask(
      this._handleSubscribe,
      Scheduler.Duration.second(1),
    );
    this._disposers.push(
      reaction(
        () => this.classroomStore.connectionStore.scene,
        (scene) => {
          if (scene) {
            scene.addListener(AgoraRteEventType.UserRemoved, this._handleUserRemoved);
          }
        },
      ),
      reaction(
        () => this.getters.pinnedUIStream,
        () => {
          if (!this.getters.pinnedUIStream) {
            this.removePin();
          }
        },
      ),
      computed(() => this.pinnedStreamUuid).observe(({ newValue, oldValue }) => {
        if (oldValue) {
          console.log('set unpinned remote video stream type to low', oldValue);
          this.classroomStore.streamStore.setRemoteVideoStreamType(
            oldValue,
            AGRemoteVideoStreamType.LOW_STREAM,
          );
        }

        if (newValue) {
          console.log('set pinned remote video stream type to high', newValue);
          this.classroomStore.streamStore.setRemoteVideoStreamType(
            newValue,
            AGRemoteVideoStreamType.HIGH_STREAM,
          );
        }
      }),
      reaction(
        () => ({
          streams: this.getters.galleryStreamsByPage,
          layout: this.getters.layout,
        }),
        ({ streams, layout }) => {
          if (layout === Layout.Grid) {
            streams.forEach((stream) => {
              if (
                !stream.isLocal &&
                stream.stream.videoSourceType !== AgoraRteVideoSourceType.ScreenShare
              ) {
                const shouldPlayHighStream = streams.length <= 4;

                console.log(
                  `play ${shouldPlayHighStream ? 'high' : 'low'} stream for`,
                  stream.stream.streamUuid,
                );

                this.classroomStore.streamStore.setRemoteVideoStreamType(
                  stream.stream.streamUuid,
                  shouldPlayHighStream
                    ? AGRemoteVideoStreamType.HIGH_STREAM
                    : AGRemoteVideoStreamType.LOW_STREAM,
                );
              }
            });
          }
        },
      ),
      reaction(
        () => ({ streams: this.getters.presentationStreamsByPage, layout: this.getters.layout }),
        ({ streams, layout }) => {
          if (layout === Layout.ListOnRight || layout === Layout.ListOnTop) {
            streams.forEach((stream) => {
              if (
                !stream.isLocal &&
                stream.stream.videoSourceType !== AgoraRteVideoSourceType.ScreenShare
              ) {
                console.log('play low stream for', stream.stream.streamUuid);

                this.classroomStore.streamStore.setRemoteVideoStreamType(
                  stream.stream.streamUuid,
                  AGRemoteVideoStreamType.LOW_STREAM,
                );
              }
            });
          }
        },
      ),
    );
  }
}
