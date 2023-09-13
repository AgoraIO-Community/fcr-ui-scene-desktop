import { useEffect, useRef, useState } from 'react';
import {
  WINDOW_REMAIN_POSITION,
  WINDOW_REMAIN_SIZE,
  getContentAreaSize,
  getDefaultBounds,
  getFittedBounds,
} from './helpers';
import { Rnd } from 'react-rnd';
import { reposition, useRndPosition } from '@ui-scene/utils/hooks/use-rnd-position';
import { useStore } from '@ui-scene/utils/hooks/use-store';

export const useFitted = ({
  defaultFullscreen = false,
  rndInstance,
  defaultRect = { width: 0, height: 0 },
}: {
  defaultRect?: {
    width: number;
    height: number;
  };
  defaultFullscreen?: boolean;
  rndInstance: React.RefObject<Rnd | null>;
}) => {
  const {
    layoutUIStore: { viewportBoundaries, layout },
  } = useStore();

  const [fitted, setFitted] = useState(defaultFullscreen);
  const viewportBoundariesRef = useRef(viewportBoundaries);
  const boundsRef = useRef({
    size: WINDOW_REMAIN_SIZE,
    position: WINDOW_REMAIN_POSITION,
  });
  const { updatePosition, updateSize, getPosition, getSize } = useRndPosition(rndInstance);
  const getBounds = () => {
    return fitted
      ? getFittedBounds(getContentAreaSize())
      : getDefaultBounds(getContentAreaSize(), defaultRect.width, defaultRect.height);
  };
  const saveCurrentSizeAndPosition = () => {
    boundsRef.current.size = getSize() || WINDOW_REMAIN_SIZE;
    boundsRef.current.position = getPosition() || WINDOW_REMAIN_POSITION;
  };
  const onFit = (fitted: boolean) => {
    if (fitted) {
      saveCurrentSizeAndPosition();
      const defaultBounds = getFittedBounds(getContentAreaSize());
      updatePosition({ x: defaultBounds.x, y: defaultBounds.y });
      updateSize({ width: defaultBounds.width, height: defaultBounds.height });
    } else {
      updatePosition(boundsRef.current.position);
      updateSize(boundsRef.current.size);
    }
  };
  const onViewportBoundariesChanged = () => {
    if (fitted) {
      const defaultBounds = getBounds();

      updatePosition({ x: defaultBounds.x, y: defaultBounds.y });
      updateSize({ width: defaultBounds.width, height: defaultBounds.height });
    } else {
      const position = getPosition();
      const size = getSize();
      const domRect = (rndInstance.current?.getParent() as HTMLElement)?.getBoundingClientRect();

      const bounds = reposition(
        {
          width: size.width,
          height: size.height,
          left: position?.x || 0,
          top: position?.y || 0,
        },
        viewportBoundariesRef.current,
        {
          left: domRect.left,
          top: domRect.top,
          width: domRect.width,
          height: domRect.height,
        },
      );

      updatePosition({ x: bounds.x, y: bounds.y });
    }
  };
  useEffect(() => {
    onViewportBoundariesChanged();
    viewportBoundariesRef.current = viewportBoundaries;
  }, [fitted, viewportBoundaries, layout]);

  return {
    fitted,
    onFit,
    setFitted,
    getBounds,
    saveCurrentSizeAndPosition,
  };
};
