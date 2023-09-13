import { Radio } from '@components/radio';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { Layout } from '@ui-scene/uistores/type';
import classnames from 'classnames';
import './index.css';
import { observer } from 'mobx-react';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { StatusBarItemWrapper } from '..';
import { PopoverWithTooltip } from '@components/popover';
import { useEffect, useRef } from 'react';
import { useI18n } from 'agora-common-libs';

export const LayoutSwitchPopover = observer(() => {
  const transI18n = useI18n();
  const {
    layoutUIStore: { gridLayoutDisabled },
    actionBarUIStore: { isScreenSharing },
  } = useStore();
  return (
    <div className="fcr-layout-switch">
      <div className="fcr-layout-switch-speaker-view">
        <div className="fcr-layout-switch-title">{transI18n('fcr_layout_label_speaker_view')}</div>
        <div className="fcr-layout-switch-view-wrap">
          <LayoutCard layout={Layout.ListOnTop}></LayoutCard>
          <LayoutCard layout={Layout.ListOnRight}></LayoutCard>
        </div>
      </div>
      <div className="fcr-layout-switch-grid">
        <div className="fcr-layout-switch-title">{transI18n('fcr_layout_label_grid')}</div>
        {gridLayoutDisabled && (
          <div className="fcr-layout-switch-desc">
            {isScreenSharing
              ? transI18n('fcr_layout_cannot_switch_while_screen_sharing')
              : transI18n('fcr_layout_cannot_switch_while_board_openning')}
          </div>
        )}
        <div className="fcr-layout-switch-view-wrap">
          <LayoutCard layout={Layout.Grid}></LayoutCard>
        </div>
      </div>
    </div>
  );
});
export const useLayoutMap = () => {
  const transI18n = useI18n();
  return {
    [Layout.ListOnTop]: {
      label: transI18n('fcr_layout_option_list_on_top'),
      bigIcon: SvgIconEnum.FCR_LIST_ON_TOP_BIG,
      smallIcon: SvgIconEnum.FCR_TOPWINDOWS,
    },
    [Layout.ListOnRight]: {
      label: transI18n('fcr_layout_option_list_on_right'),
      bigIcon: SvgIconEnum.FCR_LIST_ON_RIGHT_BIG,
      smallIcon: SvgIconEnum.FCR_RIGHTWINDOWS,
    },
    [Layout.Grid]: {
      label: transI18n('fcr_layout_label_grid'),
      bigIcon: SvgIconEnum.FCR_GRID_BIG,
      smallIcon: SvgIconEnum.FCR_FOURWINDOWS,
    },
  };
};

const LayoutCard = observer(({ layout }: { layout: Layout }) => {
  const {
    layoutUIStore: { layout: currentLayout, setLayout, gridLayoutDisabled },
  } = useStore();
  const layoutMap = useLayoutMap();
  const disabled = layout === Layout.Grid && gridLayoutDisabled;
  const { label, bigIcon } = layoutMap[layout];
  const active = currentLayout === layout;
  return (
    <div
      onClick={() => !disabled && setLayout(layout)}
      className={classnames('fcr-layout-switch-card', {
        'fcr-layout-switch-card-active': active,
        'fcr-layout-switch-card-disabled': disabled,
      })}>
      <div className="fcr-layout-switch-card-checkbox">
        <Radio styleType="white" label={label} checked={active}></Radio>
      </div>
      <div className="fcr-layout-switch-card-icon">
        <SvgImg style={{ width: 100, height: 56 }} type={bigIcon}></SvgImg>
      </div>
    </div>
  );
});
export const LayoutSwitch = observer(() => {
  const transI18n = useI18n();
  const layoutMap = useLayoutMap();

  const {
    layoutUIStore: { layout: currentLayout, setHasPopoverShowed },
  } = useStore();
  const popoverRef = useRef<{ closePopover: () => void } | null>(null);
  useEffect(() => {
    popoverRef.current?.closePopover();
    setHasPopoverShowed(false);
  }, [currentLayout]);
  return (
    <StatusBarItemWrapper>
      <PopoverWithTooltip
        ref={popoverRef}
        popoverProps={{
          onVisibleChange(visible) {
            if (visible) {
              setHasPopoverShowed(true);
            } else {
              setHasPopoverShowed(false);
            }
          },
          placement: 'bottomRight',
          overlayInnerStyle: { width: 'auto' },
          content: <LayoutSwitchPopover></LayoutSwitchPopover>,
        }}
        toolTipProps={{ content: transI18n('fcr_room_tips_layout') }}>
        <div className="fcr-status-bar-layout">
          <SvgImg type={layoutMap[currentLayout].smallIcon} size={20}></SvgImg>
          <span>{transI18n('fcr_room_label_layout')}</span>
          <SvgImg
            className="fcr-status-bar-layout-dropdown"
            type={SvgIconEnum.FCR_DROPDOWN}
            size={18}></SvgImg>
        </div>
      </PopoverWithTooltip>
    </StatusBarItemWrapper>
  );
});
