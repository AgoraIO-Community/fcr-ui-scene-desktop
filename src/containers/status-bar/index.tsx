import { FC, PropsWithChildren } from 'react';
import classnames from 'classnames';
import './index.css';

import { LayoutSwitch } from './layout-switch';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { ClassDuration } from './class-duration';
import { RecordStatus } from './record-status';

import { observer } from 'mobx-react';
import { StatusBarInfo, StatusBarRoomName } from './room-info';
import { FullscreenButton } from './fullscreen';
import { getConfig } from '@ui-scene/utils/launch-options-holder';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { Layout } from '@ui-scene/uistores/type';
import { StatusBarWidgetSlot } from './widgets';
import { InteractLabelGroup } from '../common/interact-labels';
import { ToolTip } from '@components/tooltip';

export const StatusBar = observer(() => {
  const {
    layoutUIStore: { showStatusBar, setIsPointingBar, noAvailabelStream },
    statusBarUIStore: { localUser, isStudent },
  } = useStore();
  const { logo } = getConfig();
  const userUuid = localUser?.userUuid || '';
  return (
    <div
      className={classnames('fcr-status-bar', {
        'fcr-status-bar-hide': !showStatusBar,
        'fcr-bg-transparent': noAvailabelStream,
      })}
      onMouseEnter={() => {
        setIsPointingBar(true);
      }}
      onMouseLeave={() => {
        setIsPointingBar(false);
      }}>
      <div className="fcr-status-bar-left">
        <>
          {logo && (
            <div className="fcr-status-bar-logo">
              <img src={logo as string}></img>
            </div>
          )}

          <StatusBarInfo />
          <StatusBarRoomName></StatusBarRoomName>
        </>
      </div>
      <div className="fcr-status-bar-right">
        <StatusBarWidgetSlot></StatusBarWidgetSlot>
        {isStudent && (
          <InteractLabelGroup userUuid={userUuid} placement={'status-bar'}></InteractLabelGroup>
        )}

        <RecordStatus></RecordStatus>
        <ClassDuration></ClassDuration>
        <LayoutSwitch></LayoutSwitch>
        <FullscreenButton></FullscreenButton>
      </div>
      <StatusBarCollapeButton></StatusBarCollapeButton>
    </div>
  );
});

export const StatusBarItemWrapper: FC<PropsWithChildren<any>> = (props) => {
  const { children, ...others } = props;
  return (
    <div {...others} className="fcr-status-bar-item-wrapper">
      {children}
    </div>
  );
};
const StatusBarCollapeButton = observer(() => {
  const {
    layoutUIStore: { layout, showListView, toggleShowListView },
  } = useStore();
  const visible = !showListView && layout === Layout.ListOnTop;
  return visible ? (
    <ToolTip placement="bottom" content={'Show lectern'}>
      <div className="fcr-status-bar-collapse-button" onClick={toggleShowListView}>
        <SvgImg type={SvgIconEnum.FCR_UP2} size={48}></SvgImg>
      </div>
    </ToolTip>
  ) : null;
});
