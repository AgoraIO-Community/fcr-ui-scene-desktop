import { EduUIStoreBase } from './base';
import { computed } from 'mobx';
import { number2Percent } from '@ui-scene/utils';
import { ClassState, EduClassroomConfig, RecordStatus } from 'agora-edu-core';
import dayjs from 'dayjs';

import {
  AGNetworkQuality,
  AgoraRteAudioSourceType,
  AgoraRteMediaSourceState,
  AgoraRteVideoSourceType,
} from 'agora-rte-sdk';
export class StatusBarUIStore extends EduUIStoreBase {
  get roomName() {
    return this.getters.roomName;
  }
  get roomUuid() {
    return this.getters.roomUuid;
  }
  get isHost() {
    return this.getters.isHost;
  }
  get isStudent() {
    return this.getters.isStudent;
  }
  @computed
  get localUser() {
    return this.getters.localUser;
  }
  /**
   * CPU 用量
   * @returns
   */
  @computed
  get cpuValue() {
    return this.classroomStore.statisticsStore.cpu;
  }

  /**
   * CPU 负载百分比
   * @returns
   */
  @computed
  get cpuLabel() {
    if (
      this.classroomStore.statisticsStore.cpu === -1 ||
      this.classroomStore.statisticsStore.cpu === undefined ||
      this.classroomStore.statisticsStore.cpuTotal === -1 ||
      this.classroomStore.statisticsStore.cpuTotal === undefined
    ) {
      return '-- %';
    }
    return `${number2Percent(this.classroomStore.statisticsStore.cpu, 0)} / ${number2Percent(
      this.classroomStore.statisticsStore.cpuTotal,
      0,
    )}`;
  }

  /**
   * 丢包率
   * @returns
   */
  @computed
  get packetLoss() {
    if (this.classroomStore.statisticsStore.packetLoss === undefined) {
      return '-- %';
    }
    return number2Percent(this.classroomStore.statisticsStore.packetLoss, 2);
  }

  /**
   * 网络质量状态
   * @returns
   */
  @computed
  get networkQuality() {
    let hasPublishedScreenStream = false;
    let hasPublishedCameraStream = false;
    let hasPublishedMicStream = false;

    const { streamByStreamUuid, streamByUserUuid } = this.classroomStore.streamStore;

    const { userUuid } = EduClassroomConfig.shared.sessionInfo;
    const streamUuids = streamByUserUuid.get(userUuid) || new Set();

    for (const streamUuid of streamUuids) {
      const stream = streamByStreamUuid.get(streamUuid);
      if (stream && stream.videoSourceType === AgoraRteVideoSourceType.ScreenShare) {
        hasPublishedScreenStream = true;
      }

      if (
        stream &&
        stream.videoSourceType === AgoraRteVideoSourceType.Camera &&
        stream.audioSourceState === AgoraRteMediaSourceState.started
      ) {
        hasPublishedCameraStream = true;
      }

      if (
        stream &&
        stream.audioSourceType === AgoraRteAudioSourceType.Mic &&
        stream.audioSourceState === AgoraRteMediaSourceState.started
      ) {
        hasPublishedMicStream = true;
      }
    }

    const { downlinkNetworkQuality, uplinkNetworkQuality } = this.classroomStore.statisticsStore;

    if ([downlinkNetworkQuality, uplinkNetworkQuality].includes(AGNetworkQuality.down)) {
      return AGNetworkQuality.down;
    }

    if (hasPublishedScreenStream || hasPublishedCameraStream || hasPublishedMicStream) {
      return Math.min(downlinkNetworkQuality, uplinkNetworkQuality) as AGNetworkQuality;
    }

    return downlinkNetworkQuality;
  }

  /**
   * 网络延时
   * @returns
   */
  @computed
  get delay() {
    if (this.classroomStore.statisticsStore.delay === undefined) {
      return `-- ms`;
    }
    return `${Math.floor(this.classroomStore.statisticsStore.delay)} ms`;
  }
  @computed
  get classroomSchedule() {
    return this.classroomStore.roomStore.classroomSchedule;
  }
  @computed get afterClass() {
    return this.classroomSchedule.state === ClassState.afterClass;
  }
  @computed
  get classStatusText() {
    const duration = this.classTimeDuration || 0;

    if (duration < 0) {
      return `-- : --`;
    }

    switch (this.classroomSchedule.state) {
      case ClassState.beforeClass:
        return `${this.formatCountDown(duration)}`;
      case ClassState.ongoing:
        return `${this.formatCountDown(duration)}`;
      case ClassState.afterClass:
        return `${this.formatCountDown(duration)}`;
      default:
        return `-- : --`;
    }
  }
  @computed
  get calibratedTime() {
    const { clockTime, clientServerTimeShift } = this.classroomStore.roomStore;
    return clockTime + clientServerTimeShift;
  }
  @computed
  get classTimeDuration(): number {
    let duration = -1;
    if (this.classroomSchedule) {
      switch (this.classroomSchedule.state) {
        case ClassState.beforeClass:
          if (this.classroomSchedule.startTime !== undefined) {
            duration = Math.max(this.classroomSchedule.startTime - this.calibratedTime, 0);
          }
          break;
        case ClassState.ongoing:
          if (this.classroomSchedule.startTime !== undefined) {
            duration = Math.max(this.calibratedTime - this.classroomSchedule.startTime, 0);
          }
          break;
        case ClassState.afterClass:
          if (
            this.classroomSchedule.startTime !== undefined &&
            this.classroomSchedule.duration !== undefined
          ) {
            duration = Math.max(this.calibratedTime - this.classroomSchedule.startTime, 0);
          }
          break;
      }
    }
    return duration;
  }
  private formatCountDown(ms: number): string {
    const duration = dayjs.duration(ms);

    if (duration.days() > 0) {
      const mmss = duration.format('mm : ss');
      const h = Math.floor(duration.asHours());
      return `${h} : ${mmss}`;
    }

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60 * 60) {
      return duration.format('mm : ss');
    }

    return duration.format('HH : mm : ss');
  }
  @computed
  get recordStatus() {
    if (
      this.classroomStore.roomStore.recordStatus === RecordStatus.started &&
      this.classroomStore.roomStore.recordReady
    ) {
      return RecordStatus.started;
    } else if (
      this.classroomStore.roomStore.recordStatus === RecordStatus.starting ||
      (this.classroomStore.roomStore.recordStatus === RecordStatus.started &&
        !this.classroomStore.roomStore.recordReady)
    ) {
      return RecordStatus.starting;
    } else {
      return RecordStatus.stopped;
    }
  }
  @computed
  get isRecording() {
    return this.recordStatus === RecordStatus.started;
  }
  @computed
  get isRecordStarting() {
    return this.recordStatus === RecordStatus.starting;
  }
  @computed
  get isRecordStoped() {
    return this.recordStatus === RecordStatus.stopped;
  }
  onDestroy(): void {
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
  onInstall(): void {}
}
