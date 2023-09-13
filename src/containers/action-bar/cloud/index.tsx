import { SvgIconEnum } from '@components/svg-img';
import { ActionBarItem } from '..';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { ToolTip } from '@components/tooltip';
import { useI18n } from 'agora-common-libs';
const colors = themeVal('colors');
export const Cloud = observer(() => {
  const transI18n = useI18n();
  const {
    cloudUIStore: { setCloudDialogVisible },
  } = useStore();

  const handleClick = () => {
    setCloudDialogVisible(true);
  };

  return (
    <ToolTip content={transI18n('fcr_room_tips_open_cloud')}>
      <ActionBarItem
        icon={{
          type: SvgIconEnum.FCR_WHITEBOARD_CLOUD,
        }}
        text={
          <span
            style={{
              color: colors['text-2'],
            }}>
            {transI18n('fcr_room_button_cloud')}
          </span>
        }
        onClick={handleClick}></ActionBarItem>
    </ToolTip>
  );
});
