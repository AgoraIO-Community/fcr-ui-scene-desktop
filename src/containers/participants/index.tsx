import { createContext, FC, PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@components/input';
import { Table } from '@components/table';

import './index.css';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { observer } from 'mobx-react-lite';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { ToolTip } from '@components/tooltip';
import { EduStreamUI } from '@onlineclass/utils/stream/struct';
import { DialogToolTip } from '@components/tooltip/dialog';
import { Button } from '@components/button';
import { Radio, RadioGroup } from '@components/radio';
import { EduClassroomConfig, EduRoleTypeEnum, EduUserStruct } from 'agora-edu-core';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import classnames from 'classnames';
import { ToastApiFactory } from '@components/toast';
import { useDeviceSwitch } from '@onlineclass/utils/hooks/use-device-switch';
import { AgoraRteMediaPublishState } from 'agora-rte-sdk';
import {
  ParticipantsOrderDirection,
  ParticipantsTableSortKeysEnum,
} from '@onlineclass/uistores/participants';
import { useAuthorization } from '@onlineclass/utils/hooks/use-authorization';
import {
  CustomMessageCommandType,
  CustomMessageDeviceState,
  CustomMessageDeviceType,
} from '@onlineclass/uistores/type';
import { useI18n } from 'agora-common-libs';

interface ParticipantsContext {
  toastApi: ToastApiFactory | null;
}
const ParticipantsContext = createContext<ParticipantsContext | null>(null);

const colors = themeVal('colors');

export const Participants = observer(() => {
  const transI18n = useI18n();
  const {
    participantsUIStore: {
      participantTableList,
      participantStudentList,
      searchKey,
      setSearchKey,
      setParticipantsDialogVisible,
    },
    statusBarUIStore: { isHost },
    actionBarUIStore: { lowerAllHands },
    classroomStore: {
      streamStore: { updateRemotePublishStateBatch },
      roomStore: { sendCustomChannelMessage },
    },
  } = useStore();
  const { hostColumns, studentColumns } = useParticipantsColumn();

  const tableColumns = isHost ? hostColumns : studentColumns;
  const tableWidth = useMemo(() => {
    return tableColumns.reduce((prev, columns) => {
      return prev + columns.width;
    }, 0);
  }, [tableColumns]);

  const participantsContainerRef = useRef<HTMLDivElement | null>(null);
  const toastApiRef = useRef<ToastApiFactory | null>(null);
  useEffect(() => {
    if (participantsContainerRef.current) {
      toastApiRef.current = new ToastApiFactory({
        toastPlacement: 'bottom',
        renderContainer: participantsContainerRef.current,
      });
    }
  }, []);
  const handleMuteAll = async () => {
    await updateRemotePublishStateBatch(
      participantStudentList.map(({ user, stream }) => {
        return {
          userUuid: user.userUuid,
          streamUuid: stream?.stream.streamUuid || '',
          audioState: AgoraRteMediaPublishState.Unpublished,
        };
      }),
    );
    sendCustomChannelMessage({
      cmd: CustomMessageCommandType.deviceSwitchBatch,
      data: {
        deviceType: CustomMessageDeviceType.mic,
        deviceState: CustomMessageDeviceState.close, // 0.close, 1.open
      },
    });
    toastApiRef.current?.open({
      toastProps: {
        type: 'normal',
        content: transI18n('fcr_participants_tips_mute_all'),
        size: 'small',
      },
    });
  };
  const handleUnMuteAll = async () => {
    await updateRemotePublishStateBatch(
      participantStudentList.map(({ user, stream }) => {
        return {
          userUuid: user.userUuid,
          streamUuid: stream?.stream.streamUuid || '',
          audioState: AgoraRteMediaPublishState.Published,
        };
      }),
    );
    sendCustomChannelMessage({
      cmd: CustomMessageCommandType.deviceSwitchBatch,
      data: {
        deviceType: CustomMessageDeviceType.mic,
        deviceState: CustomMessageDeviceState.open, //
      },
    });
    toastApiRef.current?.open({
      toastProps: {
        type: 'normal',
        content: transI18n('fcr_participants_tips_unmute_all'),
        size: 'small',
      },
    });
  };

  return (
    <ParticipantsContext.Provider value={{ toastApi: toastApiRef.current }}>
      <div
        ref={participantsContainerRef}
        style={{ width: tableWidth }}
        className="fcr-participants-container">
        <div className="fcr-participants-header">
          <div className="fcr-participants-title">
            {transI18n('fcr_participants_label_participants')}
          </div>
          <div className="fcr-participants-count">
            ({transI18n('fcr_role_student')} {participantStudentList.length})
          </div>
          <div className="fcr-participants-search">
            <Input
              size="small"
              value={searchKey}
              onChange={setSearchKey}
              iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
              placeholder={transI18n('fcr_participants_label_search')}
            />
          </div>
          <div
            className="fcr-participants-header-close"
            onClick={() => setParticipantsDialogVisible(false)}>
            <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16}></SvgImg>
          </div>
        </div>
        <Table
          scroll={{
            y: 400,
          }}
          columns={tableColumns as any}
          data={participantTableList}
          rowKey={(record) => record.user.userUuid}></Table>

        {isHost && (
          <div className="fcr-participants-footer">
            <ToolTip placement="top" content={transI18n('fcr_participants_tips_lower_all_hand')}>
              <Button
                disabled={participantStudentList.length <= 0}
                onClick={lowerAllHands}
                preIcon={SvgIconEnum.FCR_LOWER_HAND}
                size="XS"
                type="secondary">
                {transI18n('fcr_participants_tips_lower_all_hand')}
              </Button>
            </ToolTip>
            <ToolTip placement="top" content={transI18n('fcr_participants_tips_mute_all')}>
              <Button
                disabled={participantStudentList.length <= 0}
                onClick={handleMuteAll}
                preIcon={SvgIconEnum.FCR_ALL_MUTE}
                size="XS"
                type="secondary">
                {transI18n('fcr_participants_tips_mute_all')}
              </Button>
            </ToolTip>
            <ToolTip placement="top" content={transI18n('fcr_participants_tips_unmute_all')}>
              <Button
                disabled={participantStudentList.length <= 0}
                onClick={handleUnMuteAll}
                preIcon={SvgIconEnum.FCR_ALL_UNMUTE}
                size="XS"
                type="secondary">
                {transI18n('fcr_participants_tips_unmute_all')}
              </Button>
            </ToolTip>
          </div>
        )}
      </div>
    </ParticipantsContext.Provider>
  );
});
const TableName = ({ name }: { name: string }) => {
  return (
    <div className="fcr-participants-table-name">
      {/* <Avatar size={30} textSize={14} nickName={name}></Avatar> */}
      <div className="fcr-participants-table-name-text">{name}</div>
    </div>
  );
};
const TableAuth = observer(({ userUuid, role }: { userUuid: string; role: EduRoleTypeEnum }) => {
  const transI18n = useI18n();
  const {
    participantsUIStore: { isHostByUserRole, tableIconSize },
    presentationUIStore: { isBoardWidgetActive },
  } = useStore();
  const { tooltip, toggleAuthorization, granted } = useAuthorization(userUuid);
  const isHostLocal = EduClassroomConfig.shared.sessionInfo.role === EduRoleTypeEnum.teacher;
  const isHost = isHostByUserRole(role);
  const tooltipContent = isHost ? transI18n('fcr_role_teacher') : tooltip;
  const disabled = !isHostLocal || !isBoardWidgetActive;

  return (
    <div className="fcr-participants-table-auth">
      {isHost ? (
        transI18n('fcr_role_teacher')
      ) : isHostLocal || granted ? (
        <TableIconWrapper
          tooltip={tooltipContent}
          disabled={disabled}
          onClick={toggleAuthorization}>
          <SvgImg
            onClick={() => disabled && toggleAuthorization()}
            type={SvgIconEnum.FCR_HOST}
            colors={{ iconPrimary: granted ? colors['yellow'] : colors['icon-1'] }}
            size={tableIconSize}></SvgImg>
        </TableIconWrapper>
      ) : (
        '-'
      )}
    </div>
  );
});
const TableIconWrapper: FC<
  PropsWithChildren<{ onClick?: () => void; disabled?: boolean; tooltip?: string }>
> = (props) => {
  const { children, disabled = false, tooltip, ...others } = props;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const handleVisibleChanged = (visible: boolean) => {
    if (!tooltip || disabled) {
      return setTooltipVisible(false);
    }
    setTooltipVisible(visible);
  };
  return (
    <ToolTip
      visible={tooltipVisible}
      onVisibleChange={handleVisibleChanged}
      placement="bottom"
      content={tooltip}>
      <div
        className={classnames('fcr-participants-table-cell-wrap', {
          'fcr-participants-table-cell-wrap-disabled': disabled,
        })}>
        <div
          {...others}
          onClick={() => !disabled && props.onClick?.()}
          className={classnames('fcr-participants-table-icon-wrap', {
            'fcr-participants-table-icon-wrap-disable': disabled,
          })}>
          <div>{children}</div>
        </div>
      </div>
    </ToolTip>
  );
};

const TableRaiseHand = observer(({ stream }: { stream?: EduStreamUI }) => {
  const transI18n = useI18n();
  const {
    actionBarUIStore: { handsUpMap, lowerHand },
    statusBarUIStore: { isHost },
    participantsUIStore: { tableIconSize },
  } = useStore();
  const userUuid = stream?.fromUser.userUuid || '';
  const isHandsUp = handsUpMap.has(userUuid);

  return isHandsUp ? (
    <TableIconWrapper
      tooltip={transI18n('fcr_participants_tips_lower_hand')}
      disabled={!isHost}
      onClick={() => lowerHand(userUuid)}>
      <SvgImg type={SvgIconEnum.FCR_STUDENT_RASIEHAND} size={tableIconSize}></SvgImg>
    </TableIconWrapper>
  ) : (
    <>{'-'}</>
  );
});
const TableCamera = observer(({ stream }: { stream?: EduStreamUI }) => {
  const {
    statusBarUIStore: { isHost },
    classroomStore: {
      userStore: { localUser },
    },
    participantsUIStore: { tableIconSize },
  } = useStore();
  const isSelf = stream?.fromUser.userUuid === localUser?.userUuid;
  const actionDisabled = !isHost && !isSelf;
  const {
    cameraTooltip,
    handleCameraClick,
    cameraIcon: icon,
    cameraIconColor: iconColor,
  } = useDeviceSwitch({ stream, isLocal: !!stream?.isLocal });

  return (
    <TableIconWrapper tooltip={cameraTooltip} disabled={actionDisabled} onClick={handleCameraClick}>
      <SvgImg colors={iconColor} type={icon} size={tableIconSize}></SvgImg>
    </TableIconWrapper>
  );
});
const TableMicrophone = observer(({ stream }: { stream?: EduStreamUI }) => {
  const {
    micTooltip,
    handleMicrophoneClick,
    micIcon: icon,
    micIconColor: iconColor,
  } = useDeviceSwitch({ stream, isLocal: !!stream?.isLocal });
  const {
    statusBarUIStore: { isHost },
    classroomStore: {
      userStore: { localUser },
    },
    participantsUIStore: { tableIconSize },
  } = useStore();
  const isSelf = stream?.fromUser.userUuid === localUser?.userUuid;
  const actionDisabled = !isHost && !isSelf;

  return (
    <TableIconWrapper
      tooltip={micTooltip}
      disabled={actionDisabled}
      onClick={handleMicrophoneClick}>
      <SvgImg colors={iconColor} type={icon} size={tableIconSize}></SvgImg>
    </TableIconWrapper>
  );
});
const TableReward = observer(({ userUuid, role }: { userUuid: string; role: EduRoleTypeEnum }) => {
  const transI18n = useI18n();
  const {
    participantsUIStore: { sendReward, rewardsByUserUuid, isHostByUserRole, tableIconSize },
  } = useStore();
  const rewards = rewardsByUserUuid(userUuid);
  const {
    statusBarUIStore: { isHost },
  } = useStore();
  const actionDisabled = !isHost;
  const isStreamFromHost = isHostByUserRole(role);

  return isStreamFromHost ? (
    <>{'-'}</>
  ) : (
    <TableIconWrapper
      tooltip={transI18n('fcr_participants_tips_reward')}
      disabled={actionDisabled}
      onClick={() => sendReward(userUuid)}>
      <>
        {rewards > 0 && <div className="fcr-participants-table-rewards">{rewards}</div>}
        <SvgImg type={SvgIconEnum.FCR_REWARD} size={tableIconSize}></SvgImg>
      </>
    </TableIconWrapper>
  );
});
const TableRemove = observer(({ userUuid, role }: { userUuid: string; role: EduRoleTypeEnum }) => {
  const transI18n = useI18n();
  const [dialogVisible, setDialogVisible] = useState(false);
  const {
    participantsUIStore: { isHostByUserRole, tableIconSize },
  } = useStore();
  const isStreamFromHost = isHostByUserRole(role);

  return isStreamFromHost ? (
    <>{'-'}</>
  ) : (
    <DialogToolTip
      overlayOffset={0}
      visible={dialogVisible}
      onVisibleChange={setDialogVisible}
      onClose={() => setDialogVisible(false)}
      content={
        <RemoveDialogContent
          userUuid={userUuid}
          onClose={() => setDialogVisible(false)}></RemoveDialogContent>
      }
      trigger="click"
      placement="right">
      <TableIconWrapper tooltip={transI18n('fcr_participants_tips_Remove')}>
        <SvgImg type={SvgIconEnum.FCR_ONELEAVE} size={tableIconSize}></SvgImg>
      </TableIconWrapper>
    </DialogToolTip>
  );
});
const RemoveDialogContent = observer(
  ({ onClose, userUuid }: { onClose?: () => void; userUuid: string }) => {
    const transI18n = useI18n();

    const {
      classroomStore: {
        userStore: { kickOutOnceOrBan },
      },
    } = useStore();
    const [kickOutType, setKickOutType] = useState<'once' | 'ban'>('once');
    const handleRemove = async () => {
      await kickOutOnceOrBan(userUuid, kickOutType === 'ban');
    };
    return (
      <div className="fcr-participants-table-remove-dialog">
        <div className="fcr-participants-table-remove-title">
          {transI18n('fcr_user_tips_kick_out')}{' '}
        </div>
        <div className="fcr-participants-table-remove-options">
          <RadioGroup<'once' | 'ban'>
            value={kickOutType}
            onChange={(value) => value && setKickOutType(value)}>
            <Radio value="once" label={transI18n('fcr_user_tips_kick_out_once')}></Radio>
            <div className="fcr-participants-table-remove-options-divider"></div>
            <Radio value="ban" label={transI18n('fcr_user_tips_kick_out_forever')}></Radio>
          </RadioGroup>
        </div>
        <div className="fcr-participants-table-remove-btns">
          <Button onClick={onClose} shape="rounded" size="XS" styleType="gray">
            {transI18n('fcr_user_tips_button_cancel')}
          </Button>
          <Button
            onClick={() => {
              handleRemove();
              onClose?.();
            }}
            shape="rounded"
            size="XS">
            {transI18n('fcr_participants_label_Remove')}
          </Button>
        </div>
      </div>
    );
  },
);

type UserTableItem = {
  stream: EduStreamUI;
  user: EduUserStruct;
};
const SortedColumnsHeader = observer(({ sortKey, label }: { sortKey: string; label: string }) => {
  const {
    participantsUIStore: { orderKey, orderDirection, setOrderDirection, setOrderKey },
  } = useStore();
  const [hover, setHover] = useState(false);
  const active = orderKey === sortKey;
  const direction: ParticipantsOrderDirection = active ? orderDirection : 'asc';
  const handleSortClick = () => {
    if (active) {
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderKey(sortKey);
      setOrderDirection('asc');
    }
  };
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fcr-participants-table-sorted-header"
      onClick={handleSortClick}>
      {label}
      <SvgImg
        className={classnames('fcr-participants-table-sorted-header-icon', {
          'fcr-participants-table-sorted-header-icon-desc': direction === 'desc',
          'fcr-participants-table-sorted-header-icon-active': active,
        })}
        colors={hover ? { iconPrimary: colors['brand']['6'] } : {}}
        type={SvgIconEnum.FCR_UPORDER}
        size={14}></SvgImg>
    </div>
  );
});
const useParticipantsColumn = () => {
  const transI18n = useI18n();
  const hostColumns = [
    {
      title: (
        <div className="fcr-participants-table-name-label">
          {transI18n('fcr_participants_label_name')}
        </div>
      ),
      render: (_: unknown, item: UserTableItem) => {
        return <TableName name={item.user.userName}></TableName>;
      },
      width: 85,
      align: 'left',
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_auth')}
          sortKey={ParticipantsTableSortKeysEnum.Auth}
        />
      ),
      width: 50,
      render: (_: unknown, item: UserTableItem) => {
        return <TableAuth role={item.user.userRole} userUuid={item.user.userUuid}></TableAuth>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_raise_hand')}
          sortKey={ParticipantsTableSortKeysEnum.RaiseHand}
        />
      ),
      width: 88,
      render: (_: unknown, item: UserTableItem) => {
        return <TableRaiseHand stream={item.stream}></TableRaiseHand>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_camera')}
          sortKey={ParticipantsTableSortKeysEnum.Camera}
        />
      ),
      width: 68,
      render: (_: unknown, item: UserTableItem) => {
        return <TableCamera stream={item.stream}></TableCamera>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_microphne')}
          sortKey={ParticipantsTableSortKeysEnum.Microphone}
        />
      ),
      width: 92,
      render: (_: unknown, item: UserTableItem) => {
        return <TableMicrophone stream={item.stream}></TableMicrophone>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_reward')}
          sortKey={ParticipantsTableSortKeysEnum.Reward}
        />
      ),
      width: 66,
      render: (_: unknown, item: UserTableItem) => {
        return <TableReward role={item.user.userRole} userUuid={item.user.userUuid}></TableReward>;
      },
    },
    {
      title: transI18n('fcr_participants_label_Remove'),
      width: 67,
      render: (_: unknown, item: UserTableItem) => {
        return <TableRemove role={item.user.userRole} userUuid={item.user.userUuid}></TableRemove>;
      },
    },
  ];
  const studentColumns = [
    {
      title: (
        <div className="fcr-participants-table-name-label">
          {transI18n('fcr_participants_label_name')}
        </div>
      ),
      render: (_: unknown, item: UserTableItem) => {
        return <TableName name={item.user.userName}></TableName>;
      },
      align: 'left',
      width: 85,
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_auth')}
          sortKey={ParticipantsTableSortKeysEnum.Auth}
        />
      ),
      width: 50,
      render: (_: unknown, item: UserTableItem) => {
        return <TableAuth role={item.user.userRole} userUuid={item.user.userUuid}></TableAuth>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_raise_hand')}
          sortKey={ParticipantsTableSortKeysEnum.RaiseHand}
        />
      ),
      width: 88,
      render: (_: unknown, item: UserTableItem) => {
        return <TableRaiseHand stream={item.stream}></TableRaiseHand>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_camera')}
          sortKey={ParticipantsTableSortKeysEnum.Camera}
        />
      ),
      width: 68,
      render: (_: unknown, item: UserTableItem) => {
        return <TableCamera stream={item.stream}></TableCamera>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_microphne')}
          sortKey={ParticipantsTableSortKeysEnum.Microphone}
        />
      ),
      width: 92,
      render: (_: unknown, item: UserTableItem) => {
        return <TableMicrophone stream={item.stream}></TableMicrophone>;
      },
    },
    {
      title: (
        <SortedColumnsHeader
          label={transI18n('fcr_participants_label_reward')}
          sortKey={ParticipantsTableSortKeysEnum.Reward}
        />
      ),
      width: 78,
      render: (_: unknown, item: UserTableItem) => {
        return <TableReward role={item.user.userRole} userUuid={item.user.userUuid}></TableReward>;
      },
    },
  ];
  return {
    hostColumns,
    studentColumns,
  };
};
