import React from 'react';
import { VerticalSlider } from '@onlineclass/components/slider';
import { SvgIconEnum } from '@onlineclass/components/svg-img';
import { ClickableIcon } from '@onlineclass/components/svg-img/clickable-icon';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react';

export const BeautySlider = observer(() => {
  const { deviceSettingUIStore } = useStore();
  const {
    isBeautyFilterEnabled,
    activeBeautyValue = 0,
    activeBeautyType,
    setBeautyFilter,
  } = deviceSettingUIStore;

  const sliderValue = activeBeautyValue * 100;

  const handleBeautyValueChange = (value: number) => {
    if (activeBeautyType) {
      setBeautyFilter({ [activeBeautyType]: value / 100 });
    }
  };

  const handleResetBeautyValue = () => {
    if (activeBeautyType) {
      setBeautyFilter({ [activeBeautyType]: 0 });
    }
  };

  return isBeautyFilterEnabled && activeBeautyType ? (
    <React.Fragment>
      <VerticalSlider value={sliderValue} onChange={handleBeautyValueChange} />
      <ClickableIcon icon={SvgIconEnum.FCR_RESET} size="small" onClick={handleResetBeautyValue} />
    </React.Fragment>
  ) : null;
});
