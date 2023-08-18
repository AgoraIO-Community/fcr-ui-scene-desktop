import { AgoraOnlineclassWidget } from 'agora-common-libs';
import { observer } from 'mobx-react';
import {
  CSSProperties,
  PropsWithChildren,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Rnd } from 'react-rnd';
import { useFitted } from '../hooks';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { ZIndexContext } from '@onlineclass/utils/hooks/use-z-index';
import { useMinimize } from '@ui-kit-utils/hooks/animations';
import { resizeHandleStyleOverride } from '../helpers';

import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '@onlineclass/extension/events';

export const WidgetDraggableWrapper = observer(
  forwardRef<HTMLDivElement, PropsWithChildren<{ widget: AgoraOnlineclassWidget }>>(function W(
    props,
    ref,
  ) {
    const { children, widget } = props;
    const {
      classroomStore: {
        widgetStore: { widgetController },
      },
      eduToolApi: { isWidgetMinimized, isWidgetVisible, updateWidgetDialogBoundaries },
    } = useStore();
    const rndInstance = useRef<Rnd>(null);
    const { fitted, setFitted, getBounds, onFit } = useFitted(widget, rndInstance);

    const defaultRect = widget.defaultFullscreen ? getBounds() : widget.defaultRect || getBounds();
    const [rndStyle, setRndStyle] = useState<CSSProperties>({});

    const zIndexController = useContext(ZIndexContext);
    const visible = isWidgetVisible(widget.widgetId);
    const minimize = isWidgetMinimized(widget.widgetId);
    useEffect(() => {
      if (!minimize) zIndexController.updateZIndex(widget.widgetId);
      widget.onMinimizedChanged(minimize);
    }, [minimize]);

    useEffect(() => {
      if (visible) zIndexController.updateZIndex(widget.widgetId);
    }, [visible]);

    useEffect(() => {
      if (widgetController) {
        widgetController.addBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.WidgetBecomeActive,
          onMessage: handleWidgetBecomeActive,
        });
        widgetController.addBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.SetFullscreen,
          onMessage: handleWidgetFullscreenChanged,
        });
      }
      return () => {
        widgetController?.removeBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.WidgetBecomeActive,
          onMessage: handleWidgetBecomeActive,
        });
        widgetController?.removeBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.SetFullscreen,
          onMessage: handleWidgetFullscreenChanged,
        });
      };
    }, [widgetController]);
    useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (!(entry.target as HTMLElement).style.cssText.includes('scale(0)')) {
            if (rndInstance.current) {
              rndInstance.current.updateSize({
                width: minimizeRef.current?.clientWidth || 0,
                height: minimizeRef.current?.clientHeight || 0,
              });
            }
          }
        }
      });

      const viewport = minimizeRef.current;
      if (viewport) {
        observer.observe(viewport);
      }
      return observer.disconnect;
    }, []);
    const handleWidgetBecomeActive = ({ widgetId }: { widgetId: string }) => {
      if (widgetId === widget.widgetId) {
        zIndexController.updateZIndex(widget.widgetId);
      }
    };
    const handleWidgetFullscreenChanged = ({
      widgetId,
      fullscreen,
    }: {
      widgetId: string;
      fullscreen: boolean;
    }) => {
      if (widgetId === widget.widgetId) {
        onFit(fullscreen);
        setFitted(fullscreen);
      }
    };
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
        disableDragging={!widget.draggable}
        onResize={() => {
          if (fitted) setFitted(false);
        }}
        onDrag={() => {
          if (fitted) setFitted(false);
        }}
        onResizeStop={(_e, _dir, _ele, delta) => {
          updateWidgetDialogBoundaries(widget.widgetId, delta);
        }}
        style={rndStyle}
        ref={rndInstance}
        bounds={widget.boundaryClassName ? `.${widget.boundaryClassName}` : 'body'}
        minWidth={widget?.minWidth}
        minHeight={widget?.minHeight}
        lockAspectRatio={widget?.aspectRatio}
        lockAspectRatioExtraHeight={widget?.aspectRatioExtraHeight}
        resizeHandleStyles={{
          bottom: resizeHandleStyleOverride,
          bottomLeft: resizeHandleStyleOverride,
          bottomRight: resizeHandleStyleOverride,
          left: resizeHandleStyleOverride,
          right: resizeHandleStyleOverride,
          top: resizeHandleStyleOverride,
          topLeft: resizeHandleStyleOverride,
          topRight: resizeHandleStyleOverride,
        }}
        default={defaultRect}
        enableResizing={widget.resizable}
        dragHandleClassName={`${widget.dragHandleClassName || `fcr-widget-dialog-title-bar`}`}
        cancel={`.${widget.dragCancelClassName || `fcr-widget-dialog-content`}`}>
        <div ref={refHandle} style={{ ...minimizeStyle, height: '100%' }}>
          <div ref={ref} style={{ height: '100%' }}>
            {children}
          </div>
        </div>
      </Rnd>
    );
  }),
);
