import { Button } from '@components/button';
import { InputNumber } from '@components/input-number';
import { PopoverWithTooltip } from '@components/popover';
import { Radio } from '@components/radio';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react';
import React, { FC, useEffect, useRef, useState } from 'react';
import { CreatePanel } from './create-panel';
import { BreakoutRoomGrouping } from './grouping';
import { Toast } from '@components/toast';
import { GroupState } from 'agora-edu-core';

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
    breakoutUIStore: { setDialogVisible, groupState, startGroup, toasts, stopGroup },
  } = useStore();
  const [checked, setChecked] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const panelRef = useRef<{ closePopover: () => void }>(null);
  const handleMinimize = () => {
    eduToolApi.setMinimizedState({
      minimized: true,
      widgetId: 'breakout',
      minimizeProperties: {
        minimizedIcon: SvgIconEnum.FCR_V2_BREAKROOM,
        minimizedTooltip: 'Breakout room',
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
  const handleStart = () => {
    startGroup({ copyBoardState: checked });
  };

  const handleStop = () => {
    stopGroup();
  };

  const groupStateLabel = groupState ? 'In Progress' : 'Not Started';

  return (
    <div className="fcr-breakout-room-dialog">
      {/* header */}
      <div className="fcr-breakout-room-dialog__header fcr-breakout-room__drag-handle">
        {/* title */}
        <div>
          Breakout Rooms{' '}
          <span className="fcr-breakout-room-dialog__header-tag">{groupStateLabel}</span>
        </div>
        {/* actions */}
        <div className="fcr-breakout-room-dialog__actions fcr-breakout-room__drag-cancel">
          <ul>
            <ToolTip content="Minimization">
              <li>
                <SvgImg
                  type={SvgIconEnum.FCR_WINDOWPAGE_SMALLER}
                  size={14}
                  onClick={handleMinimize}
                />
              </li>
            </ToolTip>
            <ToolTip content="Close">
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
            <Button size="XS" onClick={handleStop} styleType="danger">
              Stop
            </Button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Radio
              label="Copy classroom content to group."
              checked={checked}
              onClick={toggleCheck}
            />
            <PopoverWithTooltip
              ref={panelRef}
              toolTipProps={{ placement: 'top', content: 'Move to' }}
              popoverProps={{
                showArrow: true,
                overlayOffset: 8,
                placement: 'top',
                content: <CreatePanel onClose={handleCreateClose} />,
                overlayClassName: 'fcr-breakout-room__create__overlay',
                onVisibleChange: setCreateVisible,
              }}>
              <Button size="XS" type="secondary">
                Recreate
                <SvgImg
                  type={SvgIconEnum.FCR_DROPDOWN}
                  style={{
                    transform: `rotate(${createVisible ? '0deg' : '180deg'})`,
                    transition: '.3s all',
                  }}
                />
              </Button>
            </PopoverWithTooltip>
            <Button size="XS" onClick={handleStart}>
              Start
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
      minimizeProperties: {
        minimizedIcon: SvgIconEnum.FCR_V2_BREAKROOM,
        minimizedTooltip: 'Breakout room',
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
    <div className="fcr-breakout-room__widget-dialog">
      <div className="fcr-breakout-room__widget-dialog-top fcr-breakout-room__drag-handle">
        <div className="fcr-breakout-room__widget-header">
          {/* title */}
          <span className="fcr-breakout-room__widget-title">Breakout Room</span>
          {/* actions */}
          <div className="fcr-breakout-room__widget-actions fcr-breakout-room__drag-cancel">
            <ul>
              <ToolTip content="Minimization">
                <li>
                  <SvgImg
                    type={SvgIconEnum.FCR_WINDOWPAGE_SMALLER}
                    size={14}
                    onClick={handleMinimize}
                  />
                </li>
              </ToolTip>
              <ToolTip content="Close">
                <li>
                  <SvgImg type={SvgIconEnum.FCR_CLOSE} size={14} onClick={handleClose} />
                </li>
              </ToolTip>
            </ul>
          </div>
        </div>
        <div className="fcr-breakout-room__widget-create-number">
          <span>Create</span>
          <InputNumber size="small" min={1} onChange={handleChangeGroupNum} value={groupNum} />
          <span>breakout rooms</span>
        </div>
      </div>
      <div className="fcr-breakout-room__widget-dialog-bottom">
        <Radio label="Assign automatically" checked={type === 1} onChange={handleChangeType(1)} />
        {/* divider */}
        <div className="fcr-breakout-room__widget-dialog-divider" />
        <Radio label="Assign manually" checked={type === 2} onChange={handleChangeType(2)} />
        {type === 2 ? (
          <p className="fcr-breakout-room__widget-dialog-info">
            To be assigned {numberToBeAssigned} persons
            {numberToBeAssigned > 0 && `, per group ${perGroup}-${perGroup + 1} persons`}
          </p>
        ) : (
          <p className="fcr-breakout-room__widget-dialog-info" />
        )}
        <div className="fcr-breakout-room__widget-dialog-buttons">
          <Button size="XS" onClick={handleCreate}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
});
