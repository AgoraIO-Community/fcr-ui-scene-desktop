import { SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { ActionBarItem } from '..';
import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useEffect, useState } from 'react';
import { DialogToolTip } from '@components/tooltip/dialog';
import classnames from 'classnames';
import { useI18n } from 'agora-common-libs';
import raiseHandsImg from './assets/raise_hands.png';
export const RaiseHands = observer(() => {
  return <StudentRaiseHands></StudentRaiseHands>;
});
const StudentRaiseHands = observer(() => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [dialogTooltipVisible, setDialogTooltipVisible] = useState(false);
  const {
    actionBarUIStore: { isHandsUp, lowerHand, raiseHand },
  } = useStore();
  const transI18n = useI18n();
  useEffect(() => {
    setDialogTooltipVisible(isHandsUp);
  }, [isHandsUp]);
  useEffect(() => {
    dialogTooltipVisible && setTooltipVisible(false);
  }, [dialogTooltipVisible]);
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
      content={transI18n('fcr_participants_label_raise_hand')}>
      <DialogToolTip
        getTooltipContainer={() =>
          document.querySelector('.fcr-action-bar-raise-hand') as HTMLElement
        }
        overlayClassName="fcr-action-bar-raise-hand-dialog"
        onClose={() => setDialogTooltipVisible(false)}
        visible={dialogTooltipVisible}
        content={
          <span className="fcr-action-bar-raise-hand-content" onClick={() => lowerHand()}>
            <img src={raiseHandsImg}></img> {transI18n('fcr_participants_tips_lower_hand')}
          </span>
        }>
        <ActionBarItem
          classNames={classnames('fcr-action-bar-raise-hand', {
            'fcr-action-bar-raise-hand-active': isHandsUp,
          })}
          onClick={() => {
            isHandsUp ? lowerHand() : raiseHand();
          }}
          icon={SvgIconEnum.FCR_STUDENT_RASIEHAND}
          text={transI18n('fcr_participants_label_raise_hand')}></ActionBarItem>
      </DialogToolTip>
    </ToolTip>
  );
});
