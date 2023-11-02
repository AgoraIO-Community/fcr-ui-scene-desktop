import { EduStreamUI } from '@ui-scene/utils/stream/struct';
import { EduRoleTypeEnum, iterateMap } from 'agora-edu-core';
import { bound } from 'agora-rte-sdk';
import { action, computed, observable } from 'mobx';
import { EduUIStoreBase } from './base';
import { computedFn } from 'mobx-utils';
import { checkCameraEnabled, checkMicEnabled } from '@ui-scene/utils/hooks/use-device-switch';
export enum ParticipantsTableSortKeysEnum {
  Auth = 'Auth',
  Camera = 'Camera',
  Microphone = 'Microphone',
  Reward = 'Reward',
  RaiseHand = 'Raise hand',
}
export type ParticipantsOrderDirection = 'asc' | 'desc';
export class ParticipantsUIStore extends EduUIStoreBase {
  @observable participantsDialogVisible = false;
  @action.bound
  setParticipantsDialogVisible(visible: boolean) {
    this.participantsDialogVisible = visible;
  }
  @action.bound
  toggleParticipantsDialogVisible() {
    this.participantsDialogVisible = !this.participantsDialogVisible;
  }
  @observable orderKey = 'Auth';
  @action.bound
  setOrderKey(orderKey: string) {
    this.orderKey = orderKey;
  }
  @observable orderDirection: ParticipantsOrderDirection = 'asc';
  @action.bound
  setOrderDirection(orderDirection: ParticipantsOrderDirection) {
    this.orderDirection = orderDirection;
  }
  participants = [];
  tableIconSize = 28;
  get isAudience() {
    return this.getters.isAudience;
  }
  get isHost() {
    return this.getters.isHost;
  }
  get isTeacher() {
    return this.getters.isTeacher;
  }
  isHostByUserRole = (role: EduRoleTypeEnum) => {
    return role === EduRoleTypeEnum.teacher;
  };
  @observable searchKey = '';
  @action.bound
  setSearchKey(text: string) {
    this.searchKey = text;
  }
  @computed
  get participantList() {
    const { groupUuidByUserUuid } = this.classroomStore.groupStore;
    const { list } = iterateMap(this.classroomStore.userStore.users, {
      onFilter: (_, item) => {
        return (
          item.userRole === EduRoleTypeEnum.teacher || item.userRole === EduRoleTypeEnum.student
        );
      },
      onMap: (_, item) => {
        const stream = this.getters.userCameraStreamByUserUuid(item.userUuid);
        const uiStream = stream ? new EduStreamUI(stream) : undefined;
        const currentRoomId = this.classroomStore.connectionStore?.scene?.sceneId;
        const userGroupUuid = groupUuidByUserUuid.get(item.userUuid) || currentRoomId;
        return {
          user: item,
          stream: uiStream,
          notAllowed: currentRoomId !== userGroupUuid,
        };
      },
    });
    return list;
  }
  @computed
  get participantTableList() {
    return this.participantList
      .filter((item) => {
        return item.user.userName.toLowerCase().includes(this.searchKey.toLowerCase());
      })
      .slice()
      .sort((prev, next) => {
        if (this.isHostByUserRole(prev.user.userRole)) {
          return -1;
        } else if (this.isHostByUserRole(next.user.userRole)) {
          return 1;
        }
        if (this.orderKey === ParticipantsTableSortKeysEnum.Auth) {
          if (
            this.getters.boardApi.grantedUsers.has(prev.user.userUuid) &&
            !this.getters.boardApi.grantedUsers.has(next.user.userUuid)
          ) {
            return this.orderDirection === 'asc' ? -1 : 1;
          } else if (
            this.getters.boardApi.grantedUsers.has(next.user.userUuid) &&
            !this.getters.boardApi.grantedUsers.has(prev.user.userUuid)
          ) {
            return this.orderDirection === 'asc' ? 1 : -1;
          }
          return 0;
        }
        if (this.orderKey === ParticipantsTableSortKeysEnum.RaiseHand) {
          const isHandsUpByUserUuid =
            this.getters.classroomUIStore.actionBarUIStore.isHandsUpByUserUuid;
          if (isHandsUpByUserUuid(prev.user.userUuid) && !isHandsUpByUserUuid(next.user.userUuid)) {
            return this.orderDirection === 'asc' ? -1 : 1;
          } else if (
            isHandsUpByUserUuid(next.user.userUuid) &&
            !isHandsUpByUserUuid(prev.user.userUuid)
          ) {
            return this.orderDirection === 'asc' ? 1 : -1;
          }
          return 0;
        }
        if (this.orderKey === ParticipantsTableSortKeysEnum.Camera) {
          if (checkCameraEnabled(prev.stream) && !checkCameraEnabled(next.stream)) {
            return this.orderDirection === 'asc' ? -1 : 1;
          } else if (checkCameraEnabled(next.stream) && !checkCameraEnabled(prev.stream)) {
            return this.orderDirection === 'asc' ? 1 : -1;
          }
          return 0;
        }
        if (this.orderKey === ParticipantsTableSortKeysEnum.Microphone) {
          if (checkMicEnabled(prev.stream) && !checkMicEnabled(next.stream)) {
            return this.orderDirection === 'asc' ? -1 : 1;
          } else if (checkMicEnabled(next.stream) && !checkMicEnabled(prev.stream)) {
            return this.orderDirection === 'asc' ? 1 : -1;
          }
          return 0;
        }
        if (this.orderKey === ParticipantsTableSortKeysEnum.Reward) {
          const getRewardCount = (userUuid: string) => {
            return this.classroomStore.userStore.rewards.get(userUuid) || 0;
          };
          if (getRewardCount(prev.user.userUuid) > getRewardCount(next.user.userUuid)) {
            return this.orderDirection === 'asc' ? -1 : 1;
          } else if (getRewardCount(next.user.userUuid) > getRewardCount(prev.user.userUuid)) {
            return this.orderDirection === 'asc' ? 1 : -1;
          }
          return 0;
        }
        return 0;
      });
  }

  @computed get participantStudentList() {
    return this.participantList.filter(({ user }) => user.userRole === EduRoleTypeEnum.student);
  }
  @bound
  sendReward(userUuid: string) {
    const { sendRewards } = this.classroomStore.roomStore;
    return sendRewards([
      {
        userUuid,
        changeReward: 1,
      },
    ]);
  }
  @bound
  grantPrivilege(userUuid: string, granted: boolean) {
    return this.getters.boardApi.grantPrivilege(userUuid, granted);
  }
  rewardsByUserUuid = computedFn((userUuid: string) => {
    return this.classroomStore.userStore.rewards.get(userUuid) || 0;
  });

  onDestroy(): void {
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
  onInstall(): void {}
}
