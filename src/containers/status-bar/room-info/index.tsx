import { DoubleDeckPopoverWithTooltip, PopoverWithTooltip } from '@components/popover';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToastApi } from '@components/toast';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import ClipboardJS from 'clipboard';
import { FC, useEffect, useRef } from 'react';
import { StatusBarItemWrapper } from '..';
import { NetworkConnection, NetworkDetail } from '../network';
import { Share } from '../share';
import classnames from 'classnames';
import { isNumber } from 'lodash';
import './index.css';
import { formatRoomID } from '@ui-scene/utils';
import { useNetwork } from '@ui-scene/utils/hooks/use-network';
import { useI18n } from 'agora-common-libs';
import { observer } from 'mobx-react';
export const StatusBarInfo: FC = observer(() => {
  const transI18n = useI18n();
  const ref = useRef<HTMLSpanElement | null>(null);
  const {
    statusBarUIStore: { roomUuid },
    layoutUIStore: { setHasPopoverShowed },
  } = useStore();
  const network = useNetwork();
  useEffect(() => {
    let clipboard: ClipboardJS | undefined;
    if (ref.current) {
      clipboard = new ClipboardJS(ref.current);
      clipboard.on('success', () => {
        ToastApi.open({
          toastProps: {
            type: 'info',
            content: transI18n('fcr_invite_tips_copy_room_id'),
          },
        });
      });
    }
    return () => {
      clipboard?.destroy();
    };
  }, []);
  return (
    <StatusBarItemWrapper>
      <div className="fcr-status-bar-info">
        <DoubleDeckPopoverWithTooltip
          doulebDeckPopoverProps={{
            onVisibleChange(visible) {
              if (visible) {
                setHasPopoverShowed(true);
              } else {
                setHasPopoverShowed(false);
              }
            },
            placement: 'bottomRight',
            topDeckContent: <NetworkConnection></NetworkConnection>,
            bottomDeckContent: <NetworkDetail></NetworkDetail>,
          }}
          toolTipProps={{ content: 'Show Network Details', placement: 'bottomLeft' }}>
          <div className="fcr-status-bar-info-network">
            <SvgImg type={network.icon} size={20}></SvgImg>
          </div>
        </DoubleDeckPopoverWithTooltip>
        <div className={classnames('fcr-status-bar-info-id', 'fcr-divider')}>
          <span>{transI18n('fcr_room_label_room_id')}:</span>
          <span ref={ref} data-clipboard-text={roomUuid}>
            {isNumber(roomUuid) ? formatRoomID(roomUuid) : roomUuid}
          </span>
        </div>
        <PopoverWithTooltip
          popoverProps={{
            onVisibleChange(visible) {
              if (visible) {
                setHasPopoverShowed(true);
              } else {
                setHasPopoverShowed(false);
              }
            },
            overlayInnerStyle: {
              width: 'auto',
            },
            content: <Share></Share>,
          }}
          toolTipProps={{ content: transI18n('fcr_invite_label_title') }}>
          <div className="fcr-status-bar-info-share">
            <SvgImg type={SvgIconEnum.FCR_SHARE} size={20}></SvgImg>
          </div>
        </PopoverWithTooltip>
      </div>
    </StatusBarItemWrapper>
  );
});
export const StatusBarRoomName = () => {
  const {
    statusBarUIStore: { roomName },
  } = useStore();
  return (
    <StatusBarItemWrapper>
      <div className={classnames('fcr-status-bar-room-name')}>{roomName}</div>
    </StatusBarItemWrapper>
  );
};
