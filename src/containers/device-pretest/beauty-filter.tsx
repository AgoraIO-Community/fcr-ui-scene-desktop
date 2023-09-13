import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

export const BeautyFilter = observer(() => {
  const transI18n = useI18n();
  const { deviceSettingUIStore } = useStore();

  const {
    activeBeautyType,
    setBeautyType,
    beautyBlushValue,
    beautyBrighteningValue,
    beautySmoothValue,
    isBeautyFilterEnabled,
    closeBeautyFilter,
  } = deviceSettingUIStore;

  const beautyTypeList = [
    {
      type: 'smooth' as const,
      icon: SvgIconEnum.FCR_SMOOTH,
      label: transI18n('fcr_device_option_beauty_filter_smoothing'),
      enabled: isBeautyFilterEnabled && !!beautySmoothValue,
    },
    {
      type: 'brightening' as const,
      icon: SvgIconEnum.FCR_BEAUTY_RETOUCH,
      label: transI18n('fcr_device_option_beauty_filter_retouch'),
      enabled: isBeautyFilterEnabled && !!beautyBrighteningValue,
    },
    {
      type: 'blush' as const,
      icon: SvgIconEnum.FCR_BEAUTY_BLUSH,
      label: transI18n('fcr_device_option_beauty_filter_blush'),
      enabled: isBeautyFilterEnabled && !!beautyBlushValue,
    },
  ];

  const noneButtonCls = classNames({
    'fcr-pretest-beauty-filter__list-item--active': !isBeautyFilterEnabled,
  });

  return (
    <div className="fcr-pretest-beauty-filter">
      <ul className="fcr-pretest-beauty-filter__list">
        <li className={noneButtonCls}>
          <div className="fcr-pretest-beauty-filter__list-item-inner" onClick={closeBeautyFilter}>
            <SvgImg
              className="fcr-pretest-beauty-filter__list-item-status-icon"
              type={SvgIconEnum.FCR_SETTING_NONE}
              size={40}
              colors={{ iconPrimary: 'currentColor' }}
            />
          </div>
          <span className="fcr-pretest-beauty-filter__list-item-label">
            {transI18n('fcr_device_option_beauty_filter_none')}
          </span>
        </li>

        {beautyTypeList.map(({ type, icon, label, enabled }, index) => {
          const isActive = isBeautyFilterEnabled && type === activeBeautyType;
          const backgroundListItemCls = classNames({
            'fcr-pretest-beauty-filter__list-item--active': isActive,
          });

          const innerCls = classNames('fcr-pretest-beauty-filter__list-item-inner', {
            'fcr-pretest-beauty-filter__list-item-inner--enabled': enabled,
          });

          const handleClick = () => {
            setBeautyType(type);
          };

          return (
            <li key={index.toString()} className={backgroundListItemCls}>
              <div className={innerCls} onClick={handleClick}>
                <SvgImg
                  className="fcr-pretest-beauty-filter__list-item-status-icon"
                  type={icon}
                  size={48}
                  colors={{ iconPrimary: 'currentColor' }}
                />
              </div>
              <span className="fcr-pretest-beauty-filter__list-item-label">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
