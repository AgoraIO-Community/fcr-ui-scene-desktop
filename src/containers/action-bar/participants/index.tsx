import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react-lite';
import { ActionBarItem } from '..';
import './index.css';
import { DialogToolTip } from '@components/tooltip/dialog';
import { useEffect, useState } from 'react';
import { useI18n } from 'agora-common-libs';
export const Participants = observer(() => {
  const transI18n = useI18n();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [dialogTooltipVisible, setDialogTooltipVisible] = useState(false);
  const {
    actionBarUIStore: { handsUpMap },
    participantsUIStore: {
      participantList,
      participantsDialogVisible,
      toggleParticipantsDialogVisible,
      setParticipantsDialogVisible,
      isHost,
    },
  } = useStore();
  useEffect(() => {
    if (handsUpMap.size > 0 && !participantsDialogVisible && isHost) {
      setDialogTooltipVisible(true);
    } else {
      setDialogTooltipVisible(false);
    }
  }, [handsUpMap.size, participantsDialogVisible]);
  const userCount = participantList.length > 999 ? '999+' : participantList.length;
  return (
    <ToolTip
      visible={tooltipVisible}
      onVisibleChange={(visible) => {
        if (dialogTooltipVisible) {
          setTooltipVisible(false);
        } else {
          setTooltipVisible(visible);
        }
      }}
      content={
        participantsDialogVisible
          ? transI18n('fcr_room_tips_close_participants')
          : transI18n('fcr_room_tips_open_participants')
      }>
      <DialogToolTip
        closeable={false}
        overlayClassName="fcr-action-bar-raise-hand-dialog"
        content={
          <span
            className="fcr-action-bar-raise-hand-content"
            onClick={() => {
              setParticipantsDialogVisible(true);
              setDialogTooltipVisible(false);
            }}>
            <span>🙋</span> {handsUpMap.size}{' '}
            {transI18n('fcr_participants_tips_student_rasie_hand')}
          </span>
        }
        visible={dialogTooltipVisible}>
        <div className="fcr-action-bar-participants-wrapper">
          <div className="fcr-action-bar-participants-user-count">{userCount}</div>
          <ActionBarItem
            onClick={toggleParticipantsDialogVisible}
            icon={SvgIconEnum.FCR_PEOPLE}
            text={transI18n('fcr_room_button_participants')}></ActionBarItem>
        </div>
      </DialogToolTip>
    </ToolTip>
  );
});
