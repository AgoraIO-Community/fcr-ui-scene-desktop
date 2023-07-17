import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToastApi } from '@components/toast';
import {
  AgoraEduClassroomEvent,
  ClassroomState,
  ClassState,
  EduClassroomConfig,
  EduEventCenter,
  EduRoleTypeEnum,
  LeaveReason,
} from 'agora-edu-core';
import { bound } from 'agora-rte-sdk';
import { reaction } from 'mobx';
import { EduUIStoreBase } from './base';

export class NotiticationUIStore extends EduUIStoreBase {
  private _prevClassState: ClassState = ClassState.beforeClass;
  @bound
  private _handleClassroomEvent(event: AgoraEduClassroomEvent, param: any) {
    // kick out
    if (event === AgoraEduClassroomEvent.KickOut) {
      const user = param;

      const { sessionInfo } = EduClassroomConfig.shared;

      if (user.userUuid === sessionInfo.userUuid) {
        this.classroomStore.connectionStore.leaveClassroom(
          LeaveReason.kickOut,
          new Promise((resolve, reject) => {
            this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
              title: 'Leave Classroom',
              content: 'You have been removed from the classroom by the teacher',
              closable: false,
              onOk: resolve,
              okText: 'OK',
              okButtonProps: { styleType: 'danger' },
              cancelButtonVisible: false,
            });
          }),
        );
      }
    }

    if (event === AgoraEduClassroomEvent.TeacherTurnOffMyMic) {
      ToastApi.open({
        toastProps: { type: 'info', content: 'You are muted' },
      });
    }

    if (event === AgoraEduClassroomEvent.TeacherTurnOffMyCam) {
      ToastApi.open({
        toastProps: { type: 'info', content: 'The teacher has turned off your camera' },
      });
    }
    if (event === AgoraEduClassroomEvent.TeacherGrantPermission) {
      ToastApi.open({
        persist: true,
        duration: 15000,
        toastProps: {
          type: 'warn',
          icon: SvgIconEnum.FCR_HOST,
          content: 'The teacher invites you to the whiteboard',
          closable: true,
        },
      });
    }
    // teacher revoke permission
    if (event === AgoraEduClassroomEvent.TeacherRevokePermission) {
      ToastApi.open({
        persist: true,
        duration: 15000,

        toastProps: {
          icon: SvgIconEnum.FCR_HOST,
          type: 'warn',
          content: 'The teacher cancelled your whiteboard permission',
          closable: true,
        },
      });
    }

    // capture screen permission denied received
    if (event === AgoraEduClassroomEvent.CaptureScreenPermissionDenied) {
      this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
        title: 'Notice',
        content: 'Before using screen sharing, please first enable screen recording permissions.',
        okButtonProps: {
          styleType: 'danger',
        },
        cancelButtonVisible: false,
        icon: <SvgImg type={SvgIconEnum.FCR_BELL} size={50}></SvgImg>,
      });
    }

    // user join group
    if (event === AgoraEduClassroomEvent.UserJoinGroup) {
      const { role } = EduClassroomConfig.shared.sessionInfo;
      const { groupUuid, users }: { groupUuid: string; users: [] } = param;
      const { teacherList, studentList, assistantList } =
        this.classroomStore.userStore.mainRoomDataStore;

      const teachers = this._filterUsers(users, teacherList);
      const students = this._filterUsers(users, studentList);
      const assistants = this._filterUsers(users, assistantList);

      const isCurrentRoom = this.classroomStore.groupStore.currentSubRoom === groupUuid;

      if (isCurrentRoom) {
        if (teachers.length) {
          if (role === EduRoleTypeEnum.student) {
            ToastApi.open({
              toastProps: {
                type: 'normal',
                content: `Teacher ${teachers.join(',')} has joined group`,
              },
            });
          }
        }

        if (assistants.length) {
          if (role === EduRoleTypeEnum.student) {
            ToastApi.open({
              toastProps: {
                type: 'normal',
                content: `Assistant ${assistants.join(',')} has joined group`,
              },
            });
          }
        }

        if (students.length) {
          if ([EduRoleTypeEnum.teacher, EduRoleTypeEnum.assistant].includes(role)) {
            ToastApi.open({
              toastProps: {
                type: 'normal',
                content: `Student ${students.join(',')} has joined group`,
              },
            });
          }
        }
      }
    }
    // user leave group
    if (event === AgoraEduClassroomEvent.UserLeaveGroup) {
      const { role } = EduClassroomConfig.shared.sessionInfo;
      const { groupUuid, users }: { groupUuid: string; users: [] } = param;
      const { teacherList, studentList, assistantList } =
        this.classroomStore.userStore.mainRoomDataStore;

      const teachers = this._filterUsers(users, teacherList);
      const students = this._filterUsers(users, studentList);
      const assistants = this._filterUsers(users, assistantList);

      const isCurrentRoom = this.classroomStore.groupStore.currentSubRoom === groupUuid;

      if (isCurrentRoom) {
        if (teachers.length) {
          if (role === EduRoleTypeEnum.student) {
            ToastApi.open({
              toastProps: {
                type: 'warn',
                content: `Teacher ${teachers.join(',')} has left group`,
              },
            });
          }
        }

        if (assistants.length) {
          if (role === EduRoleTypeEnum.student) {
            ToastApi.open({
              toastProps: {
                type: 'warn',
                content: `Assistant ${assistants.join(',')} has left group`,
              },
            });
          }
        }

        if (students.length) {
          if ([EduRoleTypeEnum.teacher, EduRoleTypeEnum.assistant].includes(role)) {
            ToastApi.open({
              toastProps: {
                type: 'warn',
                content: `Student ${students.join(',')} has left group`,
              },
            });
          }
        }
      }
    }

    if (event === AgoraEduClassroomEvent.RejectedToGroup) {
      const { inviting } = param;
      const { role } = EduClassroomConfig.shared.sessionInfo;
      if (role === EduRoleTypeEnum.student && inviting) {
        this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
          title: 'Request help',
          content: 'The teacher is currently helping others. Please try again later.',
          cancelButtonVisible: false,
        });
      }
    }

    if (
      event === AgoraEduClassroomEvent.LeaveSubRoom ||
      event === AgoraEduClassroomEvent.JoinSubRoom ||
      event === AgoraEduClassroomEvent.MoveToOtherGroup
    ) {
      ToastApi.destroyAll();
    }
  }

  private _filterUsers(
    users: string[],
    userList: Map<string, { userUuid: string; userName: string }>,
  ) {
    return users
      .filter((userUuid: string) => userList.has(userUuid))
      .map((userUuid: string) => userList.get(userUuid)?.userName || 'unknown');
  }

  private _getStateErrorReason(reason?: string): string {
    switch (reason) {
      case 'REMOTE_LOGIN':
        return 'Kick out by other client';
      case 'BANNED_BY_SERVER':
        return 'Prohibited';
      default:
        return reason ?? 'Unknown error occured.';
    }
  }
  onDestroy(): void {
    this._disposers.forEach((d) => d());
    this._disposers = [];
    EduEventCenter.shared.offClassroomEvents(this._handleClassroomEvent);
  }
  onInstall(): void {
    EduEventCenter.shared.onClassroomEvents(this._handleClassroomEvent);
    this._disposers.push(
      reaction(
        () => this.classroomStore.roomStore.classroomSchedule.state,
        (state) => {
          if (ClassState.close === state) {
            this.classroomStore.connectionStore.leaveClassroom(
              LeaveReason.leave,
              new Promise((resolve) => {
                this.getters.classroomUIStore.layoutUIStore.addDialog('class-info', {
                  title: 'The class has ended',
                  content: 'Please click the button to leave the classroom.',
                  actions: [
                    {
                      text: 'Leave',
                      styleType: 'danger',
                      onClick: resolve,
                    },
                  ],
                });
              }),
            );
          }
          this._prevClassState = ClassState.ongoing;
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.classroomStore.connectionStore.classroomState,
        (state) => {
          if (ClassroomState.Error === state) {
            this.classroomStore.connectionStore.leaveClassroom(
              LeaveReason.leave,
              new Promise((resolve) => {
                this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
                  title: 'Leave Classroom',
                  content: this._getStateErrorReason(
                    this.classroomStore.connectionStore.classroomStateErrorReason,
                  ),
                  closable: false,

                  onOk: resolve,
                  okText: 'Leave the Room',
                  okButtonProps: { styleType: 'danger' },
                  cancelButtonVisible: false,
                });
              }),
            );
          }
        },
      ),
    );
  }
}
