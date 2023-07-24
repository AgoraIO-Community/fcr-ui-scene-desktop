import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { ActionBarItem } from '..';
import './index.css';
import { chatroomWidgetId } from '@onlineclass/extension/type';
import { useI18n } from 'agora-common-libs';
export const Chat = observer(() => {
  const {
    actionBarUIStore: { openChatDialog, closeChatDialog },
    eduToolApi: { isWidgetVisible },
  } = useStore();
  const transI18n = useI18n();
  const chatVisible = isWidgetVisible(chatroomWidgetId);
  return (
    <div>
      <div id="fcr-chatroom-slot"></div>
      <ToolTip
        content={
          chatVisible ? transI18n('fcr_room_tips_close_chat') : transI18n('fcr_room_tips_open_chat')
        }>
        <ActionBarItem
          onClick={() => (chatVisible ? closeChatDialog() : openChatDialog())}
          icon={SvgIconEnum.FCR_CHAT2}
          text={transI18n('fcr_room_button_chat')}></ActionBarItem>
      </ToolTip>
    </div>
  );
});
