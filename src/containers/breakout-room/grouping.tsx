import { Avatar } from '@components/avatar';
import { Button } from '@components/button';
import { Input } from '@components/input';
import { PopoverWithTooltip } from '@components/popover';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import classNames from 'classnames';
import React, { useState, FC } from 'react';
import { GroupPanel } from './group-panel';
import { SearchPanel } from './search-panel';
import { DndProvider, useDrop, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { observer } from 'mobx-react';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';

type GroupItem = {
  id: string;
  name: string;
  tag?: string;
};

enum DraggableTypes {
  NameCard = 'name-card',
}

export const BreakoutRoomGrouping = observer(() => {
  const {
    breakoutUIStore: { addGroup, ungroupedCount, numberToBeAssigned, groupState },
  } = useStore();
  const transI18n = useI18n();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fcr-breakout-room__grouping">
        {/* column header */}
        <div className="fcr-breakout-room__grouping-column-header">
          <div className="fcr-breakout-room__grouping-column--ungroupped">
            <span>{transI18n('fcr_group_ungrouped')}</span>&nbsp;({ungroupedCount})
          </div>
          <div className="fcr-breakout-room__grouping-column--grouped">
            <div>
              <span>{transI18n('fcr_group_grouped')}</span>&nbsp;(
              {numberToBeAssigned - ungroupedCount})
            </div>
            {!groupState && (
              <div>
                <Button
                  size="XXS"
                  preIcon={SvgIconEnum.FCR_V2_PHONE_MORE1}
                  type={'secondary'}
                  onClick={addGroup}>
                  {transI18n('fcr_group_button_add_room')}
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* content */}
        <div className="fcr-breakout-room__grouping-column-content">
          {/* ungrouped member list */}
          <div className="fcr-breakout-room__grouping-column--ungroupped fcr-breakout-room--scroll">
            <UngroupedList />
          </div>
          {/* grouped member list */}
          <div className="fcr-breakout-room__grouping-column--grouped fcr-breakout-room--scroll">
            <Groups />
          </div>
        </div>
      </div>
    </DndProvider>
  );
});

export const UngroupedList = observer(() => {
  const {
    breakoutUIStore: { ungroupedList, groupState },
  } = useStore();
  const [{ isOver }, drop] = useDrop({
    accept: DraggableTypes.NameCard,
    collect(monitor) {
      return { isOver: monitor.isOver() };
    },
    drop: (item: GroupItem) => {
      return {};
    },
  });

  const canDrop = !groupState;

  const ulCls = classNames(
    'fcr-breakout-room__grouping-ungrouped-list',
    'fcr-breakout-room__grouping__drop-container',
    {
      // 'fcr-breakout-room--drop-not-allowed': !!groupState,
      'fcr-breakout-room__grouping--dashed-border': canDrop && isOver,
    },
  );

  return (
    <ul ref={drop} className={ulCls}>
      {ungroupedList.map((item) => (
        <DraggableNameCard key={item.id} item={{ id: item.id, name: item.text }} />
      ))}
    </ul>
  );
});

export const Groups = observer(() => {
  const {
    breakoutUIStore: { groups },
  } = useStore();

  return (
    <React.Fragment>
      {groups.map(({ text, id, children }) => {
        const list = children.map(({ id, text }) => ({ id, name: text }));
        return <GroupedList key={id} list={list} groupName={text} groupId={id} />;
      })}
    </React.Fragment>
  );
});

export const GroupedList = observer(
  ({ groupId, groupName, list }: { groupId: string; groupName: string; list: GroupItem[] }) => {
    const {
      layoutUIStore: { addDialog },
      breakoutUIStore: {
        removeGroup,
        renameGroupName,
        setGroupUsers,
        groupState,
        joinSubRoom,
        helpRequestList,
      },
    } = useStore();
    const transI18n = useI18n();
    const [expanded, setExpanded] = useState(true);

    const [editing, setEditing] = useState(false);

    const [inputVal, setInputVal] = useState('');

    const [{ isOver }, drop] = useDrop({
      accept: DraggableTypes.NameCard,
      collect: (monitor) => {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
      drop: (item) => {
        return { groupId };
      },
    });

    const toggleExpand = () => {
      setExpanded(!expanded);
    };

    const handleRename = () => {
      setEditing(true);
      setInputVal(groupName);
    };

    const handleSubmit = () => {
      setEditing(false);
      setInputVal('');
      if (inputVal) {
        renameGroupName(groupId, inputVal);
      }
    };

    const handleDelete = () => {
      addDialog('confirm', {
        title: transI18n('fcr_group_delete_room_title'),
        content: transI18n('fcr_group_delete_room_confirm', { reason1: groupName }),
        onOk: () => {
          removeGroup(groupId);
        },
        okButtonProps: {
          styleType: 'danger',
        },
      });
    };

    const handleBlur = () => {
      handleSubmit();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSubmit();
      }
    };

    const handleUsersChange = (users: string[]) => {
      setGroupUsers(groupId, users);
    };

    const handleJoin = () => {
      joinSubRoom(groupId);
    };

    const haveRequest = helpRequestList.some((request) => {
      return request.groupUuid === groupId;
    });

    const ulCls = classNames('fcr-breakout-room__grouping-grouped-list', {
      'fcr-breakout-room__grouping-grouped-list--hidden': !expanded,
    });

    const containerCls = classNames('fcr-breakout-room__grouping__drop-container', {
      'fcr-breakout-room__grouping--dashed-border': isOver,
    });

    return (
      <React.Fragment>
        <div ref={drop} className={containerCls}>
          <div className="fcr-breakout-room__grouping-grouped-title">
            <SvgImg
              onClick={toggleExpand}
              type={SvgIconEnum.FCR_DROPDOWN}
              style={{ transform: `rotate(${expanded ? 0 : -90}deg)`, transition: '.3s all' }}
              size={20}
            />
            {haveRequest && (
              <ToolTip content={transI18n('fcr_group_tips_ask_help')}>
                <Button size="XXS" shape="rounded" type="secondary">
                  <SvgImg type={SvgIconEnum.FCR_STUDENT_RASIEHAND} />
                </Button>
              </ToolTip>
            )}
            {!editing ? (
              <React.Fragment>
                <span
                  className="fcr-breakout-room__grouping-grouped-group-name"
                  onClick={toggleExpand}>
                  {groupName} ({list.length})
                </span>
                <div className="fcr-breakout-room__grouping-grouped-group-actions">
                  <ToolTip content={transI18n('fcr_group_button_delete')}>
                    <Button onClick={handleDelete} size="XXS" shape="circle" styleType="danger">
                      <SvgImg type={SvgIconEnum.FCR_DELETE3} size={24} />
                    </Button>
                  </ToolTip>
                  <ToolTip content={transI18n('fcr_group_button_rename')}>
                    <Button size="XXS" shape="circle" type="secondary" onClick={handleRename}>
                      <SvgImg type={SvgIconEnum.FCR_RENAME} size={24} />
                    </Button>
                  </ToolTip>
                  {!groupState ? (
                    <PopoverWithTooltip
                      toolTipProps={{
                        placement: 'top',
                        content: transI18n('fcr_group_button_move_to'),
                      }}
                      popoverProps={{
                        overlayOffset: 20,
                        placement: 'rightTop',
                        content: <SearchPanel groupId={groupId} onChange={handleUsersChange} />,
                        overlayClassName: 'fcr-breakout-room__search__overlay',
                      }}>
                      <Button
                        size="XXS"
                        shape="circle"
                        type="secondary"
                        preIcon={SvgIconEnum.FCR_MOVETO}>
                        {transI18n('fcr_group_button_assign')}
                      </Button>
                    </PopoverWithTooltip>
                  ) : (
                    <Button
                      size="XXS"
                      shape="circle"
                      type="secondary"
                      preIcon={SvgIconEnum.FCR_MOVETO}
                      onClick={handleJoin}>
                      {transI18n('fcr_group_button_join')}
                    </Button>
                  )}
                </div>
              </React.Fragment>
            ) : (
              <Input
                maxLength={15}
                size="small"
                value={inputVal}
                onChange={setInputVal}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            )}
          </div>
          <ul className={ulCls}>
            {list.map((item) => {
              return <DraggableNameCard key={item.id} item={item} groupId={groupId} />;
            })}
          </ul>
        </div>
      </React.Fragment>
    );
  },
);

const DraggableNameCard: FC<{ item: GroupItem; groupId?: string }> = ({ item, groupId }) => {
  const {
    breakoutUIStore: { moveUserToGroup, groupDetails },
  } = useStore();

  const [{ isDragging }, drag] = useDrag({
    type: DraggableTypes.NameCard,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item,
    end: (item, monitor) => {
      const getGroupDetails = (groupId: string) => groupDetails.get(groupId);

      if (!monitor.didDrop()) {
        return;
      }
      const { groupId: toGroupId } = monitor.getDropResult() as { groupId: string };

      if (toGroupId === groupId) {
        return;
      }

      if (!groupId) {
        // move from ungrouped to a group
        const groupDetails = getGroupDetails(toGroupId);

        if (groupDetails) {
          // const groupUsers = groupDetails.users
          //   .concat([{ userUuid: item.id }])
          //   .map(({ userUuid }) => userUuid);
          // setGroupUsers(toGroupId, groupUsers);
          moveUserToGroup('', toGroupId, item.id);
        }
      } else if (!toGroupId) {
        // remove from current group
        const groupDetails = getGroupDetails(groupId);

        if (groupDetails) {
          // const groupUsers = groupDetails.users
          //   .filter(({ userUuid }) => userUuid !== item.id)
          //   .map(({ userUuid }) => userUuid);
          // setGroupUsers(groupId, groupUsers);
          moveUserToGroup(groupId, '', item.id);
        }
      } else {
        moveUserToGroup(groupId, toGroupId, item.id);
      }
    },
  });

  return (
    <li ref={drag} style={{ visibility: isDragging ? 'hidden' : 'visible' }}>
      <NamePlate nickname={item.name} tag={item.tag} userId={item.id} groupId={groupId} />
    </li>
  );
};

const NamePlate: FC<{ nickname: string; tag?: string; userId: string; groupId?: string }> = ({
  nickname,
  tag,
  userId,
  groupId,
}) => {
  const {
    breakoutUIStore: { moveUserToGroup },
  } = useStore();
  const transI18n = useI18n();

  const handleChange = (toGroupId: string) => {
    if (groupId) {
      moveUserToGroup(groupId, toGroupId, userId);
    }
  };

  return (
    <div className="fcr-breakout-room__grouping-name-plate">
      <SvgImg type={SvgIconEnum.FCR_MOVE} colors={{ iconPrimary: 'currentColor' }} />
      <Avatar size={24} textSize={12} nickName={nickname} />
      <div className="fcr-breakout-room__grouping-name-plate-name">
        {tag && <div className="fcr-breakout-room__grouping-name-plate-name-tag">{tag}</div>}
        <div>{nickname}</div>
      </div>
      {groupId && (
        <PopoverWithTooltip
          toolTipProps={{ placement: 'top', content: transI18n('fcr_group_button_move_to') }}
          popoverProps={{
            placement: 'rightTop',
            content: <GroupPanel groupId={groupId} onChange={handleChange} />,
            overlayClassName: 'fcr-breakout-room__group__overlay',
          }}>
          <Button size="XXS" shape="rounded" type="secondary">
            <SvgImg type={SvgIconEnum.FCR_MOVETO} size={24} />
          </Button>
        </PopoverWithTooltip>
      )}
    </div>
  );
};
