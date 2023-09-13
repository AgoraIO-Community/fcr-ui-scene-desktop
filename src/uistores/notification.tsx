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
import { transI18n } from 'agora-common-libs';

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
              title: transI18n('fcr_user_tips_kick_out_notice'),
              content: transI18n('fcr_user_tips_local_kick_out'),
              closable: false,
              onOk: resolve,
              okText: transI18n('fcr_user_tips_local_kick_out_ok'),
              okButtonProps: { styleType: 'danger' },
              cancelButtonVisible: false,
            });
          }),
        );
      }
    }
    if (
      event === AgoraEduClassroomEvent.RewardReceived ||
      event === AgoraEduClassroomEvent.BatchRewardReceived
    ) {
      const users: { userUuid: string; userName: string }[] = param;
      const userNames = users.map((user) => user.userName);
      if (users.length > 3) {
        ToastApi.open({
          toastProps: {
            type: 'info',
            content: transI18n('fcr_room_tips_reward_congratulation_multiplayer', {
              reason1: userNames.slice(0, 3).join(', '),
              reason2: userNames.length,
            }),
          },
        });
      } else {
        ToastApi.open({
          toastProps: {
            type: 'info',
            content: transI18n('fcr_room_tips_reward_congratulation_single', {
              reason: userNames.join(','),
            }),
          },
        });
      }
    }
    if (event === AgoraEduClassroomEvent.TeacherTurnOffMyMic) {
      ToastApi.open({
        toastProps: { type: 'info', content: transI18n('fcr_user_tips_muted') },
      });
    }

    if (event === AgoraEduClassroomEvent.TeacherTurnOffMyCam) {
      ToastApi.open({
        toastProps: { type: 'info', content: transI18n('fcr_user_tips_banned_video') },
      });
    }

    // capture screen permission denied received
    if (event === AgoraEduClassroomEvent.CaptureScreenPermissionDenied) {
      this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
        title: transI18n('fcr_user_tips_capture_screen_permission_title'),
        content: transI18n('fcr_user_tips_capture_screen_permission_content'),
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
                content: transI18n('fcr_group_enter_group', {
                  reason1: transI18n('fcr_role_teacher'),
                  reason2: teachers.join(','),
                }),
              },
            });
          }
        }

        if (assistants.length) {
          if (role === EduRoleTypeEnum.student) {
            ToastApi.open({
              toastProps: {
                type: 'normal',
                content: transI18n('fcr_group_enter_group', {
                  reason1: transI18n('fcr_role_assistant'),
                  reason2: assistants.join(','),
                }),
              },
            });
          }
        }

        if (students.length) {
          if (this.getters.isHost) {
            ToastApi.open({
              toastProps: {
                type: 'normal',
                content: transI18n('fcr_group_enter_group', {
                  reason1: transI18n('fcr_role_student'),
                  reason2: students.join(','),
                }),
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
                content: transI18n('fcr_group_exit_group', {
                  reason1: transI18n('fcr_role_teacher'),
                  reason2: teachers.join(','),
                }),
              },
            });
          }
        }

        if (assistants.length) {
          if (role === EduRoleTypeEnum.student) {
            ToastApi.open({
              toastProps: {
                type: 'warn',
                content: transI18n('fcr_group_exit_group', {
                  reason1: transI18n('fcr_role_assistant'),
                  reason2: assistants.join(','),
                }),
              },
            });
          }
        }

        if (students.length) {
          if (this.getters.isHost) {
            ToastApi.open({
              toastProps: {
                type: 'warn',
                content: transI18n('fcr_group_exit_group', {
                  reason1: transI18n('fcr_role_student'),
                  reason2: students.join(','),
                }),
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
          title: transI18n('fcr_group_help_title'),
          content: transI18n('fcr_group_help_teacher_busy_msg'),
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
        return transI18n('fcr_user_tips_local_kick_out');
      case 'BANNED_BY_SERVER':
        return transI18n('fcr_user_tips_local_prohibited');
      default:
        return reason ?? transI18n('fcr_unknown_error_occurred');
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
                  title: transI18n('fcr_room_label_class_ended_title'),
                  content: transI18n('fcr_room_label_class_ended_content'),
                  actions: [
                    {
                      text: transI18n('fcr_room_button_leave'),
                      styleType: 'danger',
                      onClick: () => resolve(),
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
                  title: transI18n('fcr_user_tips_kick_out_notice'),
                  content: this._getStateErrorReason(
                    this.classroomStore.connectionStore.classroomStateErrorReason,
                  ),
                  closable: false,

                  onOk: resolve,
                  okText: transI18n('fcr_room_button_join_error_leave'),
                  okButtonProps: { styleType: 'danger' },
                  cancelButtonVisible: false,
                });
              }),
            );
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.getters.isBreakoutStarted,
        () => {
          if (!this.getters.isBreakoutStarted) {
            setTimeout(() => {
              ToastApi.open({
                toastProps: {
                  type: 'normal',
                  content: transI18n('fcr_group_close_group'),
                },
              });
            }, 100);
          }
        },
      ),
    );
  }
}
