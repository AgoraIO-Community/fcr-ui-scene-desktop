import { Button } from '@components/button';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { EduClassroomConfig } from 'agora-edu-core';
import './index.css';
import { ToastApi } from '@components/toast';
import { getConfig } from '@ui-scene/utils/launch-options-holder';
import { formatRoomID } from '@ui-scene/utils';
import { isNumber } from 'lodash';
import { useI18n } from 'agora-common-libs';
import ClipboardJS from 'clipboard';
import { useRef, useEffect } from 'react';

export const Share = () => {
  const { roomUuid, roomName } = EduClassroomConfig.shared.sessionInfo;
  const transI18n = useI18n();
  const { shareUrl } = getConfig();
  const roomCopyRef = useRef<HTMLDivElement | null>(null);
  const shareCopyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!roomCopyRef.current) return;
    const clipboard = new ClipboardJS(roomCopyRef.current);
    clipboard.on('success', () => {
      ToastApi.open({
        toastProps: { type: 'info', content: transI18n('fcr_invite_tips_copy_room_id') },
      });
    });
    return () => {
      clipboard.destroy();
    };
  }, []);

  useEffect(() => {
    if (!shareCopyRef.current) return;
    const clipboard = new ClipboardJS(shareCopyRef.current);
    clipboard.on('success', () => {
      ToastApi.open({
        toastProps: { type: 'info', content: transI18n('fcr_invite_tips_copy_invite') },
      });
    });
    return () => {
      clipboard.destroy();
    };
  }, []);

  return (
    <div className="fcr-share">
      <div className="fcr-share-title">{transI18n('fcr_invite_label_title')}</div>
      <div className="fcr-share-room-name">{roomName}</div>
      <div className="fcr-share-room-id">
        <span>{transI18n('fcr_invite_label_room_id')}</span>
        <span>{isNumber(roomUuid) ? formatRoomID(roomUuid) : roomUuid}</span>
        <div className="fcr-share-room-id-copy" data-clipboard-text={roomUuid} ref={roomCopyRef}>
          <SvgImg size={20} type={SvgIconEnum.FCR_COPY}></SvgImg>
        </div>
      </div>
      {shareUrl ? (
        <>
          <div className="fcr-share-room-link">
            <span>{transI18n('fcr_invite_label_invite_link')}</span>
            <span>{shareUrl as string}</span>
          </div>
          <div data-clipboard-text={shareUrl as string} ref={shareCopyRef}>
            <Button size="XS" block shape="rounded" preIcon={SvgIconEnum.FCR_LINK}>
              {transI18n('fcr_invite_button_copy_link')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};
