import { Button } from '@components/button';
import { InputNumber } from '@components/input-number';
import { Radio } from '@components/radio';
import { SvgImg, SvgIconEnum } from '@components/svg-img';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';
import { FC, useState } from 'react';

export const CreatePanel: FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    breakoutUIStore: { createGroups },
  } = useStore();
  const [groupNum, setGroupNum] = useState(1);
  const [type, setType] = useState<1 | 2>(1);
  const transI18n = useI18n();

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
        <span>{transI18n('fcr_group_label_create')}</span>
        <InputNumber size="small" min={1} onChange={handleChangeGroupNum} value={groupNum} />
        <span>{transI18n('fcr_group_label_breakout_rooms')}</span>
      </div>
      {/* divider */}
      <div className="fcr-breakout-room__create-panel-divider" />
      <Radio
        label={transI18n('fcr_group_assign_automatically')}
        checked={type === 1}
        onChange={handleChangeType(1)}
      />
      {/* divider */}
      <div className="fcr-breakout-room__create-panel-divider" />
      <Radio
        label={transI18n('fcr_group_assign_manually')}
        checked={type === 2}
        onChange={handleChangeType(2)}
      />
      <div className="fcr-breakout-room__create-panel-buttons">
        <Button size="XS" styleType="gray" onClick={onClose} shape="rounded">
          {transI18n('fcr_group_create_group_no')}
        </Button>
        <Button size="XS" onClick={handleRecreate} shape="rounded">
          {transI18n('fcr_group_create_group_yes')}
        </Button>
      </div>
    </div>
  );
};
