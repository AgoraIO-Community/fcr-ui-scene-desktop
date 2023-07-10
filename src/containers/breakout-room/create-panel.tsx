import { Button } from '@components/button';
import { InputNumber } from '@components/input-number';
import { Radio } from '@components/radio';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { FC, useState } from 'react';

export const CreatePanel: FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    breakoutUIStore: { createGroups },
  } = useStore();
  const [groupNum, setGroupNum] = useState(1);
  const [type, setType] = useState<1 | 2>(1);

  const handleChangeType = (type: 1 | 2) => {
    return () => {
      setType(type);
    };
  };

  const handleChangeGroupNum = (num: number | null) => {
    if (num) {
      setGroupNum(num);
    }
  };

  const handleRecreate = () => {
    createGroups(type, groupNum);
    onClose();
  };

  return (
    <div className="fcr-breakout-room__create-panel">
      <div className="fcr-breakout-room__create-panel-header">
        {/* top right close */}
        <div className="fcr-breakout-room__create-panel-close" onClick={onClose}>
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={9.6} />
        </div>
      </div>
      <div className="fcr-breakout-room__create-panel-create-number">
        <span>Create</span>
        <InputNumber size="small" min={1} onChange={handleChangeGroupNum} value={groupNum} />
        <span>breakout rooms</span>
      </div>
      {/* divider */}
      <div className="fcr-breakout-room__create-panel-divider" />
      <Radio label="Assign automatically" checked={type === 1} onChange={handleChangeType(1)} />
      {/* divider */}
      <div className="fcr-breakout-room__create-panel-divider" />
      <Radio label="Assign manually" checked={type === 2} onChange={handleChangeType(2)} />
      <div className="fcr-breakout-room__create-panel-buttons">
        <Button size="XS" styleType="gray" onClick={onClose}>
          No
        </Button>
        <Button size="XS" onClick={handleRecreate}>
          Yes
        </Button>
      </div>
    </div>
  );
};
