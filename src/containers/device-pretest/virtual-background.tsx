import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { ToolTip } from '@components/tooltip';
import { useI18n } from 'agora-common-libs';

export const VirtualBackground = observer(() => {
  const { deviceSettingUIStore } = useStore();
  const transI18n = useI18n();
  const {
    activeBackgroundUrl,
    setVirtualBackground,
    virtualBackgroundList,
    isVirtualBackgroundEnabled,
    closeVirtualBackground,
  } = deviceSettingUIStore;

  const noneButtonCls = classNames({
    'fcr-pretest-virtual-background__list-item--active': !isVirtualBackgroundEnabled,
  });

  return (
    <div className="fcr-pretest-virtual-background">
      <ul className="fcr-pretest-virtual-background__list">
        <ToolTip content={transI18n('fcr_device_option_beauty_filter_none')}>
          <li className={noneButtonCls}>
            <div
              className="fcr-pretest-virtual-background__list-item-inner"
              onClick={closeVirtualBackground}>
              <div className="fcr-pretest-virtual-background__check">
                <SvgImg
                  className="fcr-pretest-beauty-filter__list-item-status-icon"
                  type={SvgIconEnum.FCR_SETTING_NONE}
                  size={40}
                  colors={{ iconPrimary: 'currentColor' }}
                />
              </div>
            </div>
          </li>
        </ToolTip>

        {virtualBackgroundList.map(({ url, type }, index) => {
          const isActive = isVirtualBackgroundEnabled && url === activeBackgroundUrl;

          const backgroundListItemCls = classNames({
            'fcr-pretest-virtual-background__list-item--active': isActive,
          });

          const handleClick = () => {
            setVirtualBackground({ url, type });
          };

          return (
            <li key={index.toString()} className={backgroundListItemCls}>
              <div
                className="fcr-pretest-virtual-background__list-item-inner"
                onClick={handleClick}>
                {type === 'video' ? (
                  <video autoPlay loop muted>
                    <source src={url} type="video/mp4" />
                  </video>
                ) : (
                  <img src={url} />
                )}

                {isActive && (
                  <div className="fcr-pretest-virtual-background__check">
                    <SvgImg
                      className="fcr-pretest-beauty-filter__list-item-status-icon"
                      type={SvgIconEnum.FCR_CHECKBOX_CHECK}
                      colors={{ iconPrimary: 'currentColor' }}
                    />
                  </div>
                )}
                {type === 'video' && (
                  <div className="fcr-pretest-virtual-background__badge">
                    <SvgImg type={SvgIconEnum.FCR_CAMERA3} size={20} />
                  </div>
                )}

                {/* <div className="fcr-pretest-virtual-background__delete">
                  <SvgImg type={SvgIconEnum.FCR_DELETE3} />
                </div> */}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
