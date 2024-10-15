import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { ActionBarItem } from '..';
import './index.css';
import { observer } from 'mobx-react';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { Popover } from '@components/popover';
import { Button } from '@components/button';
import { useEffect, useState } from 'react';
import { ClassState, EduClassroomConfig, EduRoleTypeEnum } from 'agora-edu-core';
import { useI18n } from 'agora-common-libs';

export const Leave = observer(() => {
  const transI18n = useI18n();
  const {
    actionBarUIStore: { setShowLeaveOption },
    breakoutUIStore: { currentSubRoomInfo },
  } = useStore();

  return currentSubRoomInfo ? (
    <ToolTip
      content={
        <div className="fcr-leave-tips">{transI18n('fcr_room_tips_leave_breakout_room')}</div>
      }>
      <ActionBarItem
        classNames="fcr-leave-subroom-action"
        onClick={() => setShowLeaveOption(true, 2)}
        icon={{
          type: SvgIconEnum.FCR_QUIT2,
          size: 36,
        }}
        text={transI18n('fcr_group_button_leave_group')}></ActionBarItem>
    </ToolTip>
  ) : (
    <ToolTip content={<div className="fcr-leave-tips">{transI18n('fcr_room_tips_leave')}</div>}>
      <ActionBarItem
        classNames="fcr-leave-room-action"
        onClick={() => setShowLeaveOption(true, 1)}
        icon={{
          type: SvgIconEnum.FCR_QUIT2,
          size: 36,
        }}
        text={transI18n('fcr_room_button_leave')}></ActionBarItem>
    </ToolTip>
  );
});
export const LeaveCheck = observer(() => {
  const transI18n = useI18n();

  const {
    actionBarUIStore: { setShowLeaveOption, leaveFlag },
    layoutUIStore: { setHasPopoverShowed },
  } = useStore();
  const [popoverVisible, setPopoverVisible] = useState(false);
  useEffect(() => {
    setPopoverVisible(true);
  }, []);
  const hanldleVisibleChange = (visible: boolean) => {
    setPopoverVisible(visible);
  };
  const afterVisibleChange = (visible: boolean) => {
    setHasPopoverShowed(visible);
    if (!visible) {
      setShowLeaveOption(false, 1);
    }
  };
  return (
    <Popover
      placement="topRight"
      trigger="click"
      visible={popoverVisible}
      afterVisibleChange={afterVisibleChange}
      onVisibleChange={hanldleVisibleChange}
      overlayInnerStyle={{ width: 289 }}
      content={
        leaveFlag === 1 ? (
          <LeavePopoverContent></LeavePopoverContent>
        ) : (
          <LeaveBreakoutPopoverContent></LeaveBreakoutPopoverContent>
        )
      }>
      <div className="fcr-action-bar-cancel-leave">
        <Button onClick={() => setPopoverVisible(false)} size="M" styleType="gray">
          {transI18n('fcr_user_tips_button_cancel')}
        </Button>
      </div>
    </Popover>
  );
});
const LeavePopoverContent = observer(() => {
  const transI18n = useI18n();

  const {
    actionBarUIStore: { showEndClassButton, leaveClassroom },
    layoutUIStore: { addDialog },
    classroomStore: {
      roomStore: { updateClassState },
    },
  } = useStore();
  return (
    <div className="fcr-action-bar-leave-popover">
      <div className="fcr-action-bar-leave-popover-text">
        {transI18n('fcr_room_tips_leave_content')}
      </div>
      <div className="fcr-action-bar-leave-popover-btns">
        <Button type={'primary'} block onClick={leaveClassroom} size="M" styleType="danger">
          {transI18n('fcr_room_button_leave')}
        </Button>
        {showEndClassButton && (
          <Button
            onClick={async () => {
              addDialog('confirm', {
                title: transI18n('fcr_room_button_leave_end'),
                content: transI18n('fcr_room_tips_leave_content'),
                onOk: async () => {
                  await updateClassState(ClassState.close);
                  leaveClassroom();
                },
              });
            }}
            block
            type={'secondary'}
            size="M"
            styleType="danger">
            {transI18n('fcr_room_button_leave_end')}
          </Button>
        )}
      </div>
    </div>
  );
});

const LeaveBreakoutPopoverContent = observer(() => {
  const {
    actionBarUIStore: { setShowLeaveOption, isHost },
    breakoutUIStore: { leaveSubRoom, isAttendDiscussionConfig, leaveRtcClient, setIsAttendDiscussionConfig },
  } = useStore();
  const transI18n = useI18n();

  const handleOk = () => {
    setShowLeaveOption(false, 2);
    leaveSubRoom();
    if (isAttendDiscussionConfig?.groupId) {
      leaveRtcClient();
      setIsAttendDiscussionConfig({ groupName: '', groupId: '' })
    }
  };

  return (
    <div className="fcr-action-bar-leave-popover">
      {isHost ? (
        <div className="fcr-action-bar-leave-popover-text">
          {isAttendDiscussionConfig?.groupId ? transI18n('fcr_group_button_leave_group_attend_discussion') : transI18n('fcr_group_tips_leave_content')}
        </div>
      ) : (
        <div className="fcr-action-bar-leave-popover-text">
          {transI18n('fcr_group_tips_student_leave_content')}
        </div>
      )}
      <div className="fcr-action-bar-leave-popover-btns">
        <Button type={'primary'} block onClick={handleOk} size="M">
          {transI18n('fcr_group_button_leave_group')}
        </Button>
      </div>
    </div>
  );
});
