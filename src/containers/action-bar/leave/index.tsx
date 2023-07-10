import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { ActionBarItem } from '..';
import './index.css';
import { observer } from 'mobx-react';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { Popover } from '@components/popover';
import { Button } from '@components/button';
import { useEffect, useState } from 'react';
import { ClassState } from 'agora-edu-core';

export const Leave = observer(() => {
  const {
    actionBarUIStore: { setShowLeaveOption },
    breakoutUIStore: { currentSubRoomInfo, leaveSubRoom },
  } = useStore();

  return currentSubRoomInfo ? (
    <ToolTip content="Leave">
      <ActionBarItem
        classNames="fcr-leave-subroom-action"
        onClick={leaveSubRoom}
        icon={{
          type: SvgIconEnum.FCR_QUIT2,
          size: 36,
        }}
        text={'Leave breakout room'}></ActionBarItem>
    </ToolTip>
  ) : (
    <ToolTip content="Leave">
      <ActionBarItem
        classNames="fcr-leave-room-action"
        onClick={() => setShowLeaveOption(true)}
        icon={{
          type: SvgIconEnum.FCR_QUIT2,
          size: 36,
        }}
        text={'Leave'}></ActionBarItem>
    </ToolTip>
  );
});
export const LeaveCheck = observer(() => {
  const {
    actionBarUIStore: { setShowLeaveOption },
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
      setShowLeaveOption(false);
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
      content={<LeavePopoverContent></LeavePopoverContent>}>
      <div className="fcr-action-bar-cancel-leave">
        <Button onClick={() => setPopoverVisible(false)} size="M" styleType="gray">
          Cancel
        </Button>
      </div>
    </Popover>
  );
});
const LeavePopoverContent = observer(() => {
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
        Are you sure you want to end your classroom？
      </div>
      <div className="fcr-action-bar-leave-popover-btns">
        <Button type={'primary'} block onClick={leaveClassroom} size="M" styleType="danger">
          Leave the Classroom
        </Button>
        {showEndClassButton && (
          <Button
            onClick={async () => {
              addDialog('confirm', {
                title: 'End the Classroom',
                content: 'Are you sure you want to end the classroom?',
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
            End the Classroom
          </Button>
        )}
      </div>
    </div>
  );
});
