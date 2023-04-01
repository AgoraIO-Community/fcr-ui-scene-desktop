import { SvgIconEnum } from '@onlineclass/components/svg-img';
import { ToolTip } from '@onlineclass/components/tooltip';
import { ActionBarItem } from '..';
import './index.css';
import { useStore } from '@onlineclass/utils/hooks/use-store';

export const Setting = () => {
  const { layoutUIStore } = useStore();
  const actionClickHandler = (action: 'settings') => {
    return () => {
      switch (action) {
        case 'settings':
          if (!layoutUIStore.hasDialogOf('device-settings')) {
            layoutUIStore.addDialog('device-settings');
          }
          break;
      }
    };
  };
  return (
    <ToolTip content="Setting">
      <ActionBarItem
        icon={SvgIconEnum.FCR_SETTING}
        text={'Setting'}
        onClick={actionClickHandler('settings')}></ActionBarItem>
    </ToolTip>
  );
};
