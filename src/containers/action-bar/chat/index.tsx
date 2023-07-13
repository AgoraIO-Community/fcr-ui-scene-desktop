import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { ActionBarItem } from '..';
import './index.css';
import { chatroomWidgetId } from '@onlineclass/extension/type';
export const Chat = observer(() => {
  const {
    actionBarUIStore: { openChatDialog, closeChatDialog },
    eduToolApi: { isWidgetVisible },
  } = useStore();
  const chatVisible = isWidgetVisible(chatroomWidgetId);
  return (
    <div>
      <div id="fcr-chatroom-slot"></div>
      <ToolTip content={chatVisible ? 'Close chat' : 'Open chat'}>
        <ActionBarItem
          onClick={() => (chatVisible ? closeChatDialog() : openChatDialog())}
          icon={SvgIconEnum.FCR_CHAT2}
          text={'Chat'}></ActionBarItem>
      </ToolTip>
    </div>
  );
});
