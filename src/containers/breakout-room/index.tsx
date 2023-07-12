import { useDraggablePosition } from '@onlineclass/utils/hooks/use-drag-position';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { useZIndex } from '@onlineclass/utils/hooks/use-z-index';
import { observer } from 'mobx-react';
import { CSSProperties, forwardRef, useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import './index.css';
import { BreakoutWizard } from './wizard';
import { useMinimize } from '@ui-kit-utils/hooks/animations';

export const BreakoutDialog = observer(
  forwardRef<HTMLDivElement | null, unknown>(function ParticipantsWrapper(_, ref) {
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
    } = useDraggablePosition({ centered: true });
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

    return (
      <Rnd
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