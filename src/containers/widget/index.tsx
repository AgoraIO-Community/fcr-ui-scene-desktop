import { observer } from 'mobx-react';
import React, {
  CSSProperties,
  FC,
  PropsWithChildren,
  createRef,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import './index.css';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { AgoraDraggableWidget, AgoraOnlineclassSDKWidgetBase } from 'agora-common-libs';
import { Rnd } from 'react-rnd';

import { useMinimize } from '@ui-kit-utils/hooks/animations';

import { ParticipantsDialog } from '../participants/dialog';
import { ZIndexContext, useZIndex } from '@onlineclass/utils/hooks/use-z-index';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { WidgetDialog } from './dialog';
import { BreakoutDialog } from '../breakout-room';
import { chatroomWidgetId } from '@onlineclass/extension/type';
export const WidgetContainer = observer(() => {
  const {
    widgetUIStore: { z0Widgets, z10Widgets, widgetInstanceList },
  } = useStore();
  const chatWidget = widgetInstanceList.find((w) => w.widgetId === chatroomWidgetId);
  return (
    <React.Fragment>
      <div className="fcr-widget-container fcr-z-0">
        <ParticipantsDialogWrapper></ParticipantsDialogWrapper>
        <BreakoutDialogWrapper></BreakoutDialogWrapper>
        {chatWidget && <ChatroomWidget chatWidget={chatWidget}></ChatroomWidget>}
        <TransitionGroup>
          {z0Widgets
            .filter((w) => w.widgetId !== chatroomWidgetId)
            .map((w: AgoraOnlineclassSDKWidgetBase) => {
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
        {z10Widgets.map((w: AgoraOnlineclassSDKWidgetBase) => (
          <Widget key={w.widgetId} widget={w} />
        ))}
      </div>
    </React.Fragment>
  );
});
export const ChatroomZindexWrapper: FC<PropsWithChildren> = ({ children }) => {
  const { ref: zIndexRef } = useZIndex(chatroomWidgetId);
  return <div ref={zIndexRef}>{children}</div>;
};
export const ChatroomWidget = observer(
  ({ chatWidget }: { chatWidget: AgoraOnlineclassSDKWidgetBase }) => {
    const {
      eduToolApi: { isWidgetVisible, sendWidgetVisible },
    } = useStore();
    const visible = isWidgetVisible(chatroomWidgetId);
    const animRef = useRef<HTMLDivElement | null>(null);
    const renderRef = useRef<HTMLDivElement | null>(null);
    const { zIndex } = useZIndex(chatroomWidgetId);

    useEffect(() => {
      if (renderRef.current) {
        chatWidget.render(renderRef.current);
      }
      return () => {
        chatWidget?.unload();
      };
    }, []);
    useEffect(() => {
      visible && sendWidgetVisible(chatroomWidgetId, visible);
    }, [visible]);

    const handleRef = (ref: HTMLDivElement) => {
      animRef.current = ref;
    };
    return (
      <>
        <div ref={renderRef}></div>
        <CSSTransition
          onExited={() => sendWidgetVisible(chatroomWidgetId, false)}
          in={visible}
          nodeRef={animRef}
          timeout={500}
          unmountOnExit
          classNames={'fcr-widget-dialog-transition'}>
          <div style={{ zIndex }} className="fcr-widget-inner">
            <WidgetDraggableWrapper widget={chatWidget}>
              <div ref={handleRef}>
                <ChatroomZindexWrapper>
                  <div id="fcr-chatroom-dialog-slot"></div>
                </ChatroomZindexWrapper>
              </div>
            </WidgetDraggableWrapper>
          </div>
        </CSSTransition>
      </>
    );
  },
);

export const Widget = observer(
  forwardRef<HTMLDivElement, { widget: AgoraOnlineclassSDKWidgetBase }>(function w(
    { widget },
    ref,
  ) {
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
  forwardRef<HTMLDivElement, { widget: AgoraOnlineclassSDKWidgetBase }>(function w(
    { widget },
    ref,
  ) {
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
        {widget.widgetId !== 'poll' ? (
          <div style={{ zIndex }} ref={ref} className="fcr-widget-inner">
            <WidgetDialog ref={zIndexRef} widget={widget}>
              <div ref={renderRef}></div>
            </WidgetDialog>
          </div>
        ) : (
          <div style={{ zIndex }} className="fcr-widget-inner">
            <WidgetDraggableWrapper widget={widget}>
              <div ref={ref}>
                <div ref={handleRef}></div>
              </div>
            </WidgetDraggableWrapper>
          </div>
        )}
      </>
    );
  }),
);

const WidgetDraggableWrapper: FC<PropsWithChildren<{ widget: AgoraOnlineclassSDKWidgetBase }>> =
  observer((props) => {
    const { children, widget } = props;
    //@ts-ignore
    const defaultRect = widget.defaultRect as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const [rndStyle, setRndStyle] = useState<CSSProperties>({});
    const {
      layoutUIStore: { classroomViewportClassName },
      eduToolApi: { isWidgetMinimized, isWidgetVisible },
    } = useStore();
    const zIndexController = React.useContext(ZIndexContext);
    const visible = isWidgetVisible(widget.widgetId);

    const minimize = isWidgetMinimized(widget.widgetId);
    useEffect(() => {
      if (!minimize) zIndexController.updateZIndex(widget.widgetId);
    }, [minimize]);
    useEffect(() => {
      if (visible) zIndexController.updateZIndex(widget.widgetId);
    }, [visible]);
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

    const refHandle = (ele: HTMLDivElement) => {
      minimizeRef.current = ele;
    };

    return (
      <Rnd
        default={defaultRect}
        style={{ ...rndStyle }}
        bounds={`.${classroomViewportClassName}`}
        enableResizing={false}
        dragHandleClassName={
          (widget as AgoraOnlineclassSDKWidgetBase & AgoraDraggableWidget).dragHandleClassName
        }
        cancel={
          (widget as AgoraOnlineclassSDKWidgetBase & AgoraDraggableWidget).dragCancelClassName
        }>
        <div ref={refHandle} style={{ ...minimizeStyle }}>
          <div>{children}</div>
        </div>
      </Rnd>
    );
  });
const ParticipantsDialogWrapper = observer(() => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    participantsUIStore: { participantsDialogVisible },
  } = useStore();
  return (
    <CSSTransition
      nodeRef={ref}
      in={participantsDialogVisible}
      timeout={500}
      unmountOnExit
      classNames="fcr-widget-dialog-transition">
      <ParticipantsDialog ref={ref}></ParticipantsDialog>
    </CSSTransition>
  );
});

const BreakoutDialogWrapper = observer(() => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    breakoutUIStore: { breakoutDialogVisible },
  } = useStore();

  return (
    <CSSTransition
      nodeRef={ref}
      in={breakoutDialogVisible}
      timeout={500}
      unmountOnExit
      classNames="fcr-widget-dialog-transition">
      <BreakoutDialog ref={ref}></BreakoutDialog>
    </CSSTransition>
  );
});
