import { SvgIconEnum } from '@components/svg-img';
import { ActionBarItem } from '..';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { Logger, useI18n } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { ToolTip } from '@components/tooltip';
const colors = themeVal('colors');
export const Whiteboard = observer(() => {
  const transI18n = useI18n();
  const {
    boardApi,
    actionBarUIStore: { isLocalScreenSharing },
    presentationUIStore: { isBoardWidgetActive },
  } = useStore();

  const handleClick = () => {
    if (isBoardWidgetActive) {
      Logger.info('disable');
      boardApi.disable();
    } else {
      Logger.info('enable');
      boardApi.enable();
    }
  };

  return (
    <ToolTip
      content={
        isLocalScreenSharing
          ? transI18n('fcr_screen_share_switch_white_broad')
          : isBoardWidgetActive
          ? transI18n('fcr_room_tips_close_whiteboard')
          : transI18n('fcr_room_tips_open_whiteboard')
      }>
      <ActionBarItem
        disabled={isLocalScreenSharing}
        icon={{
          type: isBoardWidgetActive ? SvgIconEnum.FCR_WHITEBOARD_ON : SvgIconEnum.FCR_WHITEBOARD,
          colors: { iconPrimary: isBoardWidgetActive ? colors['red'][6] : colors['icon-1'] },
        }}
        text={
          <span
            style={{
              color: isBoardWidgetActive ? colors['red'][6] : colors['text-2'],
            }}>
            {transI18n('fcr_room_button_whiteboard')}
          </span>
        }
        onClick={handleClick}></ActionBarItem>
    </ToolTip>
  );
});
