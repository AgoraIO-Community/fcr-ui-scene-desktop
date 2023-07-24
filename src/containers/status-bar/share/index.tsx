import { Button } from '@components/button';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { EduClassroomConfig } from 'agora-edu-core';
import CopyToClipboard from 'react-copy-to-clipboard';
import './index.css';
import { ToastApi } from '@components/toast';
import { getConfig } from '@onlineclass/utils/launch-options-holder';
import { ClickableIcon } from '@components/svg-img/clickable-icon';
import { formatRoomID } from '@onlineclass/utils';
import { isNumber } from 'lodash';
import { useI18n } from 'agora-common-libs';
export const Share = () => {
  const transI18n = useI18n();
  const { roomUuid, roomName } = EduClassroomConfig.shared.sessionInfo;

  const { shareUrl } = getConfig();

  return (
    <div className="fcr-share">
      <div className="fcr-share-title">{transI18n('fcr_invite_label_title')}</div>
      <div className="fcr-share-room-name">{roomName}</div>
      <div className="fcr-share-room-id">
        <span>{transI18n('fcr_invite_label_room_id')}</span>
        <span data-clipboard-text={shareUrl}>
          {isNumber(roomUuid) ? formatRoomID(roomUuid) : roomUuid}
        </span>
        <CopyToClipboard
          text={roomUuid}
          onCopy={() =>
            ToastApi.open({
              toastProps: { type: 'info', content: transI18n('fcr_invite_tips_copy_room_id') },
            })
          }>
          <div className="fcr-share-room-id-copy" data-clipboard-text={shareUrl}>
            <SvgImg size={20} type={SvgIconEnum.FCR_COPY}></SvgImg>
          </div>
        </CopyToClipboard>
      </div>
      <div className="fcr-share-room-link">
        <span>{transI18n('fcr_invite_label_invite_link')}</span>
        <span>{shareUrl as string}</span>
      </div>
      <CopyToClipboard
        text={shareUrl as string}
        onCopy={() =>
          ToastApi.open({
            toastProps: { type: 'info', content: transI18n('fcr_invite_tips_copy_invite') },
          })
        }>
        <Button size="XS" block shape="rounded" preIcon={SvgIconEnum.FCR_LINK}>
          {transI18n('fcr_invite_button_copy_link')}
        </Button>
      </CopyToClipboard>
    </div>
  );
};
