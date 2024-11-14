import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { FC, useEffect, useState } from 'react';
import { ActionBarItemWithPopover } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { useI18n } from 'agora-common-libs';
import { ToolTip } from '@components/tooltip';
import { useZIndex } from '@ui-scene/utils/hooks/use-z-index';
import { RttTypeEnum } from '@ui-scene/uistores/type';
export const ToolBox = observer(() => {
  const {
    layoutUIStore: { setHasPopoverShowed }  } = useStore();
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
    widgetUIStore: { widgetActiveList }
  } = useStore();
  const transI18n = useI18n();
  const isWidgetActive = (widgetId: string) => {
    if (widgetId === 'breakout') {
      return getters.isBreakoutActive;
    }
    if (widgetId === 'rtt') {
      return widgetActiveList.includes(widgetId)
    }
    if (widgetId === 'rttbox') {
      return widgetActiveList.includes(widgetId)
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
            onWidgetIdChange={()=>{
            }}
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
  onWidgetIdChange: (id: string) => void;
}
const ToolBoxItem: FC<ToolBoxItemProps> = observer((props) => {
  const { icon, label, active, id, onClick, onWidgetIdChange } = props;
  const { widgetUIStore, eduToolApi, breakoutUIStore } = useStore();
  const { updateZIndex } = useZIndex(id);
  useEffect(() => {
    if (id === 'rtt') {
      widgetUIStore.createWidget(id);
      eduToolApi.sendWidgetVisibleIsShowTool(id, true);
    }
    if (id === 'rttbox') {
      widgetUIStore.createWidget(id);
    }
  }, []);

  //修改最大最小化
  const setMinimizedState = (minimized: boolean) => {
    eduToolApi.setMinimizedState({
      minimized: minimized,
      widgetId: id,
      minimizedProperties: {
        minimizedCollapsed:
          widgetUIStore.widgetInstanceList.find((w) => w.widgetId === id)?.minimizedProperties
            ?.minimizedCollapsed || false,
      },
    });
  }

  const handleClick = () => {
    //当前widget是否是最小化的
    const widgetIsMinimized = eduToolApi.isWidgetMinimized(id);
    //档位widget是否是正在使用的状态
    const widgetActive = (RttTypeEnum.SUBTITLE === id || RttTypeEnum.CONVERSION === id) ? widgetUIStore.widgetActiveList.includes(id) : active;
    switch (id) {
      case RttTypeEnum.SUBTITLE:
        if(widgetIsMinimized){setMinimizedState(false)}else{
          updateZIndex();
          onWidgetIdChange(id)
          //如果没有激活使用的话也要弹窗显示
          if(!widgetActive){
            eduToolApi.setWidgetVisible(id, true);
          }
          eduToolApi.sendWidgetVisibleIsShowRtt(id, true);
          eduToolApi.changeSubtitleOpenState()
        }
        break
      case RttTypeEnum.CONVERSION:
        updateZIndex();
        onWidgetIdChange(id)
        if(!eduToolApi.isWidgetVisible(id)){
          eduToolApi.setWidgetVisible(id, true);
        }
        if(widgetActive){
          setMinimizedState(!widgetIsMinimized)
        }else{
          eduToolApi.sendWidgetRttboxShow(id, true); 
          eduToolApi.changeConversionOpenState()
        }
        break;
      case 'breakout':
        if (widgetIsMinimized) { setMinimizedState(false) } else {
          updateZIndex();
          onWidgetIdChange(id)
          breakoutUIStore.setDialogVisible(true);
        }
        break;
      default:
        if (widgetIsMinimized) { setMinimizedState(false) } else {
          widgetUIStore.createWidget(id);
          updateZIndex();
          onWidgetIdChange(id)
        }
        break;
    }
    onClick();
  };
  // 点击设置小三角
  const handleSettingClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  }
  return (
    <div className="fcr-toolbox-popover-item" onClick={handleClick}>
      <SvgImg type={icon} size={30}></SvgImg>
      <span className="fcr-toolbox-popover-item-label">{label}</span>
      {(id === "rtt" || id === "rttbox") && <div className='fcr-toolbox-popover-item-dropbox' onClick={() => handleSettingClick}></div>}
      {active && <div className="fcr-toolbox-popover-item-active"></div>}
    </div>
  );
});
