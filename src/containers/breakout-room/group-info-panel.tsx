import { Button } from '@components/button';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { ToastApi } from '@components/toast';
import { ToolTip } from '@components/tooltip';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { AGServiceErrorCode, EduClassroomConfig, EduRoleTypeEnum } from 'agora-edu-core';
import { AGError } from 'agora-rte-sdk';
import { observer } from 'mobx-react';
import { Rnd } from 'react-rnd';

export const GroupInfoPanel = observer(() => {
  const {
    layoutUIStore: { addDialog, showStatusBar },
    breakoutUIStore: { currentSubRoomInfo, teacherGroupUuid },
    classroomStore,
  } = useStore();

  const isTeacher = EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.teacher;

  const handleHelp = () => {
    const { updateGroupUsers, currentSubRoom } = classroomStore.groupStore;
    const teachers = classroomStore.userStore.mainRoomDataStore.teacherList;
    const assistants = classroomStore.userStore.mainRoomDataStore.assistantList;

    if (!teachers.size && !assistants.size) {
      addDialog('confirm', {
        title: 'Request help',
        content: 'Teacher is not in this classroom',
        cancelButtonVisible: false,
      });
      return;
    }
    if (teacherGroupUuid === currentSubRoom) {
      ToastApi.open({
        toastProps: {
          content: 'The teacher is already in the group',
          type: 'normal',
        },
      });
      return;
    }

    const teacherUuid = teachers.keys().next().value;
    const assistantUuids = Array.from(assistants.keys());

    addDialog('confirm', {
      title: 'Request help',
      content: 'You can invite the teacher to this group for assistance.',
      onOk: () => {
        updateGroupUsers(
          [
            {
              groupUuid: currentSubRoom as string,
              addUsers: [teacherUuid].concat(assistantUuids),
            },
          ],
          true,
        ).catch((e) => {
          if (AGError.isOf(e, AGServiceErrorCode.SERV_USER_BEING_INVITED)) {
            addDialog('confirm', {
              title: 'Request help',
              content: 'The teacher is helping other group, Please wait for minutes.',
              cancelButtonVisible: false,
            });
          } else {
            // this.shareUIStore.addGenericErrorDialog(e as AGError);
          }
        });
      },
      okText: 'Invite',
      cancelText: 'Cancel',
    });
  };

  return !isTeacher && currentSubRoomInfo ? (
    <Rnd
      default={{ x: 15, y: 38, width: 'auto', height: 'auto' }}
      enableResizing={false}
      style={{ zIndex: 100 }}>
      <div
        className="fcr-breakout-room__status-panel fcr-breakout-room__ask-for-help-panel"
        style={{ opacity: showStatusBar ? 1 : 0 }}>
        <span style={{ marginLeft: 9 }}>{currentSubRoomInfo.groupName}</span>
        <div className="fcr-divider" style={{ marginRight: 1 }} />
        <ToolTip content="Request for Help">
          <Button onClick={handleHelp}>
            <SvgImg type={SvgIconEnum.FCR_QUESTION} size={24} />
          </Button>
        </ToolTip>
      </div>
    </Rnd>
  ) : null;
});
