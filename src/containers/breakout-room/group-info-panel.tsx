import { Button } from '@components/button';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { ToastApi } from '@components/toast';
import { ToolTip } from '@components/tooltip';
import { isTeacher } from '@ui-scene/utils/check';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';
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
  const transI18n = useI18n();

  const handleHelp = () => {
    const { updateGroupUsers, currentSubRoom } = classroomStore.groupStore;
    const teachers = classroomStore.userStore.mainRoomDataStore.teacherList;
    const assistants = classroomStore.userStore.mainRoomDataStore.assistantList;

    if (!teachers.size && !assistants.size) {
      addDialog('confirm', {
        title: transI18n('fcr_group_help_title'),
        content: transI18n('fcr_group_teacher_not_in_classroom'),
        cancelButtonVisible: false,
      });
      return;
    }
    if (teacherGroupUuid === currentSubRoom) {
      ToastApi.open({
        toastProps: {
          content: transI18n('fcr_group_teacher_exist_hint'),
          type: 'normal',
        },
      });
      return;
    }

    const teacherUuid = teachers.keys().next().value;
    const assistantUuids = Array.from(assistants.keys());

    addDialog('confirm', {
      title: transI18n('fcr_group_help_title'),
      content: transI18n('fcr_group_help_content'),
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
              title: transI18n('fcr_group_help_title'),
              content: transI18n('fcr_group_teacher_is_helping_others_msg'),
              cancelButtonVisible: false,
            });
          }
        });
      },
      okText: transI18n('fcr_group_button_invite'),
      cancelText: transI18n('fcr_group_button_cancel'),
    });
  };

  return !isTeacher() && currentSubRoomInfo ? (
    <Rnd
      default={{ x: 15, y: 38, width: 'auto', height: 'auto' }}
      enableResizing={false}
      style={{ zIndex: 1020 }}>
      <div
        className="fcr-breakout-room__status-panel fcr-breakout-room__ask-for-help-panel"
        style={{ opacity: showStatusBar ? 1 : 0 }}>
        <span style={{ marginLeft: 9 }}>{currentSubRoomInfo.groupName}</span>
        <div className="fcr-divider" style={{ marginRight: 1 }} />
        <ToolTip content={transI18n('fcr_group_help_title')}>
          <Button onClick={handleHelp}>
            <SvgImg type={SvgIconEnum.FCR_QUESTION} size={24} />
          </Button>
        </ToolTip>
      </div>
    </Rnd>
  ) : null;
});
