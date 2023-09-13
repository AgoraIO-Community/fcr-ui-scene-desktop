import { Button } from '@components/button';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { TextArea } from '@components/textarea';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';
import { FC, useState } from 'react';

export const BroadcastMessagePanel: FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    breakoutUIStore: { broadcastMessage },
  } = useStore();
  const [inputVal, setInputVal] = useState('');
  const transI18n = useI18n();
  const handleSubmit = () => {
    broadcastMessage(inputVal);
    setInputVal('');
    onClose();
  };

  return (
    <div className="fcr-breakout-room__broadcast">
      <div className="fcr-breakout-room__broadcast-header">
        <span>{transI18n('fcr_group_label_broadcast_message')}</span>
        {/* top right close */}
        <div className="fcr-breakout-room__broadcast-close" onClick={onClose}>
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16} />
        </div>
      </div>
      <div className="fcr-breakout-room__broadcast-content">
        <TextArea
          placeholder={transI18n('fcr_group_label_broadcast_message_placeholder')}
          value={inputVal}
          onChange={setInputVal}
          maxCount={200}
        />
      </div>
      <div className="fcr-breakout-room__broadcast-buttons">
        <Button size="XS" styleType="gray" onClick={onClose}>
          {transI18n('fcr_group_label_broadcast_cancel')}
        </Button>
        <Button size="XS" onClick={handleSubmit}>
          {transI18n('fcr_group_label_broadcast_submit')}
        </Button>
      </div>
    </div>
  );
};
