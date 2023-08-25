import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { Popover } from '@components/popover';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { AgoraExtensionWidgetEvent } from '@onlineclass/extension/events';
export const StatusBarWidgetSlot = observer(() => {
  const { eduToolApi } = useStore();
  const handleClick = (widgetId: string, minimizedCollapsed: boolean) => {
    eduToolApi.setMinimizedState({
      minimized: false,
      widgetId,
      minimizedProperties: {
        minimizedCollapsed,
      },
    });
  };
  return (
    <>
      <CountdownTimerMinimize></CountdownTimerMinimize>
      <div className="fcr-status-bar-widget-slot">
        {eduToolApi.minimizedWidgetIcons
          .filter((i) => !(i instanceof Array) && i.widgetId !== 'countdownTimer')
          .slice()
          .reverse()
          .map((item, index) => {
            if (item instanceof Array) {
              const firstItem = item[0];
              const { minimizedIcon } = firstItem;
              return (
                <Popover
                  overlayInnerStyle={{
                    width: 207,
                  }}
                  mouseEnterDelay={0}
                  placement="bottom"
                  content={
                    <WidgetMinimizedPopoverContent
                      widgetList={item}
                      onClick={(widgetId) => {
                        handleClick(widgetId, true);
                      }}></WidgetMinimizedPopoverContent>
                  }>
                  <div
                    className="fcr-minimized-widget-icon fcr-minimized-widget-icon-collapsed"
                    key={index.toString()}>
                    <SvgImg type={minimizedIcon} size={20} />
                    {item.length}
                  </div>
                </Popover>
              );
            } else {
              const { widgetId, tooltip, icon } = item;
              return (
                <ToolTip key={widgetId} content={tooltip}>
                  <div
                    className="fcr-minimized-widget-icon"
                    onClick={() => handleClick(widgetId, false)}
                    key={index.toString()}>
                    <SvgImg type={icon} size={20} />
                  </div>
                </ToolTip>
              );
            }
          })}
      </div>
    </>
  );
});
const WidgetMinimizedPopoverContent = (props: {
  widgetList: {
    key: string;
    icon: SvgIconEnum;
    tooltip?: string;
    widgetId?: string;
  }[];
  onClick: (widgetId: string) => void;
}) => {
  const { widgetList, onClick } = props;
  const { key } = widgetList[0];
  return (
    <div className="fcr-minimized-widget-container">
      <div className="fcr-minimized-widget-container-title">{key}</div>
      {widgetList.map((w) => {
        return (
          <div
            onClick={() => {
              onClick(w.widgetId || '');
            }}
            key={w.widgetId}
            className="fcr-minimized-widget-item">
            <SvgImg type={w.icon} size={30}></SvgImg>
            <div>
              <span>{w.tooltip}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
type CountdownTimerStates = {
  current: number;
  state: CountdownTimerState;
  tooltip: string;
  icon: SvgIconEnum;
};
enum CountdownTimerState {
  STOPPED,
  RUNNING,
  PAUSED,
}

const CountdownTimerMinimize = observer(() => {
  const {
    eduToolApi: { isWidgetMinimized, setMinimizedState },
    widgetUIStore: {
      widgetInstanceList,
      classroomStore: {
        widgetStore: { widgetController },
      },
    },
  } = useStore();
  const [countdownTimerState, setCountdownTimerState] = useState<CountdownTimerStates>({
    current: 0,
    state: CountdownTimerState.STOPPED,
    tooltip: '',
    icon: SvgIconEnum.FCR_V2_TIMER,
  });
  const countdownTimer = widgetInstanceList.find((w) => w.widgetId === 'countdownTimer');
  useEffect(() => {
    if (countdownTimer && widgetController) {
      widgetController.addBroadcastListener({
        messageType: AgoraExtensionWidgetEvent.CountdownTimerStateChanged,
        onMessage: handleCountdownTimerStateChanged,
      });
    }
  }, [countdownTimer, widgetController]);
  const handleCountdownTimerStateChanged = (states: CountdownTimerStates) => {
    setCountdownTimerState(states);
  };
  const handleClick = () => {
    if (isWidgetMinimized('countdownTimer')) {
      setMinimizedState({
        minimized: false,
        widgetId: 'countdownTimer',
        minimizedProperties: {
          minimizedCollapsed: false,
        },
      });
    }
  };

  const { current, state, tooltip, icon } = countdownTimerState;
  return countdownTimer ? (
    <ToolTip content={tooltip}>
      <div
        className={classnames('fcr-minimized-widget-icon', 'fcr-minimized-widget-countdown', {
          'fcr-minimized-widget-countdown-danger': current <= 10 && current > 0,
        })}
        onClick={handleClick}>
        <SvgImg type={icon} size={20} />
        {current !== undefined && dayjs.duration(current, 'seconds').format('mm:ss')}
      </div>
    </ToolTip>
  ) : null;
});
