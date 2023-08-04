import React, { useState } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import { AudioSettings } from './audio-settings';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { VideoSettings } from './video-settings';
import './index.css';
import { useI18n } from 'agora-common-libs';

const tabContents = {
  audio: <AudioSettings />,
  video: <VideoSettings />,
};

type TabKeyType = keyof typeof tabContents;

export const DeviceSettings = observer(() => {
  const [activeTab, setActiveTab] = useState<TabKeyType>('video');
  const transI18n = useI18n();

  const cls = classNames('fcr-device-settings');

  const tabClickHandler = (tabKey: TabKeyType) => {
    return () => {
      setActiveTab(tabKey);
    };
  };

  const audioItemCls = classNames({
    'fcr-device-settings__nav-list-item--active': activeTab === 'audio',
  });
  const videoItemCls = classNames({
    'fcr-device-settings__nav-list-item--active': activeTab === 'video',
  });

  return (
    <div className={cls}>
      {/* tab nav */}
      <div className="fcr-device-settings__nav">
        <ul className="fcr-device-settings__nav-list">
          <li className={audioItemCls} onClick={tabClickHandler('audio')}>
            <div className="fcr-device-settings__surrounding--green">
              <SvgImg type={SvgIconEnum.FCR_MUTE} size={22} />
            </div>
            {transI18n('fcr_device_option_voice')}
          </li>
          <li className={videoItemCls} onClick={tabClickHandler('video')}>
            <div className="fcr-device-settings__surrounding--purple">
              <SvgImg type={SvgIconEnum.FCR_CAMERA} size={22} />
            </div>
            {transI18n('fcr_device_option_video')}
          </li>
        </ul>
      </div>
      {/* main */}
      <div className="fcr-device-settings__preview">{tabContents[activeTab]}</div>
    </div>
  );
});
