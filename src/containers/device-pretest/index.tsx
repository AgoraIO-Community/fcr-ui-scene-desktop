import React, { createContext, useState } from 'react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import './index.css';
import { observer } from 'mobx-react';
import { useI18n } from 'agora-common-libs';
import { FashionTabs } from '@components/tabs';
import { VirtualBackground } from './virtual-background';
import { BasicSettings } from './basic-settings';
import { BeautyFilter } from './beauty-filter';
import { VideoPortal } from './video-portal';
import { AgoraEduClassroomEvent, EduEventCenter, LeaveReason } from 'agora-edu-core';

const tabContents = {
  'basic-settings': <BasicSettings />,
  'virtual-background': <VirtualBackground />,
  'beauty-filter': <BeautyFilter />,
};

type TabKeyType = keyof typeof tabContents;
export const DeviceTabKeysContext = createContext<TabKeyType>('basic-settings');
export const DevicePretest = observer(() => {
  const transI18n = useI18n();

  const [activeTab, setActiveTab] = useState<TabKeyType>('basic-settings');
  const handleActiveTab = (tabKey: string) => {
    setActiveTab(tabKey as TabKeyType);
  };

  const tabItems = [
    { label: transI18n('fcr_device_option_basic_setting'), key: 'basic-settings' },
    { label: transI18n('fcr_device_option_background'), key: 'virtual-background' },
    { label: transI18n('fcr_device_option_beauty_filter'), key: 'beauty-filter' },
  ];
  const onClose = () => {
    EduEventCenter.shared.emitClasroomEvents(AgoraEduClassroomEvent.Destroyed, LeaveReason.leave);
  };

  return (
    <div className="fcr-pretest">
      {/* header */}
      <div className="fcr-pretest__header">
        <div></div>
        <button className="fcr-pretest__close-btn fcr-btn-click-effect" onClick={onClose}>
          <SvgImg type={SvgIconEnum.FCR_CLOSE} />
        </button>
      </div>
      <DeviceTabKeysContext.Provider value={activeTab}>
        <div className="fcr-pretest__content fcr-scrollbar-override">
          {/* center area */}
          <div className="fcr-pretest__center">
            <VideoPortal />
            <div className="fcr-pretest__settings">
              <FashionTabs items={tabItems} activeKey={activeTab} onChange={handleActiveTab} />
              {tabContents[activeTab]}
            </div>
          </div>
        </div>
      </DeviceTabKeysContext.Provider>
    </div>
  );
});
