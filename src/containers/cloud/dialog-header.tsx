import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { Tabs } from '@components/tabs';
import { observer } from 'mobx-react';
import { useContext, useState } from 'react';
import './dialog-header.css';
import { Popover } from '@components/popover';
import classnames from 'classnames';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { CloudTabsValueContext } from '.';
import { useI18n } from 'agora-common-libs';

export const CloudDialogHeader = observer(() => {
  const { currentTab, setCurrentTab } = useContext(CloudTabsValueContext);
  const colors = themeVal('colors');
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const transI18n = useI18n();
  const iconColor = tooltipVisible ? colors['brand']['6'] : undefined;

  const cloudTabsItems = [
    { label: transI18n('fcr_cloud_public_resource'), key: transI18n('fcr_cloud_public_resource') },
    {
      label: transI18n('fcr_cloud_private_resource'),
      key: transI18n('fcr_cloud_private_resource'),
    },
  ];

  return (
    <div className="fcr-cloud-dialog-header">
      <div>{transI18n('fcr_cloud_label_cloud')}</div>
      <div>
        <Tabs
          onChange={(key) => {
            setCurrentTab(key);
          }}
          activeKey={currentTab}
          items={cloudTabsItems}></Tabs>
      </div>
      <Popover
        visible={tooltipVisible}
        onVisibleChange={setTooltipVisible}
        mouseEnterDelay={0}
        overlayInnerStyle={{ width: 182 }}
        content={<TipsContent></TipsContent>}
        placement="bottom"
        showArrow>
        <div
          className={classnames('fcr-cloud-dialog-header-tips-wrapper', {
            'fcr-cloud-dialog-header-tips-wrapper-active': tooltipVisible,
          })}>
          <div
            className={classnames('fcr-cloud-dialog-header-tips', {
              'fcr-cloud-dialog-header-tips-active': tooltipVisible,
            })}>
            <SvgImg
              colors={{ iconPrimary: iconColor }}
              type={SvgIconEnum.FCR_QUESTION2}
              size={16}></SvgImg>
          </div>
        </div>
      </Popover>
    </div>
  );
});
const TipsContent = () => {
  const {
    cloudUIStore: { cloudHelpTips },
  } = useStore();
  const transI18n = useI18n();
  return (
    <div className="fcr-cloud-dialog-header-tips-content">
      <div className="fcr-cloud-dialog-header-tips-content-desc">
        {transI18n('fcr_cloud_tips_supported_formats')}
      </div>
      <div className="fcr-cloud-dialog-header-tips-content-file-type-wrapper">
        {cloudHelpTips.map((tips) => {
          return (
            <div key={tips.svgType} className="fcr-cloud-dialog-header-tips-content-file-type-item">
              <div className="fcr-cloud-dialog-header-tips-content-file-type-item-icon">
                <SvgImg type={tips.svgType} size={30}></SvgImg>
              </div>
              <div className="fcr-cloud-dialog-header-tips-content-file-type-item-desc">
                <div className="fcr-cloud-dialog-header-tips-content-file-type-item-desc-text">
                  {tips.desc}
                </div>
                <div className="fcr-cloud-dialog-header-tips-content-file-type-item-desc-format">
                  {transI18n('fcr_cloud_label_format')}: {tips.supportType.join(' ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
