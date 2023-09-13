import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { FC, useState } from 'react';
import { ActionBarItemWithPopover } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { useI18n } from 'agora-common-libs';
import { ToolTip } from '@components/tooltip';
import { useZIndex } from '@ui-scene/utils/hooks/use-z-index';
export const ToolBox = observer(() => {
  const {
    layoutUIStore: { setHasPopoverShowed },
  } = useStore();
  const transI18n = useI18n();
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
        content={transI18n('fcr_room_button_toolbox')}>
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
            text={transI18n('fcr_room_button_toolbox')}></ActionBarItemWithPopover>
        </div>
      </ToolTip>
    </>
  );
});
const ToolBoxPopoverContent = observer(({ onClick }: { onClick: () => void }) => {
  const {
    getters,
    eduToolApi: { registeredCabinetToolItems },
  } = useStore();
  const transI18n = useI18n();
  const isWidgetActive = (widgetId: string) => {
    if (widgetId === 'breakout') {
      return getters.isBreakoutActive;
    }
    return getters.activeWidgetIds.includes(widgetId);
  };
  return (
    <div className="fcr-toolbox-popover-content">
      <div className="fcr-toolbox-popover-title">{transI18n('fcr_room_button_toolbox')}</div>
      <div className="fcr-toolbox-popover-item-wrapper">
        {registeredCabinetToolItems.map(({ id, iconType, name }) => (
          <ToolBoxItem
            key={id}
            id={id}
            icon={iconType}
            label={name}
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
  const { updateZIndex } = useZIndex(id);

  const handleClick = () => {
    if (eduToolApi.isWidgetMinimized(id)) {
      eduToolApi.setMinimizedState({
        minimized: false,
        widgetId: id,
        minimizedProperties: {
          minimizedCollapsed:
            widgetUIStore.widgetInstanceList.find((w) => w.widgetId === id)?.minimizedProperties
              ?.minimizedCollapsed || false,
        },
      });
    } else {
      updateZIndex();
      if (id === 'breakout') {
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
