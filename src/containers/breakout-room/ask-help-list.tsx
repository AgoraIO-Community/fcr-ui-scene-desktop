import { Button } from '@components/button';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { transI18n, useI18n } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { FC, useEffect, useState } from 'react';
import { notification } from 'antd';

type AskHelpRequest = {
  groupUuid: string;
  groupName: string;
};

export const AskHelpList = observer(() => {
  const {
    layoutUIStore: { addDialog },
    breakoutUIStore: {
      isAttendDiscussionConfig,
      studentInvites,
      inviteGroups,
      changeInviteGroup,
      changeReduceInviteGroup,
      inviteStudents,
      setStudentInvitesEmpty,
      groupState,
      acceptInvite,
      rejectInvite,
      addToast,
      cancelGroupUuid,
      setCancelGroupUuid,
    },
  } = useStore();
  const [api, contextHolder] = notification.useNotification({
    top: 80,
  });
  if (cancelGroupUuid) {
    api.destroy(cancelGroupUuid);
    setCancelGroupUuid('');
  }
  const handleOk = async (item: AskHelpRequest) => {
    if (isAttendDiscussionConfig?.groupId) {
      addDialog('confirm', {
        title: transI18n('fcr_group_join_group_title'),
        content: transI18n('fcr_group_attend_discussion_join_confirm'),
        onOk: async () => {
          await acceptInvite(item.groupUuid);
        },
        okButtonProps: {
          styleType: 'danger',
        },
      });
    } else {
      await acceptInvite(item.groupUuid);
    }
  };
  const handleCancel = (item: AskHelpRequest) => {
    rejectInvite(item.groupUuid);
    addToast({
      text: transI18n('fcr_group_reject_help', {
        reason1: item.groupName,
      }),
    });
  };
  const openNotification = (list: AskHelpRequest) => {
    api.open({
      key: list.groupUuid,
      message: (
        <div className="fcr-breakout-room__ask-for-help__list-item-label">
          <span className="fcr-breakout-room__ask-for-help__list-item-name">{list.groupName}</span>
          <span>&nbsp;{transI18n('fcr_group_ask_for_help')}</span>
        </div>
      ),
      duration: null,
      description: '',
      placement: 'topLeft',
      onClose: () => {
        setCancelGroupUuid(list.groupUuid);
        const index = inviteGroups.findIndex((v) => v.groupUuid === list.groupUuid);
        changeReduceInviteGroup(inviteGroups, true, index);
      },
      closeIcon: (
        <div className="fcr-breakout-room__ask-for-help__list-item-close">
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={9.6} />
        </div>
      ),
      icon: (
        <div className="fcr-breakout-room__ask-for-help__list-item-icon">
          <SvgImg type={SvgIconEnum.FCR_INVITE} size={40} />
        </div>
      ),
      btn: (
        <div className="fcr-breakout-room__askhelp-buttons">
          <span
            className="fcr-breakout-room__create-panel-button"
            onClick={() => handleCancel(list)}>
            {transI18n('fcr_group_dialog_reject')}
          </span>
          <span
            className="fcr-breakout-room__create-panel-button active"
            onClick={() => handleOk(list)}>
            {transI18n('fcr_group_dialog_join')}
          </span>
        </div>
      ),
      className: 'fcr-breakout-room__ask-for-help__list-item',
    });
  };
  useEffect(() => {
    if (!groupState && studentInvites.length) {
      for (let i = 0; i < studentInvites.length; i++) {
        api.destroy(studentInvites[i].groupUuid);
      }
      setStudentInvitesEmpty();
    }
  }, [groupState, setStudentInvitesEmpty, studentInvites.length]);

  useEffect(() => {
    if (inviteGroups.length && groupState) {
      const lists = studentInvites.filter((item: { isInvite: boolean }) => item.isInvite);
      const index = inviteGroups.findIndex(
        (v) => lists.length > 0 && (v.groupUuid === lists[lists.length - 1]?.groupUuid),
      );
      console.log('useEffectuseEffect', inviteGroups, lists);
      if (lists.length && index > -1 && inviteGroups[index] && !inviteGroups[index].isShow) {
        console.log('inviteGroups[index]', inviteGroups[index]);
        openNotification(lists[lists.length - 1]);
        changeInviteGroup(inviteGroups, index, true);
      }
    }
  }, [studentInvites, groupState, inviteGroups, changeInviteGroup]);

  return (
    <>{contextHolder}</>
    // <div className="fcr-breakout-room__ask-for-help fcr-breakout-room--scroll">
    //   {helpRequestList.map((item, index) => (
    //     <AskForHelpListItem key={index.toString()} item={item} />
    //   ))}
    // </div>
  );
});

export const AskForHelpListItem: FC<{ item: AskHelpRequest }> = ({ item }) => {
  const {
    breakoutUIStore: { acceptInvite, rejectInvite },
  } = useStore();
  const transI18n = useI18n();

  const handleOk = () => {
    acceptInvite(item.groupUuid);
  };
  const handleCancel = () => {
    rejectInvite(item.groupUuid);
  };

  return (
    <div className="fcr-breakout-room__ask-for-help__list-item">
      <div className="fcr-breakout-room__ask-for-help__list-item-header">
        {/* top right close */}
        <div className="fcr-breakout-room__ask-for-help__list-item-close" onClick={handleCancel}>
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={9.6} />
        </div>
      </div>
      <div className="fcr-breakout-room__ask-for-help__list-item-icon">
        <SvgImg type={SvgIconEnum.FCR_STUDENT_RASIEHAND} size={32} />
      </div>
      <div className="fcr-breakout-room__ask-for-help__list-item-label">
        <p>
          {transI18n('fcr_group_from')}{' '}
          <span className="fcr-breakout-room__ask-for-help__list-item-emph-1">
            {item.groupName}
          </span>
        </p>
        <p className="fcr-breakout-room__ask-for-help__list-item-emph-2">
          {transI18n('fcr_group_ask_for_help')}
        </p>
      </div>
      <div className="fcr-breakout-room__askhelp-buttons">
        <Button size="XS" styleType="gray" onClick={handleCancel}>
          {transI18n('fcr_group_not_now')}
        </Button>
        <Button size="XS" onClick={handleOk}>
          {transI18n('fcr_group_go_to')}
        </Button>
      </div>
    </div>
  );
};
