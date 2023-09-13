import { VerticalSlider } from '@components/slider';
import { SvgIconEnum } from '@components/svg-img';
import { ClickableIcon } from '@components/svg-img/clickable-icon';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';

export const BeautySlider = observer(() => {
  const { deviceSettingUIStore } = useStore();
  const {
    activeBeautyValue = 0,
    activeBeautyType,
    setBeautyFilter,
    defaultBeautyOptions,
  } = deviceSettingUIStore;
  const sliderValue = activeBeautyValue * 100;

  const handleBeautyValueChange = (value: number) => {
    if (activeBeautyType) {
      setBeautyFilter({ [activeBeautyType]: value / 100 });
    }
  };

  const handleResetBeautyValue = () => {
    if (activeBeautyType) {
      setBeautyFilter({ [activeBeautyType]: defaultBeautyOptions[activeBeautyType] });
    }
  };

  return (
    <div className="fcr-pretest__video-portal__sidebar">
      <VerticalSlider value={sliderValue} onChange={handleBeautyValueChange} />
      <ClickableIcon icon={SvgIconEnum.FCR_RESET} size="small" onClick={handleResetBeautyValue} />
    </div>
  );
});
