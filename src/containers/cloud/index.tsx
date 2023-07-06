import { useStore } from '@onlineclass/utils/hooks/use-store';
import { FC, createContext, useState } from 'react';
import { GlobalDialog } from '@components/dialog/global-dialog';
import { observer } from 'mobx-react';
import { CloudDialogHeader } from './dialog-header';
import { CloudTabsType } from '@onlineclass/uistores/type';
import { PersonalResource } from './personal';
import { PublicResource } from './public';
export const CloudTabsValueContext = createContext<{
  currentTab: CloudTabsType;
  setCurrentTab: (tab: CloudTabsType) => void;
}>({ currentTab: CloudTabsType.Public, setCurrentTab: () => {} });
export const cloudTabsItems = [
  { label: CloudTabsType.Public, key: CloudTabsType.Public },
  { label: CloudTabsType.Personal, key: CloudTabsType.Personal },
];
export const CloudDialog: FC = observer(() => {
  const [currentTab, setCurrentTab] = useState<CloudTabsType>(CloudTabsType.Public);

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
        {currentTab === CloudTabsType.Public && <PublicResource></PublicResource>}
        {currentTab === CloudTabsType.Personal && <PersonalResource></PersonalResource>}
      </GlobalDialog>
    </CloudTabsValueContext.Provider>
  );
});
