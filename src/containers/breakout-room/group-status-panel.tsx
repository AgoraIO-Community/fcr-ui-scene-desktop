import { Button } from '@components/button';
import { PopoverWithTooltip } from '@components/popover';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { BroadcastMessagePanel } from './broadcast-panel';
import { observer } from 'mobx-react';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { EduClassroomConfig, EduRoleTypeEnum } from 'agora-edu-core';
import { useRef, useState } from 'react';
import { Rnd } from 'react-rnd';

export const GroupStatusPanel = observer(() => {
  const {
    layoutUIStore: { showStatusBar },
    breakoutUIStore: { groupState, stopGroup, currentSubRoomInfo },
  } = useStore();

  const panelRef = useRef<{ closePopover: () => void }>(null);
  const [visible, setVisible] = useState(false);

  const isTeacher = EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.teacher;

  const handleStop = () => {
    stopGroup();
  };

  const handleClose = () => {
    setVisible(false);
    if (panelRef.current) {
      panelRef.current.closePopover();
    }
  };

  return isTeacher && groupState ? (
    <Rnd
      default={{ x: 15, y: 38, width: 'auto', height: 'auto' }}
      enableResizing={false}
      style={{ zIndex: 100 }}>
      <div className="fcr-breakout-room__status-panel" style={{ opacity: showStatusBar ? 1 : 0 }}>
        <SvgImg type={SvgIconEnum.FCR_V2_BREAKROOM} />
        <span className="fcr-breakout-room__status-panel-label">
          {currentSubRoomInfo ? currentSubRoomInfo.groupName : 'In Group Discussion'}
        </span>
        <div className="fcr-divider" />
        <div className="fcr-breakout-room__status-panel-buttons">
          <PopoverWithTooltip
            ref={panelRef}
            toolTipProps={{ placement: 'top', content: 'Move to' }}
            popoverProps={{
              overlayOffset: 8,
              placement: 'top',
              content: <BroadcastMessagePanel onClose={handleClose} />,
              overlayClassName: 'fcr-breakout-room__broadcast__overlay',
              onVisibleChange: setVisible,
            }}>
            <Button size="XS" type="secondary">
              Broadcast Message to All
              <SvgImg
                type={SvgIconEnum.FCR_DROPDOWN}
                style={{
                  transform: `rotate(${visible ? '180deg' : '0deg'})`,
                  transition: 'all .3s',
                }}
              />
            </Button>
          </PopoverWithTooltip>
          <Button size="XS" preIcon={SvgIconEnum.FCR_CLOSE} styleType="danger" onClick={handleStop}>
            Stop Discussion
          </Button>
        </div>
      </div>
    </Rnd>
  ) : null;
});
