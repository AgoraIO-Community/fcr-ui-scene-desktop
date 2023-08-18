import { AgoraOnlineclassWidget } from 'agora-common-libs';
import { useEffect, useRef, useState } from 'react';
import {
  WINDOW_REMAIN_POSITION,
  WINDOW_REMAIN_SIZE,
  getContentAreaSize,
  getDefaultBounds,
  getFittedBounds,
} from './helpers';
import { Rnd } from 'react-rnd';
import { useRndPosition } from '@onlineclass/utils/hooks/use-rnd-position';
import { clampBounds } from '@onlineclass/utils/clamp-bounds';
import { useStore } from '@onlineclass/utils/hooks/use-store';

export const useFitted = (
  widget: AgoraOnlineclassWidget,
  rndInstance: React.RefObject<Rnd | null>,
) => {
  const {
    layoutUIStore: { viewportBoundaries, layout },
  } = useStore();
  const [fitted, setFitted] = useState(widget.defaultFullscreen || false);
  const boundsRef = useRef({
    size: WINDOW_REMAIN_SIZE,
    position: WINDOW_REMAIN_POSITION,
  });
  const { updatePosition, updateSize, getPosition, getSize } = useRndPosition(rndInstance);
  const getBounds = () => {
    return fitted
      ? getFittedBounds(getContentAreaSize())
      : getDefaultBounds(getContentAreaSize(), widget.defaultRect.width, widget.defaultRect.height);
  };
  const onViewportBoundariesChanged = () => {
    if (fitted) {
      const defaultBounds = getBounds();

      updatePosition({ x: defaultBounds.x, y: defaultBounds.y });
      updateSize({ width: defaultBounds.width, height: defaultBounds.height });
    } else {
      const position = getPosition();
      const size = getSize();
      const bounds = clampBounds(
        {
          width: size.width,
          height: size.height,
          left: position?.x || 0,
          top: position?.y || 0,
        },
        {
          ...(rndInstance.current?.getParent() as HTMLElement)?.getBoundingClientRect(),
        },
      );
      updatePosition({ x: bounds.x, y: bounds.y });
      updateSize({ width: bounds.width, height: bounds.height });
    }
  };
  const onFit = (fitted: boolean) => {
    if (fitted) {
      boundsRef.current.size = getSize() || WINDOW_REMAIN_SIZE;
      boundsRef.current.position = getPosition() || WINDOW_REMAIN_POSITION;
      const defaultBounds = getFittedBounds(getContentAreaSize());
      updatePosition({ x: defaultBounds.x, y: defaultBounds.y });
      updateSize({ width: defaultBounds.width, height: defaultBounds.height });
    } else {
      updatePosition(boundsRef.current.position);
      updateSize(boundsRef.current.size);
    }
  };
  useEffect(onViewportBoundariesChanged, [fitted, viewportBoundaries, layout]);

  return {
    fitted,
    onFit,
    setFitted,
    getBounds,
  };
};
