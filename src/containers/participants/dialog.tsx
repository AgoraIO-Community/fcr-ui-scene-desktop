import { useDraggablePosition } from '@onlineclass/utils/hooks/use-drag-position';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { useZIndex } from '@onlineclass/utils/hooks/use-z-index';
import { observer } from 'mobx-react';
import { Rnd } from 'react-rnd';
import { Participants } from '.';
import { forwardRef, useEffect } from 'react';
export const ParticipantsDialog = observer(
  forwardRef<HTMLDivElement | null, unknown>(function ParticipantsWrapper(_, ref) {
    const { zIndex, ref: zIndexRef, updateZIndex } = useZIndex('participants');
    const {
      layoutUIStore: { classroomViewportClassName },
    } = useStore();

    const { ref: positionRef, position, setPosition } = useDraggablePosition({ centered: true });
    const refHandle = (ele: HTMLDivElement) => {
      zIndexRef.current = ele;
      positionRef.current = ele;
    };
    useEffect(() => {
      updateZIndex();
    }, []);
    return (
      <Rnd
        bounds={`.${classroomViewportClassName}`}
        position={position}
        onDrag={(_, { x, y }) => setPosition({ x, y })}
        enableResizing={false}
        cancel="fcr-participants-header-close"
        dragHandleClassName="fcr-participants-header"
        style={{ zIndex }}>
        <div ref={refHandle}>
          <div ref={ref}>
            <Participants></Participants>
          </div>
        </div>
      </Rnd>
    );
  }),
);
