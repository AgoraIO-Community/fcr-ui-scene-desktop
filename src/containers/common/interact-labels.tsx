import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import './index.css';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { EduRoleTypeEnum } from 'agora-edu-core';
import { Layout } from '@onlineclass/uistores/type';
import { usePinStream } from '@onlineclass/utils/hooks/use-pin-stream';
import { ToolTip } from '@components/tooltip';
const interactLabelGroupSizeMap = {
  'status-bar': 'normal',
  'list-view': 'small',
  'main-view': 'large',
};
export const InteractLabelGroup = observer(
  ({
    userUuid = '',
    placement = 'list-view',
  }: {
    userUuid?: string;
    placement?: 'status-bar' | 'list-view' | 'main-view';
  }) => {
    const {
      classroomStore: {
        userStore: { rewards, users },
      },
      streamUIStore: { isUserGranted, pinnedStream, pinDisabled },
    } = useStore();
    const currentUser = users.get(userUuid);
    const reward = rewards.get(userUuid);
    const isGranted = isUserGranted(userUuid);
    const showReward = currentUser?.userRole === EduRoleTypeEnum.student;
    const showPinned =
      pinnedStream?.fromUser.userUuid === userUuid && placement === 'main-view' && !pinDisabled;
    const { removePin } = usePinStream();
    const rewardItem = (
      <div
        className={classnames('fcr-stream-window-student-interact-item', {
          'fcr-bg-brand-6': placement === 'status-bar',
          'fcr-bg-2': placement !== 'status-bar',
        })}>
        <SvgImg type={SvgIconEnum.FCR_REWARD}></SvgImg>
        <span>{reward || 0}</span>
      </div>
    );
    const rewardItemRenderer =
      placement === 'status-bar' ? <ToolTip content="Your ward">{rewardItem}</ToolTip> : rewardItem;
    return (
      <div
        className={classnames(
          'fcr-stream-window-student-interact-group',
          `fcr-stream-window-student-interact-group-${interactLabelGroupSizeMap[placement]}`,
        )}>
        {isGranted && (
          <div className="fcr-stream-window-student-interact-item fcr-bg-yellowwarm">
            <SvgImg type={SvgIconEnum.FCR_HOST}></SvgImg>
          </div>
        )}
        {showReward && rewardItemRenderer}

        {showPinned && (
          <div
            onClick={removePin}
            className="fcr-stream-window-student-interact-item fcr-stream-window-student-interact-item-remove-pin fcr-bg-2">
            <SvgImg type={SvgIconEnum.FCR_REMOVE_PIN}></SvgImg>
            Remove Pin
          </div>
        )}

        {/* <div className="fcr-stream-window-student-interact-item  fcr-bg-brand-6">
          <SvgImg
            type={SvgIconEnum.FCR_STUDENT_RASIEHAND}
            ></SvgImg>
        </div> */}
      </div>
    );
  },
);
