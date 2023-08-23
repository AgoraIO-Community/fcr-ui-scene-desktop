import { useEffect, useRef, useState } from 'react';
import { useStore } from './use-store';
import { Rnd } from 'react-rnd';
import { useRndPosition } from './use-rnd-position';
import { reposition as getRndReposition } from './use-rnd-position';
export const useDraggablePosition = ({
  initPosition = { x: 0, y: 0 },
  centered = false,
  rndInstance,
}: {
  initPosition?: { x: number; y: number };
  centered?: boolean;
  rndInstance: React.RefObject<Rnd | null>;
}) => {
  const {
    layoutUIStore: { viewportBoundaries },
  } = useStore();
  const firstRenderRef = useRef(false);
  const viewportBoundariesRef = useRef(viewportBoundaries);
  const { getPosition, getSize } = useRndPosition(rndInstance);

  const [position, setPosition] = useState(initPosition);
  const ref = useRef<HTMLDivElement | null>(null);

  const moveToCenter = () => {
    setPosition({
      x: document.body.getBoundingClientRect().width / 2 - (ref.current?.offsetWidth || 0) / 2,
      y: document.body.getBoundingClientRect().height / 2 - (ref.current?.offsetHeight || 0) / 2,
    });
  };

  const reposition = () => {
    if (centered) {
      moveToCenter();
    } else {
      setPosition(initPosition);
    }
  };
  useEffect(() => {
    if (!firstRenderRef.current) {
      reposition();
      firstRenderRef.current = true;
    } else {
      const position = getPosition();
      const size = getSize();
      const domRect = (rndInstance.current?.getParent() as HTMLElement)?.getBoundingClientRect();

      const bounds = getRndReposition(
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
      setPosition(bounds);
    }
    viewportBoundariesRef.current = viewportBoundaries;
  }, [viewportBoundaries]);

  return { position, setPosition, reposition, ref };
};
