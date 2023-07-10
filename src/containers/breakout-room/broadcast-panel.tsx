import { Button } from '@components/button';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { TextArea } from '@components/textarea';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { FC, useState } from 'react';

export const BroadcastMessagePanel: FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    breakoutUIStore: { broadcastMessage },
  } = useStore();
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = () => {
    broadcastMessage(inputVal);
    setInputVal('');
    onClose();
  };

  return (
    <div className="fcr-breakout-room__broadcast">
      <div className="fcr-breakout-room__broadcast-header">
        <span>Send Message to all</span>
        {/* top right close */}
        <div className="fcr-breakout-room__broadcast-close" onClick={onClose}>
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={16} />
        </div>
      </div>
      <div className="fcr-breakout-room__broadcast-content">
        <TextArea
          placeholder="Please input ..."
          value={inputVal}
          onChange={setInputVal}
          maxCount={200}
        />
      </div>
      <div className="fcr-breakout-room__broadcast-buttons">
        <Button size="XS" styleType="gray" onClick={onClose}>
          Cancel
        </Button>
        <Button size="XS" onClick={handleSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
};
