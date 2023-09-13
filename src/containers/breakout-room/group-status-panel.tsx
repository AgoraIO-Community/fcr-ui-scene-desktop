import { Button } from '@components/button';
import { Popover } from '@components/popover';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { BroadcastMessagePanel } from './broadcast-panel';
import { observer } from 'mobx-react';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useState } from 'react';
import { Rnd } from 'react-rnd';
import { useI18n } from 'agora-common-libs';
import { isTeacher } from '@ui-scene/utils/check';

export const GroupStatusPanel = observer(() => {
  const {
    layoutUIStore: { showStatusBar, addDialog },
    breakoutUIStore: { groupState, stopGroup, currentSubRoomInfo },
  } = useStore();
  const transI18n = useI18n();

  const [visible, setVisible] = useState(false);

  const handleStop = () => {
    addDialog('confirm', {
      title: transI18n('fcr_group_stop_discussion'),
      content: transI18n('fcr_group_tips_title_close_group'),
      onOk: () => {
        stopGroup();
      },
      okButtonProps: { styleType: 'danger' },

      okText: transI18n('fcr_group_button_stop'),
    });
  };

  const handleClose = () => {
    setVisible(false);
  };

  return isTeacher() && groupState ? (
    <Rnd
      default={{ x: 15, y: 38, width: 'auto', height: 'auto' }}
      enableResizing={false}
      style={{ zIndex: 1020 }}>
      <div className="fcr-breakout-room__status-panel" style={{ opacity: showStatusBar ? 1 : 0 }}>
        <SvgImg type={SvgIconEnum.FCR_V2_BREAKROOM} />
        <span className="fcr-breakout-room__status-panel-label">
          {currentSubRoomInfo
            ? currentSubRoomInfo.groupName
            : transI18n('fcr_group_in_group_discussion')}
        </span>
        <div className="fcr-divider" />
        <div className="fcr-breakout-room__status-panel-buttons">
          <Popover
            trigger="click"
            overlayOffset={8}
            placement="top"
            content={<BroadcastMessagePanel onClose={handleClose} />}
            overlayClassName="fcr-breakout-room__broadcast__overlay"
            onVisibleChange={setVisible}
            visible={visible}>
            <Button size="XS" type="secondary">
              {transI18n('fcr_group_label_broadcast_message')}
              <SvgImg
                type={SvgIconEnum.FCR_DROPDOWN}
                style={{
                  transform: `rotate(${visible ? '180deg' : '0deg'})`,
                  transition: 'all .3s',
                }}
              />
            </Button>
          </Popover>
          <Button size="XS" preIcon={SvgIconEnum.FCR_CLOSE} styleType="danger" onClick={handleStop}>
            {transI18n('fcr_group_button_stop')}
          </Button>
        </div>
      </div>
    </Rnd>
  ) : null;
});
