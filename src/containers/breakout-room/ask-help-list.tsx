import { Button } from '@components/button';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { FC } from 'react';

type AskHelpRequest = {
  groupUuid: string;
  groupName: string;
};

export const AskHelpList = observer(() => {
  const {
    breakoutUIStore: { helpRequestList },
  } = useStore();

  return (
    <div className="fcr-breakout-room__ask-for-help">
      {helpRequestList.map((item, index) => (
        <AskForHelpListItem key={index.toString()} item={item} />
      ))}
    </div>
  );
});

export const AskForHelpListItem: FC<{ item: AskHelpRequest }> = ({ item }) => {
  const {
    breakoutUIStore: { acceptInvite, rejectInvite },
  } = useStore();

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
        <SvgImg type={SvgIconEnum.FCR_STUDENT_RASIEHAND} />
      </div>
      <div className="fcr-breakout-room__ask-for-help__list-item-label">
        <p>
          From{' '}
          <span className="fcr-breakout-room__ask-for-help__list-item-emph-1">
            {item.groupName}
          </span>
        </p>
        <p className="fcr-breakout-room__ask-for-help__list-item-emph-2">Ask for Help</p>
      </div>
      <div className="fcr-breakout-room__askhelp-buttons">
        <Button size="XS" styleType="gray" onClick={handleCancel}>
          Not now
        </Button>
        <Button size="XS" onClick={handleOk}>
          Go to
        </Button>
      </div>
    </div>
  );
};
