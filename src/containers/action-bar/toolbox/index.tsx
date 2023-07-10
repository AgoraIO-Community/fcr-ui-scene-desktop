import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { FC, useState } from 'react';
import { ActionBarItemWithPopover } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { AgoraOnlineclassSDKMinimizableWidget } from 'agora-common-libs';
import { ToolTip } from '@components/tooltip';
import { useZIndex } from '@onlineclass/utils/hooks/use-z-index';
export const ToolBox = observer(() => {
  const {
    layoutUIStore: { setHasPopoverShowed },
  } = useStore();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);

  return (
    <>
      <ToolTip
        visible={tooltipVisible}
        onVisibleChange={(visible: boolean) => {
          if (popoverVisible) {
            setTooltipVisible(false);
            return;
          }
          setTooltipVisible(visible);
        }}
        content="ToolBox">
        <div>
          <ActionBarItemWithPopover
            popoverProps={{
              visible: popoverVisible,
              onVisibleChange(visible) {
                setPopoverVisible(visible);
                if (visible) {
                  setTooltipVisible(false);
                  setHasPopoverShowed(true);
                } else {
                  setHasPopoverShowed(false);
                }
              },
              overlayInnerStyle: { width: 'auto' },
              trigger: 'click',
              content: (
                <ToolBoxPopoverContent
                  onClick={() => setPopoverVisible(false)}></ToolBoxPopoverContent>
              ),
            }}
            icon={SvgIconEnum.FCR_WHITEBOARD_TOOLBOX}
            text={'ToolBox'}></ActionBarItemWithPopover>
        </div>
      </ToolTip>
    </>
  );
});
const ToolBoxPopoverContent = observer(({ onClick }: { onClick: () => void }) => {
  const { getters } = useStore();
  const isWidgetActive = (widgetId: string) => {
    if (widgetId === 'breakout') {
      return getters.isBreakoutActive;
    }
    return getters.activeWidgetIds.includes(widgetId);
  };
  return (
    <div className="fcr-toolbox-popover-content">
      <div className="fcr-toolbox-popover-title">ToolBox</div>
      <div className="fcr-toolbox-popover-item-wrapper">
        {[
          // { label: 'Timer', id: 'timer', icon: SvgIconEnum.FCR_V2_TIMER },
          { label: 'Poll', id: 'poll', icon: SvgIconEnum.FCR_V2_VOTE },
          { label: 'Breakout Room', id: 'breakout', icon: SvgIconEnum.FCR_V2_BREAKROOM },
        ].map(({ id, icon, label }) => (
          <ToolBoxItem
            key={id}
            id={id}
            icon={icon}
            label={label}
            onClick={onClick}
            active={isWidgetActive(id)}
          />
        ))}
      </div>
    </div>
  );
});
interface ToolBoxItemProps {
  id: string;
  icon: SvgIconEnum;
  label: string;
  active: boolean;
  onClick: () => void;
}
const ToolBoxItem: FC<ToolBoxItemProps> = observer((props) => {
  const { icon, label, active, id, onClick } = props;
  const { widgetUIStore, eduToolApi, breakoutUIStore } = useStore();
  const { updateZIndex } = useZIndex('breakout');

  const handleClick = () => {
    if (eduToolApi.isWidgetMinimized(id)) {
      eduToolApi.setMinimizedState({
        minimized: false,
        widgetId: id,
        minimizeProperties: {
          minimizedCollapsed:
            (
              widgetUIStore.widgetInstanceList.find(
                (w) => w.widgetId === id,
              ) as AgoraOnlineclassSDKMinimizableWidget
            )?.minimizeProperties?.minimizedCollapsed || false,
        },
      });
    } else {
      if (id === 'breakout') {
        updateZIndex();

        breakoutUIStore.setDialogVisible(true);
      } else {
        widgetUIStore.createWidget(id);
      }
    }

    onClick();
  };

  return (
    <div className="fcr-toolbox-popover-item" onClick={handleClick}>
      <SvgImg type={icon} size={30}></SvgImg>
      <span className="fcr-toolbox-popover-item-label">{label}</span>
      {active && <div className="fcr-toolbox-popover-item-active"></div>}
    </div>
  );
});
