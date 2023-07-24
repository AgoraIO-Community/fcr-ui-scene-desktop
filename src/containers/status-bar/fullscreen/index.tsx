import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useEffect, useState } from 'react';
import { StatusBarItemWrapper } from '..';
import fscreen from 'fscreen';

import './index.css';
import { useI18n } from 'agora-common-libs';
export const FullscreenButton = () => {
  const transI18n = useI18n();
  const [fullscreen, setFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (fullscreen) {
      fscreen.exitFullscreen();
    } else {
      fscreen.requestFullscreen(document.body);
    }
  };
  const handleFullscreenChanged = () => {
    if (fscreen.fullscreenElement) {
      setFullscreen(true);
    } else {
      setFullscreen(false);
    }
  };
  useEffect(() => {
    fscreen.addEventListener('fullscreenchange', handleFullscreenChanged);
    () => fscreen.removeEventListener('fullscreenchange', handleFullscreenChanged);
  }, []);
  return (
    <ToolTip
      placement="bottomRight"
      content={
        fullscreen
          ? transI18n('fcr_room_tips_exit_full_screen')
          : transI18n('fcr_room_tips_full_screen')
      }>
      <StatusBarItemWrapper>
        <div onClick={toggleFullscreen} className="fcr-status-bar-fullscreen">
          <SvgImg
            size={20}
            type={
              fullscreen ? SvgIconEnum.FCR_WINDOW_SMALLER : SvgIconEnum.FCR_WINDOW_BIGGER
            }></SvgImg>
        </div>
      </StatusBarItemWrapper>
    </ToolTip>
  );
};
