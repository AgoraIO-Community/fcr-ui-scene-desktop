import React from 'react';
import { VerticalSlider } from '@components/slider';
import { SvgIconEnum } from '@components/svg-img';
import { ClickableIcon } from '@components/svg-img/clickable-icon';
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
    <div className="fcr-pretest__video-portal__sidebar">
      <VerticalSlider value={sliderValue} onChange={handleBeautyValueChange} />
      <ClickableIcon icon={SvgIconEnum.FCR_RESET} size="small" onClick={handleResetBeautyValue} />
    </div>
  ) : null;
});
