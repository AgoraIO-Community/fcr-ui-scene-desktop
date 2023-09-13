import { useStore } from '@ui-scene/utils/hooks/use-store';
import { FC, createContext, useState } from 'react';
import { GlobalDialog } from '@components/dialog/global-dialog';
import { observer } from 'mobx-react';
import { CloudDialogHeader } from './dialog-header';
import { PersonalResource } from './personal';
import { PublicResource } from './public';
import { useI18n } from 'agora-common-libs';

export const CloudTabsValueContext = createContext<{
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}>({ currentTab: '', setCurrentTab: () => {} });

export const CloudDialog: FC = observer(() => {
  const transI18n = useI18n();

  const cloudTabsItems = [
    { label: transI18n('fcr_cloud_public_resource'), key: transI18n('fcr_cloud_public_resource') },
    {
      label: transI18n('fcr_cloud_private_resource'),
      key: transI18n('fcr_cloud_private_resource'),
    },
  ];
  const [currentTab, setCurrentTab] = useState<string>(cloudTabsItems[0].key);

  const {
    cloudUIStore: { cloudDialogVisible, setCloudDialogVisible },
  } = useStore();

  return (
    <CloudTabsValueContext.Provider value={{ currentTab, setCurrentTab }}>
      <GlobalDialog
        headerWrapperStyle={{
          height: '36px',
        }}
        header={<CloudDialogHeader></CloudDialogHeader>}
        visible={cloudDialogVisible}
        onClose={() => {
          setCloudDialogVisible(false);
        }}>
        {currentTab === transI18n('fcr_cloud_public_resource') && <PublicResource></PublicResource>}
        {currentTab === transI18n('fcr_cloud_private_resource') && (
          <PersonalResource></PersonalResource>
        )}
      </GlobalDialog>
    </CloudTabsValueContext.Provider>
  );
});
