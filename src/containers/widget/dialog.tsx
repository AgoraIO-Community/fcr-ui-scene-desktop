import { useMinimize } from '@ui-kit-utils/hooks/animations';
import { observer } from 'mobx-react';
import { CSSProperties, PropsWithChildren, forwardRef, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import classNames from 'classnames';
import { AgoraOnlineclassSDKDialogWidget, AgoraOnlineclassSDKWidgetBase } from 'agora-common-libs';
import { ToolTip } from '@components/tooltip';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import './dialog.css';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { Boundaries, Size, clampBounds } from '@onlineclass/utils/clamp-bounds';
import { useZIndex } from '@onlineclass/utils/hooks/use-z-index';
import { AgoraExtensionWidgetEvent } from '@onlineclass/extension/events';
interface WidgetDialogProps extends PropsWithChildren {
  widget: AgoraOnlineclassSDKWidgetBase & AgoraOnlineclassSDKDialogWidget;
}
export const WINDOW_TITLE_HEIGHT = 28;
// width / height
export const WINDOW_ASPECT_RATIO = 1836 / 847;
export const videoRowClassName = 'fcr-layout-content-video-list-row';

export const layoutContentClassName = 'fcr-layout-content-main-view';

export const WINDOW_REMAIN_SIZE = { width: 783, height: 388 };
export const WINDOW_REMAIN_POSITION = { x: 0, y: 171 };
export const WidgetDialog = observer(
  forwardRef<HTMLDivElement, PropsWithChildren<WidgetDialogProps>>(function W(
    { children, widget },
    ref,
  ) {
    const refreshRef = useRef<HTMLLIElement>(null);
    const boundsRef = useRef({
      size: WINDOW_REMAIN_SIZE,
      position: WINDOW_REMAIN_POSITION,
    });
    const {
      classroomStore: {
        widgetStore: { widgetController },
      },
      widgetUIStore: { destroyWidget, setWidgetInactive },
      eduToolApi: {
        isWidgetMinimized,
        setMinimizedState,
        refreshWidget,
        updateWidgetDialogBoundaries,
      },
      participantsUIStore: { isHost },
    } = useStore();
    const minimized = isWidgetMinimized(widget.widgetId);
    const [fitted, setFitted] = useState(widget.defaultFullscreen);
    const [rndStyle, setRndStyle] = useState<CSSProperties>({ display: 'block' });
    const { updateZIndex } = useZIndex(widget.widgetId);
    const canClose = isHost;
    const bounds = 'parent';
    const getBounds = () => {
      return fitted
        ? getFittedBounds(getContentAreaSize())
        : getDefaultBounds(getContentAreaSize());
    };

    const resizeHandleStyleOverride = { zIndex: 999 };

    const rndInstance = useRef<Rnd>(null);
    const isHorizontalLayout = () => {
      const clasNameExists = document.querySelector(`.${videoRowClassName}`);

      return !!clasNameExists;
    };

    const getMaxSizeInContainer = (containerSize: Size) => {
      let width = containerSize.width;
      let height = containerSize.width / WINDOW_ASPECT_RATIO + WINDOW_TITLE_HEIGHT;

      if (height > containerSize.height) {
        height = containerSize.height - WINDOW_TITLE_HEIGHT;
        width = height * WINDOW_ASPECT_RATIO;
        height = height + WINDOW_TITLE_HEIGHT;
      }

      return { width, height };
    };
    const getFittedBounds = (containerBoundaries: Boundaries) => {
      if (isHorizontalLayout()) {
        containerBoundaries.height = containerBoundaries.height - 58;
      }

      const maxSize = getMaxSizeInContainer(containerBoundaries);
      const width = maxSize.width;
      const height = maxSize.height;
      const x = (containerBoundaries.width - width) / 2 + containerBoundaries.left;

      const y = (containerBoundaries.height - height) / 2 + containerBoundaries.top;

      return { x, y, width, height };
    };
    useEffect(() => {
      const observer = new ResizeObserver(onViewportBoundariesChanged);
      observer.observe(document.querySelector(`.${layoutContentClassName}`) as Element);
      return () => {
        observer.disconnect();
      };
    }, [fitted]);
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
            left: position.x,
            top: position.y,
          },
          {
            ...(rndInstance.current?.getParent() as HTMLElement).getBoundingClientRect(),
          },
        );
        updatePosition({ x: bounds.x, y: bounds.y });
        updateSize({ width: bounds.width, height: bounds.height });
      }
    };
    const getDefaultBounds = (containerBoundaries: Boundaries) => {
      if (isHorizontalLayout()) {
        containerBoundaries.height = containerBoundaries.height - 58;
      }

      const width = widget.defaultWidth || 400;
      const height = widget.defaultHeight || 300;
      const x = (containerBoundaries.width - width) / 2 + containerBoundaries.left;

      const y = (containerBoundaries.height - height) / 2 + containerBoundaries.top;

      return { x, y, width, height };
    };
    const handleMinimize = () => {
      setMinimizedState({
        minimized: true,
        widgetId: widget.widgetId,
        minimizeProperties: {
          minimizedTooltip: widget.displayName || widget.widgetName,
          minimizedIcon: widget.minimizeProperties?.minimizedIcon as SvgIconEnum,
          minimizedKey: widget.minimizeProperties?.minimizedKey || widget.widgetId,
          minimizedCollapsed: widget.minimizeProperties?.minimizedCollapsed || false,
          minimizedCollapsedIcon: widget.minimizeProperties?.minimizedCollapsedIcon as SvgIconEnum,
        },
      });
    };
    const handleWidgetBecomeActive = ({ widgetId }: { widgetId: string }) => {
      if (widgetId === widget.widgetId) {
        updateZIndex();
      }
    };
    useEffect(() => {
      if (widgetController) {
        widgetController.addBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.WidgetBecomeActive,
          onMessage: handleWidgetBecomeActive,
        });
      }
      return () => {
        widgetController?.removeBroadcastListener({
          messageType: AgoraExtensionWidgetEvent.WidgetBecomeActive,
          onMessage: handleWidgetBecomeActive,
        });
      };
    }, [widgetController]);
    useEffect(() => {
      if (!minimized) updateZIndex();
    }, [minimized]);
    const getContentAreaSize = () => {
      const layoutContentDom = document.querySelector(`.${layoutContentClassName}`);

      const contentAreaSize = { width: 0, height: 0, top: 0, left: 0 };
      if (layoutContentDom) {
        const { width, height, left, top } = layoutContentDom.getBoundingClientRect();
        contentAreaSize.width = width;
        contentAreaSize.height = height;
        contentAreaSize.left = left;
        contentAreaSize.top = top;
      }

      return contentAreaSize;
    };
    const handleClose = () => {
      destroyWidget(widget.widgetId);
      setWidgetInactive(widget.widgetId);
    };
    const handleFitToContainer = () => {
      if (fitted) {
        updatePosition(boundsRef.current.position);
        updateSize(boundsRef.current.size);
      } else {
        boundsRef.current.size = getSize();
        boundsRef.current.position = getPosition();
        const defaultBounds = getFittedBounds(getContentAreaSize());
        updatePosition({ x: defaultBounds.x, y: defaultBounds.y });
        updateSize({ width: defaultBounds.width, height: defaultBounds.height });
      }
      setFitted(!fitted);
    };
    const getPosition = () => {
      if (!rndInstance.current) {
        throw new Error('rnd instance is not available');
      }
      return rndInstance.current.getDraggablePosition();
    };
    const getSize = () => {
      if (!rndInstance.current) {
        throw new Error('rnd instance is not available');
      }

      const ele = rndInstance.current.getSelfElement();

      if (!ele) {
        throw new Error('rnd ele is not available');
      }

      return { width: ele.clientWidth, height: ele.clientHeight };
    };
    const updatePosition = (position: { x: number; y: number }) => {
      if (!rndInstance.current) {
        throw new Error('rnd instance is not available');
      }
      rndInstance.current.updatePosition(position);
    };
    const updateSize = (size: { width: string | number; height: string | number }) => {
      if (!rndInstance.current) {
        throw new Error('rnd instance is not available');
      }

      rndInstance.current.updateSize(size);
      updateWidgetDialogBoundaries(widget.widgetId, size);
    };

    const { style: miniStyle, ref: miniRef } = useMinimize({
      minimize: minimized,
      beforeChange(minimize) {
        if (!minimize) {
          setRndStyle({ display: 'block' });
        }
      },
      afterChange(minimize) {
        if (minimize) {
          setRndStyle({ display: 'none' });
        }
      },
    });

    const clsn = classNames('fcr-widget-dialog');

    return (
      <Rnd
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
        dragHandleClassName={`fcr-widget-dialog-title-bar`}
        cancel={`fcr-widget-dialog-content`}
        bounds={bounds}
        minWidth={widget?.minWidth}
        minHeight={widget?.minHeight}
        default={getBounds()}
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
        }}>
        <div className={clsn} ref={miniRef} style={miniStyle}>
          <div ref={ref} className="fcr-widget-dialog-zindex-wrapper">
            <div className={`fcr-widget-dialog-title-bar`}>
              <span>{widget.displayName || widget.widgetName}</span>
              <div className={`fcr-widget-dialog-title-actions`}>
                <ul>
                  {widget?.refreshable && (
                    <ToolTip content="Refresh">
                      <li
                        className="fcr-widget-dialog-title-action-refresh"
                        ref={refreshRef}
                        onClick={() => {
                          const aniApi = refreshRef.current?.animate(
                            {
                              transform: ['rotate(0deg)', 'rotate(360deg)'],
                            },
                            { duration: 500 },
                          );
                          aniApi?.play();
                          refreshWidget(widget.widgetId);
                        }}>
                        <SvgImg type={SvgIconEnum.FCR_RESET} size={16} />
                      </li>
                    </ToolTip>
                  )}
                  {widget?.minimizable && (
                    <ToolTip content="Minimization">
                      <li
                        className="fcr-widget-dialog-title-action-minimize"
                        onClick={() => handleMinimize()}>
                        <SvgImg type={SvgIconEnum.FCR_WINDOWPAGE_SMALLER} size={16} />
                      </li>
                    </ToolTip>
                  )}
                  {widget?.fullscreenable && (
                    <ToolTip
                      overlayInnerStyle={{ whiteSpace: 'nowrap' }}
                      placement={'top'}
                      content={fitted ? 'Exit Adaptation' : 'Adapt to Viewport'}>
                      <li
                        className="fcr-widget-dialog-title-action-fullscreen"
                        onClick={handleFitToContainer}>
                        <SvgImg
                          type={
                            fitted
                              ? SvgIconEnum.FCR_WINDOWPAGE_SMALLER3
                              : SvgIconEnum.FCR_WINDOWPAGE_SMALLER2
                          }
                          size={16}
                        />
                      </li>
                    </ToolTip>
                  )}

                  {canClose && widget.closeable && (
                    <ToolTip content="Close">
                      <li className="fcr-widget-dialog-title-action-close" onClick={handleClose}>
                        <SvgImg type={SvgIconEnum.FCR_CLOSE} size={12} />
                      </li>
                    </ToolTip>
                  )}
                </ul>
              </div>
            </div>
            <div className={`fcr-widget-dialog-content `}>{children}</div>
          </div>
        </div>
      </Rnd>
    );
  }),
);
