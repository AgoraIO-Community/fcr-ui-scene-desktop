import { FcrUISceneWidget } from 'agora-common-libs';
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
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { ZIndexContext } from '@ui-scene/utils/hooks/use-z-index';
import { useMinimize } from '@ui-kit-utils/hooks/animations';
import { resizeHandleStyleOverride } from '../helpers';

import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '@ui-scene/extension/events';

export const WidgetDraggableWrapper = observer(
  forwardRef<HTMLDivElement, PropsWithChildren<{ widget: FcrUISceneWidget }>>(function W(
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
    const { fitted, setFitted, getBounds, onFit, saveCurrentSizeAndPosition } = useFitted({
      rndInstance,
      defaultFullscreen: widget.defaultFullscreen,
      defaultRect: widget.defaultRect,
    });

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
        widgetController.addBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.UpdateSize,
          onMessage: handleWidgetSizeChanged,
        });
        widgetController.addBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.UpdatePosition,
          onMessage: handleWidgetPositionChanged,
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
        widgetController?.removeBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.UpdateSize,
          onMessage: handleWidgetSizeChanged,
        });
        widgetController?.removeBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.UpdatePosition,
          onMessage: handleWidgetPositionChanged,
        });
      };
    }, [widgetController]);

    const handleWidgetSizeChanged = ({
      widgetId,
      size,
    }: {
      widgetId: string;
      size: { width: number; height: number };
    }) => {
      if (widgetId === widget.widgetId) {
        if (rndInstance.current) {
          rndInstance.current.updateSize(size);
        }
      }
    };
    const handleWidgetPositionChanged = ({
      widgetId,
      position,
    }: {
      widgetId: string;
      position: { x: number; y: number };
    }) => {
      if (widgetId === widget.widgetId) {
        if (rndInstance.current) {
          rndInstance.current.updatePosition(position);
        }
      }
    };
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
          widget.onExited();
        } else {
          widget.onEntered();
        }
      },
    });

    const exitFitted = () => {
      if (fitted) {
        saveCurrentSizeAndPosition();
        widgetController?.broadcast(AgoraExtensionRoomEvent.SetFullscreen, {
          widgetId: widget.widgetId,
          fullscreen: false,
        });
      }
    };
    return (
      <Rnd
        disableDragging={!widget.draggable}
        onResize={exitFitted}
        onDrag={exitFitted}
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
        <div ref={minimizeRef} style={{ ...minimizeStyle, height: '100%' }}>
          <div ref={ref} style={{ height: '100%' }}>
            {children}
          </div>
        </div>
      </Rnd>
    );
  }),
);
