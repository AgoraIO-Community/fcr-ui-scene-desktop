import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { ActionBarItem } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { InfoToolTip } from '@components/tooltip/info';
import { Button } from '@components/button';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { useI18n } from 'agora-common-libs';

export const ScreenShare = observer(() => {
  const {
    actionBarUIStore: { isLocalScreenSharing, startLocalScreenShare },
  } = useStore();
  const transI18n = useI18n();

  const colors = themeVal('colors');
  const handleScreenShare = () => {
    if (!isLocalScreenSharing) {
      startLocalScreenShare();
    }
  };
  const icon = isLocalScreenSharing
    ? SvgIconEnum.FCR_SCREENSHARING_ON
    : SvgIconEnum.FCR_SCREENSHARING;
  const colorByStatus = isLocalScreenSharing ? colors['red']['6'] : colors['green'];
  const ScreenShareToolTip = isLocalScreenSharing ? InfoToolTip : ToolTip;
  return (
    <>
      {isLocalScreenSharing && <ScreenShareStatusBar></ScreenShareStatusBar>}
      <ScreenShareToolTip
        mouseEnterDelay={isLocalScreenSharing ? 0 : 1}
        mouseLeaveDelay={isLocalScreenSharing ? 1 : undefined}
        content={
          isLocalScreenSharing ? (
            <ScreenSharingTooltipContent></ScreenSharingTooltipContent>
          ) : (
            transI18n('fcr_room_button_screenshare')
          )
        }>
        <ActionBarItem
          onClick={handleScreenShare}
          icon={{
            type: icon,
            colors: { iconPrimary: colorByStatus },
          }}
          text={
            <span style={{ color: colorByStatus }}>{transI18n('fcr_room_button_screenshare')}</span>
          }></ActionBarItem>
      </ScreenShareToolTip>
    </>
  );
});
const ScreenSharingTooltipContent = observer(() => {
  const {
    actionBarUIStore: { stopLocalScreenShare },
  } = useStore();
  const transI18n = useI18n();
  return (
    <div className="fcr-action-bar-screen-share-tooltip">
      <span>{transI18n('fcr_room_tips_stop_screenshare')}</span>
      <Button onClick={stopLocalScreenShare} size="XS" shape="rounded" styleType="danger">
        {transI18n('fcr_share_button_stop')}
      </Button>
    </div>
  );
});

const ScreenShareStatusBar = observer(() => {
  const {
    actionBarUIStore: { stopLocalScreenShare },
  } = useStore();
  const transI18n = useI18n();
  const portal = document.querySelector('.fcr-classroom-viewport');
  return portal
    ? createPortal(
        <Rnd
          default={{
            x: portal.getBoundingClientRect().width / 2 - 144,
            y: 0,
            width: 285,
            height: 40,
          }}
          style={{ zIndex: 101 }}
          bounds=".fcr-classroom-viewport">
          <div className="fcr-screen-share-status-bar">
            <span>{transI18n('fcr_share_label_sharing')}...</span>
            <Button onClick={stopLocalScreenShare} size="XXS" shape="rounded" styleType="danger">
              {transI18n('fcr_share_button_stop')}
            </Button>
          </div>
        </Rnd>,
        portal,
      )
    : null;
});
