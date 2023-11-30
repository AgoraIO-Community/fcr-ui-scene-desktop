import { Log, bound, transI18n } from 'agora-common-libs';
import { EduUIStoreBase } from './base';
import { action, computed, observable, reaction, runInAction, when } from 'mobx';
import {
  AgoraEduClassroomEvent,
  ClassroomState,
  EduClassroomConfig,
  EduEventCenter,
  EduRoleTypeEnum,
  GroupDetail,
  GroupState,
  PatchGroup,
  SceneType,
} from 'agora-edu-core';
import difference from 'lodash/difference';
import range from 'lodash/range';
import findLast from 'lodash/findLast';
import { v4 as uuidv4 } from 'uuid';
import { AGRtcConnectionType, AGRtcState, Scheduler } from 'agora-rte-sdk';
import { isTeacher } from '@ui-scene/utils/check';
import { getConfig } from '@ui-scene/utils/launch-options-holder';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

enum GroupMethod {
  Auto = 1,
  Manual = 2,
}

@Log.attach()
export class BreakoutUIStore extends EduUIStoreBase {
  /**
   * 每个分组学生最大15人
   */
  static readonly MAX_USER_COUNT = 15;

  /**
   * 总分组数
   */
  static readonly MAX_GROUP_COUNT = 20;
  /**
   * 当前分组序号
   */
  private _groupSeq = 0;
  /**
   * 请求中状态
   */
  private _requestLock = new Set();

  /**
   * 分组邀请所对应的窗口ID
   */
  private _dialogsMap = new Map<string, string>();
  /**
   * 消息提示
   */
  @observable
  private _toasts: { text: string; id: string }[] = [];
  /**
   * 请求帮助列表
   */
  @observable
  private _helpRequestList: { groupName: string; groupUuid: string }[] = [];
  /**
   * 分组窗口是否打开
   */
  @observable
  private _dialogVisible = false;
  /**
   * 创建步骤:
   * 0 选择自动\手动分组界面
   * 1 分组界面
   */
  @observable
  private _wizardState = 0;
  /**
   * 正在加入分组中
   */
  @observable
  private _isJoiningSubRoom = false;
  /**
   * 本地分组暂存信息
   */
  @observable
  private _localGroups: Map<string, GroupDetail> = new Map();

  /**
   * 正在加入分组
   */
  @computed
  get isJoiningSubRoom() {
    return this._isJoiningSubRoom;
  }
  /**
   * 请求列表
   */
  @computed
  get helpRequestList() {
    return this._helpRequestList;
  }
  /**
   * 分组窗口
   */
  @computed
  get breakoutDialogVisible() {
    return this._dialogVisible;
  }
  /**
   * 当前创建步骤
   */
  @computed
  get wizardState() {
    return this._wizardState;
  }
  /**
   * 提示列表
   */
  @computed
  get toasts() {
    return this._toasts;
  }
  /**
   * 分组列表
   */
  @computed
  get groups() {
    const list: {
      id: string;
      text: string;
      sort: number;
      children: { id: string; text: string }[];
    }[] = [];

    const unknownName = transI18n('fcr_group_tips_unknown_username');

    const users = this.mainRoomUsers;

    const teacherList = this.mainRoomTeachers;

    const assistantList = this.mainRoomAssistants;

    this.groupDetails.forEach((group, groupUuid) => {
      const students = new Map<string, { id: string; text: string; notJoined?: boolean }>();

      group.users.forEach(({ userUuid, notJoined }) => {
        if (!teacherList.has(userUuid) && !assistantList.has(userUuid)) {
          students.set(userUuid, {
            id: userUuid,
            text: users.get(userUuid)?.userName || unknownName,
            notJoined,
          });
        }
      });

      const tree = {
        id: groupUuid,
        text: group.groupName,
        sort: group.sort || 0,
        children: [...students.values()],
      };

      list.push(tree);
    });

    list.sort(({ sort: sort1 }, { sort: sort2 }) => {
      return sort1 - sort2;
    });

    return list;
  }

  /**
   * 分组详情
   */
  @computed
  get groupDetails() {
    const { groupDetails } = this.classroomStore.groupStore;
    this._localGroups.values();
    const localGroups = this._localGroups;
    return this.groupState === GroupState.OPEN ? groupDetails : localGroups;
  }

  /**
   * 学生列表
   */
  @computed
  get students() {
    const list: { userUuid: string; userName: string; groupUuid: string | undefined }[] = [];

    this.mainRoomStudents.forEach((user) => {
      const groupUuid = this.getUserGroupUuid(user.userUuid);

      list.push({
        userUuid: user.userUuid,
        userName: user.userName,
        groupUuid,
      });
    });

    return list;
  }

  /**
   * 未分组学生列表
   */
  @computed
  get ungroupedCount() {
    const count = this.students.reduce((prev, { groupUuid }) => {
      if (!groupUuid) {
        prev += 1;
      }

      return prev;
    }, 0);
    return count;
  }

  @computed
  get numberToBeAssigned() {
    return this.mainRoomStudents.size;
  }
  @computed
  get mainRoomUsers() {
    if (this.classroomStore.connectionStore.classroomState !== ClassroomState.Connected) {
      return new Map();
    }
    return this.classroomStore.userStore.mainRoomDataStore.users;
  }
  @computed
  get mainRoomStudents() {
    if (this.classroomStore.connectionStore.classroomState !== ClassroomState.Connected) {
      return new Map();
    }
    return this.classroomStore.userStore.mainRoomDataStore.studentList;
  }
  @computed
  get mainRoomTeachers() {
    if (this.classroomStore.connectionStore.classroomState !== ClassroomState.Connected) {
      return new Map();
    }
    return this.classroomStore.userStore.mainRoomDataStore.teacherList;
  }

  @computed
  get mainRoomAssistants() {
    if (this.classroomStore.connectionStore.classroomState !== ClassroomState.Connected) {
      return new Map();
    }
    return this.classroomStore.userStore.mainRoomDataStore.assistantList;
  }

  /**
   * 未分组用户列表
   */
  @computed
  get ungroupedList() {
    this._localGroups.values();
    const studentList = this.mainRoomStudents;
    const ungrouped: { id: string; text: string }[] = [];

    studentList.forEach((student, studentUuid) => {
      const groupUuid = this.getUserGroupUuid(studentUuid);
      const user = this.getGroupUserByUuid(studentUuid);

      if (!groupUuid && !user?.notJoined) {
        ungrouped.push({ id: studentUuid, text: student.userName });
      }
    });

    return ungrouped;
  }

  /**
   * 当前是否开放分组
   */
  @computed
  get groupState() {
    return this.classroomStore.groupStore.state;
  }

  /**
   * 当前房间
   */
  @computed
  get currentSubRoomInfo() {
    const { groupUuidByUserUuid } = this.classroomStore.groupStore;
    const currentSubRoom = groupUuidByUserUuid.get(EduClassroomConfig.shared.sessionInfo.userUuid);
    if (currentSubRoom) {
      const groupInfo = this.groupDetails.get(currentSubRoom);

      return groupInfo;
    }
  }

  /**
   * 老师所在房间
   */
  @computed
  get teacherGroupUuid() {
    if (this.classroomStore.connectionStore.classroomState !== ClassroomState.Connected) {
      return undefined;
    }
    const teachers = this.classroomStore.userStore.mainRoomDataStore.teacherList;

    if (teachers.size) {
      const teacherUuid = teachers.keys().next().value;
      const { groupUuidByUserUuid } = this.classroomStore.groupStore;

      const teacherGroupUuid = groupUuidByUserUuid.get(teacherUuid);
      return teacherGroupUuid;
    }
    return undefined;
  }

  @action.bound
  setDialogVisible(visible: boolean) {
    this._dialogVisible = visible;
  }

  @action.bound
  setWizardState(state: 0 | 1) {
    this._wizardState = state;
  }

  /**
   * 获取学生所在组ID
   * @param userUuid
   */
  @bound
  getUserGroupUuid(userUuid: string) {
    const map: Map<string, string> = new Map();

    this.groupDetails.forEach((group, groupUuid) => {
      group.users.forEach(({ userUuid, notJoined }) => {
        if (!notJoined) {
          map.set(userUuid, groupUuid);
        }
      });
    });

    return map.get(userUuid);
  }

  /**
   * 获取学生信息
   * @param userUuid
   */
  @bound
  getGroupUserByUuid(userUuid: string) {
    return this.classroomStore.groupStore.userByUuid.get(userUuid);
  }

  /**
   * 设置分组用户列表
   * @param groupUuid
   * @param users
   */
  @action.bound
  setGroupUsers(groupUuid: string, users: string[]) {
    this.logger.info('Set group users', groupUuid, users);

    const patches: PatchGroup[] = [];

    this.groupDetails.forEach((group, uuid) => {
      if (groupUuid === uuid) {
        const groupUsers = group.users.map(({ userUuid }) => userUuid);

        const removeUsers = difference(groupUsers, users);

        const addUsers = difference(users, groupUsers);

        patches.push({
          groupUuid,
          addUsers,
          removeUsers,
        });
      }
    });

    patches.forEach(({ removeUsers = [], addUsers = [], groupUuid }) => {
      const groupDetail = this._localGroups.get(groupUuid);

      if (groupDetail) {
        const users = addUsers.map((userUuid) => ({ userUuid }));

        const newUsers = groupDetail.users
          .filter(({ userUuid }) => !removeUsers.includes(userUuid))
          .concat(users);

        groupDetail.users = newUsers;

        this._localGroups.set(groupUuid, groupDetail);
      }
    });
  }

  /**
   * 重命名组
   * @param groupUuid 分组ID
   * @param groupName 新分组名
   */
  @action.bound
  renameGroupName(groupUuid: string, groupName: string) {
    if (this._isGroupExisted({ groupUuid, groupName })) {
      this.addToast({ text: transI18n('fcr_group_tips_name_already_exists') });
      return;
    }

    if (this.groupState === GroupState.OPEN) {
      this.classroomStore.groupStore.updateGroupInfo([
        {
          groupUuid,
          groupName,
        },
      ]);
    } else {
      const groupDetail = this._localGroups.get(groupUuid);

      if (groupDetail) {
        groupDetail.groupName = groupName;
        this._localGroups.set(groupUuid, groupDetail);
      }
    }
  }

  getLastOrder() {
    const last = findLast(this.groups, () => true);

    return last?.sort ?? 0;
  }

  /**
   * 新增组
   */
  @action.bound
  addGroup() {
    if (this.groupDetails.size >= BreakoutUIStore.MAX_GROUP_COUNT) {
      this.addToast({
        text: transI18n('fcr_group_tips_group_number_exceeds', {
          reason1: BreakoutUIStore.MAX_GROUP_COUNT,
        }),
      });
      return;
    }
    const newGroup = { groupUuid: uuidv4(), groupName: this._generateGroupName() };

    if (this._isGroupExisted(newGroup)) {
      newGroup.groupName += ' 1';
    }

    if (this.groupState === GroupState.OPEN) {
      this.classroomStore.groupStore.addGroups([
        {
          groupName: newGroup.groupName,
          users: [],
          sort: this.getLastOrder() + 1,
        },
      ]);
    } else {
      this._localGroups.set(newGroup.groupUuid, {
        groupName: newGroup.groupName,
        users: [],
        sort: this.getLastOrder() + 1,
      });
    }

    this.addToast({ text: transI18n('fcr_group_tips_group_added') });
  }

  @action.bound
  addToast(message: { text: string }) {
    const id = uuidv4();
    Scheduler.shared.addDelayTask(() => {
      runInAction(() => {
        this._toasts = this._toasts.filter((item) => id !== item.id);
      });
    }, Scheduler.Duration.second(3));

    this._toasts = this._toasts.slice(this._toasts.length - 6, this.toasts.length);

    this._toasts.unshift({ id, text: message.text });
  }

  /**
   * 删除组
   * @param groupUuid 组id
   */
  @action.bound
  removeGroup(groupUuid: string) {
    if (this.groupState === GroupState.OPEN) {
      this.classroomStore.groupStore.removeGroups([groupUuid]);
    } else {
      this._localGroups.delete(groupUuid);
    }
  }

  /**
   * 移动用户
   * @param fromGroupUuid
   * @param toGroupUuid
   * @param user
   */
  @action.bound
  moveUserToGroup(fromGroupUuid: string, toGroupUuid: string, userUuid: string) {
    const group = this.groupDetails.get(toGroupUuid);

    if (group) {
      const studentsCount = group.users.reduce((total, { userUuid }) => {
        if (this.classroomStore.userStore.studentList.get(userUuid)) total += 1;
        return total;
      }, 0);
      // check students number
      if (studentsCount >= BreakoutUIStore.MAX_USER_COUNT) {
        this.addToast({
          text: transI18n('fcr_group_tips_group_is_full', {
            reason1: BreakoutUIStore.MAX_USER_COUNT,
          }),
        });
        return;
      }
    }

    if (this.groupState === GroupState.OPEN) {
      if (!toGroupUuid) {
        return;
      }
      if (!fromGroupUuid) {
        this.classroomStore.groupStore.updateGroupUsers(
          [
            {
              groupUuid: toGroupUuid,
              addUsers: [userUuid],
            },
          ],
          true,
        );
      } else {
        this.classroomStore.groupStore.moveUsersToGroup(fromGroupUuid, toGroupUuid, [userUuid]);
      }
    } else {
      const fromGroup = this._localGroups.get(fromGroupUuid);
      const toGroup = this._localGroups.get(toGroupUuid);

      if (fromGroup) {
        fromGroup.users = fromGroup.users.filter(({ userUuid: uuid }) => uuid !== userUuid);
        // toGroup.users = toGroup.users.concat([{ userUuid }]);
        this._localGroups.set(fromGroupUuid, fromGroup);
        // this._localGroups.set(toGroupUuid, toGroup);
      }

      if (toGroup) {
        toGroup.users = toGroup.users.concat([{ userUuid }]);
        this._localGroups.set(toGroupUuid, toGroup);
      }
    }
  }

  /**
   * 用户组互换
   * @param userUuid1
   * @param userUuid2
   */
  @bound
  interchangeGroup(userUuid1: string, userUuid2: string) {
    const patches: PatchGroup[] = [];

    let groupUuid1 = '';
    let groupUuid2 = '';

    if (this.groupState === GroupState.CLOSE) {
      throw new Error('invalid group state');
    }

    this.classroomStore.groupStore.groupDetails.forEach(({ users }, gropuUuid) => {
      const hasUser1 = users.some(({ userUuid }) => userUuid === userUuid1);
      if (hasUser1) {
        groupUuid1 = gropuUuid;
      }

      const hasUser2 = users.find(({ userUuid }) => userUuid === userUuid2);
      if (hasUser2) {
        groupUuid2 = gropuUuid;
      }
    });

    if (groupUuid1 && groupUuid2) {
      patches.push({
        groupUuid: groupUuid1,
        addUsers: [userUuid2],
        removeUsers: [userUuid1],
      });

      patches.push({
        groupUuid: groupUuid2,
        addUsers: [userUuid1],
        removeUsers: [userUuid2],
      });

      this.classroomStore.groupStore.updateGroupUsers(patches);
    } else {
      this.logger.info('cannot know which group the user is in');
    }
  }

  @bound
  async startGroup({ copyBoardState }: { copyBoardState: boolean }) {
    const groupDetails: GroupDetail[] = [];

    if (!this._localGroups.size) {
      this.addToast({ text: transI18n('fcr_group_tips_no_groups_to_start') });
      return;
    }

    const lockName = 'start-group';
    if (this._requestLock.has(lockName)) {
      this.addToast({ text: transI18n('fcr_group_tips_initializing') });
      return;
    }
    try {
      this._requestLock.add(lockName);
      this._localGroups.forEach((group) => {
        groupDetails.push({
          groupName: group.groupName,
          users: group.users,
          sort: group.sort,
        });
      });

      // stop carousel
      await this.classroomStore.roomStore.stopCarousel();
      await this.classroomStore.groupStore.startGroup(groupDetails, copyBoardState);
      this.getters.boardApi.saveAttributes();
    } catch (e) {
      // this.shareUIStore.addGenericErrorDialog(e as AGError);
    } finally {
      this._requestLock.delete(lockName);
    }
  }

  /**
   * 结束分组
   */
  @bound
  async stopGroup() {
    const lockName = 'stop-group';
    if (this._requestLock.has(lockName)) {
      this.addToast({ text: transI18n('fcr_group_tips_stopping') });
      return;
    }
    try {
      this._requestLock.add(lockName);

      if (this.groupState === GroupState.OPEN) {
        await this.classroomStore.groupStore.stopGroup();
      }
      runInAction(() => {
        this._localGroups = new Map();
        this._groupSeq = 0;
        this._wizardState = 0;
      });
    } catch (e) {
      // this.shareUIStore.addGenericErrorDialog(e as AGError);
    } finally {
      this._requestLock.delete(lockName);
    }
  }

  /**
   * 创建分组
   * @param type 1 auto 2 manual MANUAL
   * @param group
   */
  @action.bound
  createGroups(type: 1 | 2, count: number) {
    this._localGroups = new Map();
    this._groupSeq = 0;

    if (type === GroupMethod.Manual) {
      range(0, count).forEach((i) => {
        const groupDetail = {
          groupName: this._generateGroupName(),
          users: [],
          sort: i,
        };

        this._localGroups.set(`${uuidv4()}`, groupDetail);
      });
    } else if (type === GroupMethod.Auto) {
      const groupIds: string[] = [];
      range(0, count).forEach((i) => {
        const groupDetail = {
          groupName: this._generateGroupName(),
          users: [],
          sort: i,
        };

        const groupId = `${uuidv4()}`;

        groupIds.push(groupId);

        this._localGroups.set(groupId, groupDetail);
      });
      let index = 0;
      this.classroomStore.userStore.studentList.forEach((user, userUuid) => {
        index = index % count;
        const groupId = groupIds[index];
        const groupDetail = this._localGroups.get(groupId);
        if (groupDetail && groupDetail.users.length < BreakoutUIStore.MAX_USER_COUNT) {
          groupDetail.users.push({ userUuid });
        }
        index += 1;
      });
    }
  }

  /**
   * 获取分组内当前人数
   * @param groupUuid
   * @returns
   */
  @bound
  getGroupUserCount(groupUuid: string) {
    return this.groupDetails.get(groupUuid)?.users.reduce((prev, { userUuid }) => {
      if (this.mainRoomStudents.has(userUuid)) prev += 1;
      return prev;
    }, 0);
  }
  /**
   * 加入子房间
   * @param groupUuid
   */
  @bound
  async joinSubRoom(groupUuid: string) {
    if (groupUuid === this.classroomStore.groupStore.currentSubRoom) {
      this.addToast({ text: transI18n('fcr_group_tips_already_in_group') });
      return;
    }
    const lockName = 'join-sub-room';
    if (this._requestLock.has(lockName)) {
      this.addToast({ text: transI18n('fcr_group_tips_joining') });
      return;
    }
    try {
      this._requestLock.add(lockName);
      if (!this.classroomStore.groupStore.currentSubRoom) {
        await this.classroomStore.groupStore.updateGroupUsers([
          {
            groupUuid: groupUuid,
            addUsers: [EduClassroomConfig.shared.sessionInfo.userUuid],
          },
        ]);
      } else {
        await this.classroomStore.groupStore.moveUsersToGroup(
          this.classroomStore.groupStore.currentSubRoom,
          groupUuid,
          [EduClassroomConfig.shared.sessionInfo.userUuid],
        );
      }
    } catch (e) {
    } finally {
      this._requestLock.delete(lockName);
    }
  }

  /**
   * 发送广播消息
   * @param message
   * @returns
   */
  @bound
  broadcastMessage(message: string) {
    try {
      message = message.trim().replaceAll('\n', '');

      if (!message) {
        return;
      }

      this.classroomStore.groupStore.broadcastMessage(message);
    } catch (e) {
      // this.shareUIStore.addGenericErrorDialog(e as AGError);
    }
  }

  @action.bound
  acceptInvite(groupUuid: string) {
    this._helpRequestList = this._helpRequestList.filter((item) => item.groupUuid !== groupUuid);
    this.classroomStore.groupStore.acceptGroupInvite(groupUuid);
  }

  @action.bound
  rejectInvite(groupUuid: string) {
    this._helpRequestList = this._helpRequestList.filter((item) => item.groupUuid !== groupUuid);
    this.classroomStore.groupStore.rejectGroupInvite(groupUuid);
  }

  @bound
  async leaveSubRoom() {
    const lockName = 'leave-sub-room';
    if (this._requestLock.has(lockName)) {
      this.addToast({ text: transI18n('fcr_group_tips_leaving') });
      return;
    }
    try {
      this._requestLock.add(lockName);
      const currentRoomUuid = this.classroomStore.groupStore.currentSubRoom;
      const { userUuid } = EduClassroomConfig.shared.sessionInfo;
      if (currentRoomUuid) {
        await this.classroomStore.groupStore.removeGroupUsers(currentRoomUuid, [userUuid]);
      }
    } catch (e) {
    } finally {
      this._requestLock.delete(lockName);
    }
  }

  private _isGroupExisted({ groupName, groupUuid }: { groupName: string; groupUuid: string }) {
    return this.groups.some(({ text, id }) => groupName === text && id !== groupUuid);
  }

  private _generateGroupName() {
    const nextSeq = (this._groupSeq += 1);

    return `${transI18n('fcr_group_label_default_name')} ${nextSeq.toString().padStart(2, '0')}`;
  }

  @action
  private _setConnectionState(state: boolean) {
    this._isJoiningSubRoom = state;
  }

  private async _waitUntilLeft() {
    await when(() => this.classroomStore.connectionStore.rtcState === AGRtcState.Idle);
  }

  private async _waitUntilConnected() {
    if (
      [AGRtcState.Connecting, AGRtcState.Reconnecting].includes(
        this.classroomStore.connectionStore.rtcState,
      )
    ) {
      await when(() => this.classroomStore.connectionStore.rtcState === AGRtcState.Connected);
    }
  }

  private async _waitUntilJoined() {
    if (this._isJoiningSubRoom) {
      await when(() => !this._isJoiningSubRoom);
    }
  }

  private _grantWhiteboard() {
    this.getters.boardApi.grantPrivilege(EduClassroomConfig.shared.sessionInfo.userUuid, true);
  }

  @bound
  private async _joinSubRoom() {
    await this._waitUntilJoined();

    this._setConnectionState(true);

    const roomUuid = this.classroomStore.groupStore.currentSubRoom;

    if (!roomUuid) {
      this.logger.error('cannot find roomUuid');
      this._setConnectionState(false);
      return;
    }

    let joinSuccess = false;
    try {
      const {
        isCameraDeviceEnabled,
        isAudioRecordingDeviceEnabled,
        pretestCameraEnabled,
        pretestMicEnabled,
      } = this.getters.classroomUIStore.deviceSettingUIStore;
      if (isTeacher()) {
        this.logger.info("remove teacher's stream");
        await this.classroomStore.connectionStore.scene?.localUser?.deleteLocalMediaStream();
        this.logger.info("remove teacher's stream success");
      }

      await this._waitUntilConnected();

      if (this.classroomStore.connectionStore.rtcSubState !== AGRtcState.Idle) {
        this.classroomStore.mediaStore.stopScreenShareCapture();
        this.classroomStore.connectionStore.leaveRTC(AGRtcConnectionType.sub);
      }

      await this.classroomStore.connectionStore.leaveRTC();

      await this._waitUntilLeft();
      while (true) {
        try {
          const { setPretestCameraEnabled, setPretestMicEnabled } =
            this.getters.classroomUIStore.deviceSettingUIStore;
          setPretestCameraEnabled(pretestCameraEnabled || isCameraDeviceEnabled);
          setPretestMicEnabled(pretestMicEnabled || isAudioRecordingDeviceEnabled);
          await this.classroomStore.connectionStore.joinSubRoom(roomUuid);
          await this.getters.classroomUIStore.enableDualStream(
            this.classroomStore.connectionStore.scene,
          );
          await this.classroomStore.connectionStore.joinRTC();
        } catch (e) {
          this.logger.error('change sub room err', e);
          await sleep(1000);
          continue;
        }
        break;
      }

      joinSuccess = true;
    } catch (e) {
      //   this.shareUIStore.addGenericErrorDialog(e as AGError);
    } finally {
      this._setConnectionState(false);
    }

    if (joinSuccess && EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.student) {
      this._grantWhiteboard();
    }
  }

  @bound
  private async _copyRoomContent() {
    this.getters.boardApi.loadAttributes();
  }

  @bound
  private async _leaveSubRoom() {
    await this._waitUntilJoined();
    this._setConnectionState(true);
    try {
      const { fastMode } = getConfig();
      await this.classroomStore.connectionStore.leaveSubRoom();

      await when(() => this.classroomStore.connectionStore.rtcState === AGRtcState.Idle);

      await this.classroomStore.connectionStore.joinRTC();

      await this.classroomStore.connectionStore.checkIn(
        EduClassroomConfig.shared.sessionInfo,
        SceneType.Main,
        fastMode ? 'check-in' : 'entry'
      );
    } catch (e) {
      //   this.shareUIStore.addGenericErrorDialog(e as AGError);
    } finally {
      this._setConnectionState(false);
    }
  }

  @bound
  private async _changeSubRoom() {
    await this._waitUntilJoined();

    this._setConnectionState(true);

    const roomUuid = this.classroomStore.groupStore.currentSubRoom;

    if (!roomUuid) {
      this.logger.error('cannot find roomUuid');
      this._setConnectionState(false);
      return;
    }

    let joinSuccess = false;
    try {
      const {
        isCameraDeviceEnabled,
        isAudioRecordingDeviceEnabled,
        pretestCameraEnabled,
        pretestMicEnabled,
      } = this.getters.classroomUIStore.deviceSettingUIStore;
      if (isTeacher()) {
        this.logger.info("remove teacher's stream");
        await this.classroomStore.connectionStore.scene?.localUser?.deleteLocalMediaStream();
        this.logger.info("remove teacher's stream success");
      }

      await this.classroomStore.connectionStore.leaveSubRoom();

      await this._waitUntilLeft();

      while (true) {
        try {
          const { setPretestCameraEnabled, setPretestMicEnabled } =
            this.getters.classroomUIStore.deviceSettingUIStore;
          setPretestCameraEnabled(pretestCameraEnabled || isCameraDeviceEnabled);
          setPretestMicEnabled(pretestMicEnabled || isAudioRecordingDeviceEnabled);
          await this.classroomStore.connectionStore.joinSubRoom(roomUuid);

          await this.classroomStore.connectionStore.joinRTC();
        } catch (e) {
          this.logger.error('join sub room err', e);
          await sleep(1000);
          continue;
        }
        break;
      }

      joinSuccess = true;
    } catch (e) {
      this.logger.error('cannot change sub room', e);
    } finally {
      this._setConnectionState(false);
    }
    if (joinSuccess && EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.student) {
      this._grantWhiteboard();
    }
  }

  @bound
  private _handleClassroomEvent(type: AgoraEduClassroomEvent, args: any) {
    if (type === AgoraEduClassroomEvent.JoinSubRoom) {
      this._joinSubRoom();
    }
    if (type === AgoraEduClassroomEvent.LeaveSubRoom) {
      this._leaveSubRoom();
    }

    if (type === AgoraEduClassroomEvent.InvitedToGroup) {
      const { groupUuid, groupName, inviter = 'Student' } = args;
      const isTeacher = this.getters.isHost;

      if (isTeacher) {
        runInAction(() => {
          this._helpRequestList.push({
            groupUuid,
            groupName,
          });
        });
      } else {
        const title = isTeacher ? transI18n('fcr_group_help_title') : transI18n('fcr_group_join');
        const content = isTeacher
          ? transI18n('fcr_group_confirm_ask_for_help', { reason1: inviter, reason2: groupName })
          : transI18n('fcr_group_invitation', { reason1: groupName });
        const ok = transI18n('fcr_group_button_join');
        const cancel = transI18n('fcr_group_button_later');
        const dialogId = uuidv4();
        this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
          id: dialogId,
          title,
          content,
          onOk: () => {
            this.classroomStore.groupStore.acceptGroupInvite(groupUuid);
          },
          onClose: () => {
            this.classroomStore.groupStore.rejectGroupInvite(groupUuid);
          },
          okText: ok,
          cancelText: cancel,
        });

        this._dialogsMap.set(groupUuid, dialogId);
      }
    }

    if (type === AgoraEduClassroomEvent.RejectedToGroup) {
      const { groupUuid } = args;
      const isTeacher = this.getters.isHost;
      const dialogId = this._dialogsMap.get(groupUuid);
      if (dialogId) {
        this.getters.classroomUIStore.layoutUIStore.deleteDialog(dialogId);
      }
      if (isTeacher) {
        runInAction(() => {
          this._helpRequestList = this._helpRequestList.filter(
            (item) => groupUuid !== item.groupUuid,
          );
        });
      }
    }

    if (type === AgoraEduClassroomEvent.MoveToOtherGroup) {
      this._changeSubRoom();
    }
  }

  onInstall() {
    this._disposers.push(
      reaction(
        () => this.getters.boardApi.mounted,
        (mounted) => {
          if (mounted && this.getters.isGranted) {
            this._copyRoomContent();
          }
        },
      ),
      reaction(
        () => this.groupState,
        () => {
          if (this.groupState) {
            this._wizardState = 1;
          }
        },
      ),
    );
    EduEventCenter.shared.onClassroomEvents(this._handleClassroomEvent);
  }

  onDestroy() {
    EduEventCenter.shared.onClassroomEvents(this._handleClassroomEvent);
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
}
