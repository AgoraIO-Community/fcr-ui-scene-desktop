import { observer } from 'mobx-react';
import React, { createRef, forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './index.css';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { AgoraOnlineclassWidget } from 'agora-common-libs';

import { useZIndex } from '@onlineclass/utils/hooks/use-z-index';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { WidgetDraggableWrapper } from './draggable-wrapper';
import { ParticipantsDialogWrapper } from './participants';
import { BreakoutDialogWrapper } from './break-out-room';
export const WidgetContainer = observer(() => {
  const {
    eduToolApi: { isWidgetVisible },
    widgetUIStore: { z0Widgets, z10Widgets },
  } = useStore();
  return (
    <React.Fragment>
      <div className="fcr-widget-container fcr-z-0">
        <ParticipantsDialogWrapper></ParticipantsDialogWrapper>
        <BreakoutDialogWrapper></BreakoutDialogWrapper>
        <TransitionGroup>
          {z0Widgets
            .filter((w) => isWidgetVisible(w.widgetId))
            .map((w: AgoraOnlineclassWidget) => {
              const ref = createRef<HTMLDivElement>();
              return (
                <CSSTransition
                  nodeRef={ref}
                  key={w.widgetId}
                  timeout={500}
                  unmountOnExit
                  classNames={'fcr-widget-dialog-transition'}>
                  <Widget ref={ref} widget={w} />
                </CSSTransition>
              );
            })}
        </TransitionGroup>
      </div>
      <div className="fcr-widget-container fcr-z-10">
        <TransitionGroup>
          {z10Widgets
            .filter((w) => isWidgetVisible(w.widgetId))
            .map((w: AgoraOnlineclassWidget) => {
              const ref = createRef<HTMLDivElement>();
              return (
                <CSSTransition
                  nodeRef={ref}
                  key={w.widgetId}
                  timeout={500}
                  unmountOnExit
                  classNames={'fcr-widget-dialog-transition'}>
                  <Widget ref={ref} widget={w} />
                </CSSTransition>
              );
            })}
        </TransitionGroup>
      </div>
    </React.Fragment>
  );
});

export const Widget = observer(
  forwardRef<HTMLDivElement, { widget: AgoraOnlineclassWidget }>(function w({ widget }, ref) {
    const containerDom = useRef<HTMLElement>();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      const locatedNode = widget.locate();

      if (locatedNode) {
        containerDom.current = locatedNode;
      }

      setMounted(true);
      return () => {
        setMounted(false);
      };
    }, []);
    if (widget.locate()) {
      if (mounted) {
        if (containerDom.current) {
          return createPortal(
            <WidgetWrapper ref={ref} widget={widget}></WidgetWrapper>,
            containerDom.current,
          );
        }
      } else {
        return null;
      }
    }

    return <WidgetWrapper ref={ref} widget={widget}></WidgetWrapper>;
  }),
);
const WidgetWrapper = observer(
  forwardRef<HTMLDivElement, { widget: AgoraOnlineclassWidget }>(function w({ widget }, ref) {
    const { zIndex, ref: zIndexRef } = useZIndex(widget.widgetId);
    const renderRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      if (renderRef.current) {
        widget.render(renderRef.current);
      }
      return () => {
        widget.unload();
      };
    }, []);
    const handleRef = (ref: HTMLDivElement) => {
      zIndexRef.current = ref;
      renderRef.current = ref;
    };

    return (
      <>
        <div style={{ zIndex }} className="fcr-widget-inner">
          <WidgetDraggableWrapper ref={ref} widget={widget}>
            <div ref={handleRef}></div>
          </WidgetDraggableWrapper>
        </div>
      </>
    );
  }),
);
