import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { ActionBarItem } from '..';
import './index.css';
import {
  AgoraIMImageMessage,
  AgoraIMMessageType,
  AgoraIMTextMessage,
  chatroomWidgetId,
} from '@ui-scene/extension/type';
import { Scheduler, useI18n } from 'agora-common-libs';
import { useEffect, useRef, useState } from 'react';
import { DialogToolTip } from '@components/tooltip/dialog';
import { Avatar } from '@components/avatar';
export const Chat = observer(() => {
  const {
    actionBarUIStore: { openChatDialog, closeChatDialog },
    eduToolApi: { isWidgetVisible },
  } = useStore();
  const transI18n = useI18n();
  const chatVisible = isWidgetVisible(chatroomWidgetId);
  return (
    <div>
      <FcrChatroomTooltip></FcrChatroomTooltip>
      <ToolTip
        content={
          chatVisible ? transI18n('fcr_room_tips_close_chat') : transI18n('fcr_room_tips_open_chat')
        }>
        <ActionBarItem
          classNames="fcr-action-bar-chat"
          onClick={() => (chatVisible ? closeChatDialog() : openChatDialog())}
          icon={SvgIconEnum.FCR_CHAT2}
          text={transI18n('fcr_room_button_chat')}></ActionBarItem>
      </ToolTip>
    </div>
  );
});

const FcrChatroomTooltip = observer(() => {
  const {
    actionBarUIStore: { openChatDialog },
    eduToolApi: { isWidgetVisible, lastUnreadMessage },
  } = useStore();
  const chatVisible = isWidgetVisible(chatroomWidgetId);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipVisibelTaskRef = useRef<Scheduler.Task | null>(null);
  const hideToolTip = () => {
    setTooltipVisible(false);
    tooltipVisibelTaskRef.current?.stop();
  };
  useEffect(() => {});
  useEffect(() => {
    if (!chatVisible && lastUnreadMessage) {
      tooltipVisibelTaskRef.current?.stop();
      setTooltipVisible(true);
      tooltipVisibelTaskRef.current = Scheduler.shared.addDelayTask(hideToolTip, 6000);
    }
  }, [lastUnreadMessage]);
  useEffect(() => {
    if (chatVisible) {
      hideToolTip();
    }
    return hideToolTip;
  }, [chatVisible]);
  return (
    <DialogToolTip
      getTooltipContainer={() => document.querySelector('.fcr-action-bar-chat') as HTMLElement}
      content={
        <FcrChatroomTooltipContent
          onClick={openChatDialog}
          message={lastUnreadMessage}></FcrChatroomTooltipContent>
      }
      visible={tooltipVisible}
      onClose={hideToolTip}>
      <div></div>
    </DialogToolTip>
  );
});
const FcrChatroomTooltipContent = ({
  message,
  onClick,
}: {
  message: AgoraIMTextMessage | AgoraIMImageMessage | null;
  onClick: () => void;
}) => {
  const transI18n = useI18n();
  const msg =
    message?.type === AgoraIMMessageType.Image
      ? '[Image Message]'
      : (message as AgoraIMTextMessage)?.msg;
  const isPrivateMessage = message?.ext?.receiverList && message?.ext?.receiverList.length > 0;
  return (
    <div className="fcr-chatroom-tooltip-content" onClick={onClick}>
      <Avatar size={32} textSize={10} nickName={message?.ext?.nickName || ''}></Avatar>

      <div className="fcr-chatroom-tooltip-content-text">
        <div className="fcr-chatroom-tooltip-content-from">
          <span>
            {transI18n('fcr_chat_message_from')}
            <span>{message?.ext?.nickName}</span>
          </span>
          {isPrivateMessage && (
            <span className="fcr-chatroom-tooltip-content-from-private">
              &nbsp;({transI18n('fcr_chat_label_private')})
            </span>
          )}
        </div>
        <div className="fcr-chatroom-tooltip-content-from">
          <span>{msg}</span>
        </div>
      </div>
    </div>
  );
};
