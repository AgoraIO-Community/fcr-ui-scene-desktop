import { ToastApi } from '@components/toast';
import { useStore } from './use-store';
import { useI18n } from 'agora-common-libs';

export const useAuthorization = (userUuid: string) => {
  const {
    presentationUIStore: { isBoardWidgetActive },
    boardApi: { grantedUsers, grantPrivilege },
    statusBarUIStore: { isHost },
  } = useStore();
  const transI18n = useI18n();
  const granted = grantedUsers.has(userUuid);
  const tooltip = granted
    ? transI18n('fcr_user_button_unauthorization')
    : transI18n('fcr_user_button_authorization');
  const toggleAuthorization = () => {
    if (isHost) {
      if (!isBoardWidgetActive)
        return ToastApi.open({
          persist: true,
          duration: 15000,
          toastProps: {
            closable: true,
            type: 'error',
            content: transI18n('fcr_room_tips_authorize_open_whiteboard'),
          },
        });
      grantPrivilege(userUuid, !granted);
    }
  };
  return { tooltip, toggleAuthorization, granted };
};
