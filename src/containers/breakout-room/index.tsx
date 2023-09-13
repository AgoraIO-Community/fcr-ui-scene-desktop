import { useDraggablePosition } from '@ui-scene/utils/hooks/use-drag-position';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useZIndex } from '@ui-scene/utils/hooks/use-z-index';
import { observer } from 'mobx-react';
import { CSSProperties, forwardRef, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import './index.css';
import { BreakoutWizard } from './wizard';
import { useMinimize } from '@ui-kit-utils/hooks/animations';
import { useFitted } from '../widget/hooks';

export const BreakoutDialog = observer(
  forwardRef<HTMLDivElement | null, unknown>(function ParticipantsWrapper(_, ref) {
    const rndInstance = useRef<Rnd | null>(null);

    const { zIndex, ref: zIndexRef, updateZIndex } = useZIndex('breakout');
    const [rndStyle, setRndStyle] = useState<CSSProperties>({});
    const {
      eduToolApi: { isWidgetMinimized },
      layoutUIStore: { classroomViewportClassName },
    } = useStore();

    const {
      ref: positionRef,
      position,
      setPosition,
      reposition,
    } = useDraggablePosition({ centered: true, rndInstance });
    const refHandle = (ele: HTMLDivElement) => {
      zIndexRef.current = ele;
      positionRef.current = ele;
      minimizeRef.current = ele;
    };
    useEffect(() => {
      updateZIndex();
    }, []);

    const minimize = isWidgetMinimized('breakout');

    const { style: minimizeStyle, ref: minimizeRef } = useMinimize({
      minimize,
      beforeChange: (minimize) => {
        if (!minimize) {
          setRndStyle({ display: 'block' });
        }
      },
      afterChange: (minimize) => {
        if (minimize) {
          setRndStyle({ display: 'none' });
        }
      },
    });

    useFitted({
      rndInstance,
    });
    return (
      <Rnd
        ref={rndInstance}
        bounds={`.${classroomViewportClassName}`}
        position={position}
        onDrag={(_, { x, y }) => setPosition({ x, y })}
        enableResizing={false}
        cancel="fcr-breakout-room__drag-cancel"
        dragHandleClassName="fcr-breakout-room__drag-handle"
        style={{ zIndex, ...rndStyle }}>
        <div ref={refHandle} style={minimizeStyle}>
          <div ref={ref}>
            <BreakoutWizard onChange={reposition} />
          </div>
        </div>
      </Rnd>
    );
  }),
);
