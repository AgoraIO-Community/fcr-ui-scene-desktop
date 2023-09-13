import { Button } from '@components/button';
import { InputNumber } from '@components/input-number';
import { Popover, PopoverWithTooltip } from '@components/popover';
import { Radio } from '@components/radio';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import React, { FC, useEffect, useRef, useState } from 'react';
import { CreatePanel } from './create-panel';
import { BreakoutRoomGrouping } from './grouping';
import { Toast } from '@components/toast';
import { GroupState } from 'agora-edu-core';
import { BroadcastMessagePanel } from './broadcast-panel';
import { useI18n } from 'agora-common-libs';

export const BreakoutWizard: FC<{ onChange: () => void }> = observer(({ onChange }) => {
  const {
    breakoutUIStore: { wizardState },
  } = useStore();

  useEffect(() => {
    onChange();
  }, [wizardState]);

  return wizardState === 0 ? <WizardCreate /> : <WizardGrouping />;
});

export const WizardGrouping: FC = observer(() => {
  const {
    eduToolApi,
    layoutUIStore: { addDialog },
    breakoutUIStore: { setDialogVisible, groupState, startGroup, toasts, stopGroup },
  } = useStore();
  const [checked, setChecked] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [broadcastVisible, setBroadcastVisible] = useState(false);
  const transI18n = useI18n();
  const panelRef = useRef<{ closePopover: () => void }>(null);
  const handleMinimize = () => {
    eduToolApi.setMinimizedState({
      minimized: true,
      widgetId: 'breakout',
      minimizedProperties: {
        minimizedIcon: SvgIconEnum.FCR_V2_BREAKROOM,
        minimizedTooltip: transI18n('fcr_group_breakout_room'),
      },
    });
  };
  const handleClose = () => {
    setDialogVisible(false);
  };
  const toggleCheck = () => {
    setChecked(!checked);
  };
  const handleCreateClose = () => {
    setCreateVisible(false);
    if (panelRef.current) {
      panelRef.current.closePopover();
    }
  };

  const handleBroadcastClose = () => {
    setBroadcastVisible(false);
    if (panelRef.current) {
      panelRef.current.closePopover();
    }
  };
  const handleStart = () => {
    startGroup({ copyBoardState: checked });
  };

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

  const groupStateLabel = groupState
    ? transI18n('fcr_group_in_progress')
    : transI18n('fcr_group_not_status');

  return (
    <div className="fcr-breakout-room-dialog">
      {/* header */}
      <div className="fcr-breakout-room-dialog__header fcr-breakout-room__drag-handle">
        {/* title */}
        <div>
          {transI18n('fcr_group_breakout_room')}{' '}
          <span className="fcr-breakout-room-dialog__header-tag">{groupStateLabel}</span>
        </div>
        {/* actions */}
        <div className="fcr-breakout-room-dialog__actions fcr-breakout-room__drag-cancel">
          <ul>
            <ToolTip content={transI18n('fcr_group_minimization')}>
              <li>
                <SvgImg
                  type={SvgIconEnum.FCR_WINDOWPAGE_SMALLER}
                  size={14}
                  onClick={handleMinimize}
                />
              </li>
            </ToolTip>
            <ToolTip content={transI18n('fcr_group_close')}>
              <li>
                <SvgImg type={SvgIconEnum.FCR_CLOSE} size={14} onClick={handleClose} />
              </li>
            </ToolTip>
          </ul>
        </div>
      </div>
      {/* content */}
      <BreakoutRoomGrouping />
      {/* bottom actions */}
      <div className="fcr-breakout-room-dialog__foot-actions">
        {groupState === GroupState.OPEN ? (
          <React.Fragment>
            <PopoverWithTooltip
              ref={panelRef}
              toolTipProps={{
                placement: 'top',
                content: transI18n('fcr_group_tips_broadcast_message'),
              }}
              popoverProps={{
                showArrow: true,
                overlayOffset: 8,
                placement: 'top',
                content: <BroadcastMessagePanel onClose={handleBroadcastClose} />,
                overlayClassName: 'fcr-breakout-room__create__overlay',
                onVisibleChange: setBroadcastVisible,
              }}>
              <Button size="XS" type="secondary">
                {transI18n('fcr_group_label_broadcast_message')}
                <SvgImg
                  type={SvgIconEnum.FCR_DROPDOWN}
                  style={{
                    transform: `rotate(${broadcastVisible ? '0deg' : '180deg'})`,
                    transition: '.3s all',
                  }}
                />
              </Button>
            </PopoverWithTooltip>
            <Button
              size="XS"
              onClick={handleStop}
              styleType="danger"
              preIcon={SvgIconEnum.FCR_CLOSE}>
              {transI18n('fcr_group_button_stop')}
            </Button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Radio
              label={transI18n('fcr_group_copy_content_to_group')}
              checked={checked}
              onClick={toggleCheck}
            />
            <Popover
              trigger="click"
              showArrow
              overlayOffset={8}
              placement="top"
              content={<CreatePanel onClose={handleCreateClose} />}
              overlayClassName="fcr-breakout-room__create__overlay"
              onVisibleChange={setCreateVisible}
              visible={createVisible}>
              <Button size="XS" type="secondary">
                {transI18n('fcr_group_recreate')}
                <SvgImg
                  type={SvgIconEnum.FCR_DROPDOWN}
                  style={{
                    transform: `rotate(${createVisible ? '0deg' : '180deg'})`,
                    transition: '.3s all',
                  }}
                />
              </Button>
            </Popover>
            <Button size="XS" onClick={handleStart}>
              {transI18n('fcr_group_start')}
            </Button>
          </React.Fragment>
        )}
      </div>
      {toasts.map(({ id, text }, index) => {
        return (
          <div
            key={id}
            style={{ bottom: 65 + index * 45 }}
            className="fcr-breakout-room-dialog__toast">
            <Toast content={text} type="normal" size="small" />
          </div>
        );
      })}
    </div>
  );
});

export const WizardCreate = observer(() => {
  const {
    eduToolApi,
    breakoutUIStore: { setWizardState, setDialogVisible, createGroups, numberToBeAssigned },
  } = useStore();
  const [type, setType] = useState<1 | 2>(1);
  const [groupNum, setGroupNum] = useState(1);
  const transI18n = useI18n();

  const perGroup = groupNum ? Math.floor(numberToBeAssigned / groupNum) : 0;

  const handleChangeType = (type: 1 | 2) => {
    return () => {
      setType(type);
    };
  };

  const handleCreate = () => {
    createGroups(type, groupNum);
    setWizardState(1);
  };

  const handleMinimize = () => {
    eduToolApi.setMinimizedState({
      minimized: true,
      widgetId: 'breakout',
      minimizedProperties: {
        minimizedIcon: SvgIconEnum.FCR_V2_BREAKROOM,
        minimizedTooltip: transI18n('fcr_group_breakout_room'),
      },
    });
  };

  const handleClose = () => {
    setDialogVisible(false);
  };

  const handleChangeGroupNum = (num: number | null) => {
    if (num) {
      setGroupNum(num);
    } else {
      setGroupNum(1);
    }
  };

  return (
    <div className="fcr-breakout-room-dialog">
      {/* header */}
      <div className="fcr-breakout-room-dialog__header fcr-breakout-room__drag-handle">
        {/* title */}
        <div>
          {transI18n('fcr_group_breakout_room')}{' '}
          <span className="fcr-breakout-room-dialog__header-tag">
            {transI18n('fcr_group_not_status')}
          </span>
        </div>
        {/* actions */}
        <div className="fcr-breakout-room-dialog__actions fcr-breakout-room__drag-cancel">
          <ul>
            <ToolTip content={transI18n('fcr_group_minimization')}>
              <li>
                <SvgImg
                  type={SvgIconEnum.FCR_WINDOWPAGE_SMALLER}
                  size={14}
                  onClick={handleMinimize}
                />
              </li>
            </ToolTip>
            <ToolTip content={transI18n('fcr_group_close')}>
              <li>
                <SvgImg type={SvgIconEnum.FCR_CLOSE} size={14} onClick={handleClose} />
              </li>
            </ToolTip>
          </ul>
        </div>
      </div>
      {/* content */}
      <div className="fcr-breakout-room__grouping">
        <div className="fcr-breakout-room__grouping-column-header">
          <div className="fcr-breakout-room__inner">
            <span>{transI18n('fcr_group_label_create')}</span>
            <InputNumber size="small" min={1} onChange={handleChangeGroupNum} value={groupNum} />
            <span>{transI18n('fcr_group_label_breakout_rooms')}</span>
          </div>
        </div>
        <div className="fcr-breakout-room__grouping-column-content">
          <div className="fcr-breakout-room__inner">
            <div className="fcr-breakout-room__create_type">
              <Radio
                label={transI18n('fcr_group_assign_automatically')}
                checked={type === 1}
                onChange={handleChangeType(1)}
              />
            </div>
            <div className="fcr-breakout-room__create_type">
              <Radio
                label={transI18n('fcr_group_assign_manually')}
                checked={type === 2}
                onChange={handleChangeType(2)}
              />
            </div>
            {type === 2 ? (
              <p className="fcr-breakout-room__widget-dialog-info">
                {transI18n('fcr_group_tips_persons_per_group1', { reason1: numberToBeAssigned })}
                {numberToBeAssigned > 0 &&
                  transI18n('fcr_group_tips_persons_per_group2', {
                    reason1: `${perGroup}-${perGroup + 1}`,
                  })}
              </p>
            ) : (
              <p className="fcr-breakout-room__widget-dialog-info">&nbsp;</p>
            )}

            <div className="fcr-breakout-room__instructions">
              <div className="fcr-breakout-room__instructions-title">
                {transI18n('fcr_group_label_instructions')}
              </div>
              {/* divider */}
              <div className="fcr-breakout-room__widget-dialog-divider" />
              <div className="fcr-breakout-room__instructions-steps">
                <div>{transI18n('fcr_group_label_create_room')}</div>
                <SvgImg type={SvgIconEnum.FCR_WIZARD_ARROW} size={42} />
                <div>{transI18n('fcr_group_label_manage_group')}</div>
                <SvgImg type={SvgIconEnum.FCR_WIZARD_ARROW} size={42} />
                <div>{transI18n('fcr_group_label_end_discuss')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* bottom actions */}
      <div className="fcr-breakout-room-dialog__foot-actions">
        <Button size="XS" styleType="gray" onClick={handleClose}>
          {transI18n('fcr_group_button_cancel')}
        </Button>
        <Button size="XS" onClick={handleCreate}>
          {transI18n('fcr_group_button_create')}
        </Button>
      </div>
    </div>
  );
});
