import { AgoraWidgetController } from 'agora-edu-core';
import { Log, Logger, bound } from 'agora-rte-sdk';
import { action, computed, IReactionDisposer, observable } from 'mobx';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from './events';
import { SvgIconEnum } from '@components/svg-img';
import { computedFn } from 'mobx-utils';
import { StreamMediaPlayerOpenParams, WebviewOpenParams } from '@onlineclass/uistores/type';
import { AgoraOnlineclassSDKMinimizableWidget } from 'agora-common-libs';

@Log.attach({ proxyMethods: false })
export class EduTool {
  logger!: Logger;
  private _controller?: AgoraWidgetController;
  private _disposers: IReactionDisposer[] = [];

  @observable
  private _visibleStateMap = new Map<string, boolean>();
  @observable
  private _minimizedStateMap = new Map<
    string,
    | { icon: SvgIconEnum; tooltip?: string; extra?: unknown }
    | {
        icon: SvgIconEnum;
        tooltip?: string;
        widgetId?: string;
        minimizedIcon: SvgIconEnum;
        extra?: unknown;
      }[]
  >();

  @computed
  get minimizedWidgetIcons() {
    return Array.from(this._minimizedStateMap.entries()).map(([key, value]) => {
      if (value instanceof Array) {
        return value.map((widget) => {
          const { icon, tooltip, widgetId, minimizedIcon, extra } = widget;
          return {
            key,
            icon,
            tooltip,
            widgetId,
            minimizedIcon,
            extra,
          };
        });
      } else {
        const { icon, tooltip, extra } = value;
        return {
          icon,
          widgetId: key,
          tooltip,
          extra,
        };
      }
    });
  }
  isWidgetVisible = computedFn((widgetId: string) => {
    return this._visibleStateMap.has(widgetId);
  });
  isWidgetMinimized = computedFn((widgetId: string) => {
    let minimized = this._minimizedStateMap.has(widgetId);
    this._minimizedStateMap.forEach((item) => {
      if (item instanceof Array) {
        if (item.find((w) => w.widgetId === widgetId)) {
          minimized = true;
        }
      }
    });
    return minimized;
  });
  @bound
  setMinimizedState(params: {
    minimized: boolean;
    widgetId: string;
    minimizeProperties: AgoraOnlineclassSDKMinimizableWidget['minimizeProperties'] & {
      minimizedTooltip?: string;
    };
  }) {
    this._handleMinimizedStateChange(params);
  }
  @action.bound
  private _handleMinimizedStateChange({
    minimized,
    widgetId,
    minimizeProperties,
  }: {
    minimized: boolean;
    widgetId: string;
    minimizeProperties: AgoraOnlineclassSDKMinimizableWidget['minimizeProperties'] & {
      minimizedTooltip?: string;
      extra?: unknown;
    };
  }) {
    const {
      minimizedTooltip,
      minimizedIcon = SvgIconEnum.FCR_CLOSE,
      minimizedKey = '',
      minimizedCollapsed,
      minimizedCollapsedIcon,
      extra,
    } = minimizeProperties;
    if (minimized) {
      if (minimizedCollapsed) {
        let minimizedList = this._minimizedStateMap.get(minimizedKey);
        if (minimizedList && !(minimizedList instanceof Array)) return;
        if (!minimizedList) minimizedList = [];
        const isMinimized = minimizedList.find((item) => item.widgetId === widgetId);
        if (isMinimized) return;
        minimizedList.push({
          widgetId,
          icon: minimizedIcon as SvgIconEnum,
          tooltip: minimizedTooltip,
          minimizedIcon: minimizedCollapsedIcon as SvgIconEnum,
        });
        this._minimizedStateMap.set(minimizedKey, minimizedList);
      } else {
        this._minimizedStateMap.set(widgetId, {
          icon: minimizedIcon as SvgIconEnum,
          tooltip: minimizedTooltip,
          extra: extra,
        });
      }
    } else {
      if (minimizedCollapsed) {
        let minimizedKey = '';
        this._minimizedStateMap.forEach((item, key) => {
          if (item instanceof Array) {
            if (item.find((w) => w.widgetId === widgetId)) {
              minimizedKey = key;
            }
          }
        });
        let minimizedList = this._minimizedStateMap.get(minimizedKey);
        if (!minimizedList || (minimizedList && !(minimizedList instanceof Array))) return;
        minimizedList = minimizedList.filter((item) => item.widgetId !== widgetId);
        if (minimizedList.length > 0) {
          this._minimizedStateMap.set(minimizedKey, minimizedList);
        } else {
          this._minimizedStateMap.delete(minimizedKey);
        }
      } else {
        this._minimizedStateMap.delete(widgetId);
      }
    }
    this._sendMessage(AgoraExtensionRoomEvent.SetMinimize, { widgetId, minimized });
  }
  @action.bound
  private _handleVisibleStateChange({ widgetId, visible }: { widgetId: string; visible: boolean }) {
    if (visible) {
      this._visibleStateMap.set(widgetId, visible);
    } else {
      this._visibleStateMap.delete(widgetId);
    }
  }

  @action.bound
  private _handleWidgetDestroy({ widgetId }: { widgetId: string }) {
    this._minimizedStateMap.delete(widgetId);
    this._visibleStateMap.delete(widgetId);
  }

  @bound
  setWidgetVisible(widgetId: string, visible: boolean) {
    this._handleVisibleStateChange({ widgetId, visible });
  }
  @bound
  sendWidgetVisible(widgetId: string, visible: boolean) {
    this._sendMessage(AgoraExtensionRoomEvent.VisibleChanged, { widgetId, visible });
  }
  @bound
  sendWidgetPrivateChat(widgetId: string, userId: string) {
    this._sendMessage(AgoraExtensionRoomEvent.PrivateChat, { widgetId, userId });
  }
  @bound
  refreshWidget(widgetId: string) {
    this._sendMessage(AgoraExtensionRoomEvent.Refresh, { widgetId });
  }
  @bound
  openWebview(params: WebviewOpenParams) {
    this._sendMessage(AgoraExtensionRoomEvent.OpenWebview, params);
  }
  @bound
  openMediaStreamPlayer(params: StreamMediaPlayerOpenParams) {
    this._sendMessage(AgoraExtensionRoomEvent.OpenStreamMediaPlayer, params);
  }
  @bound
  updateWidgetDialogBoundaries(
    widgetId: string,
    params: { width: string | number; height: string | number },
  ) {
    this._sendMessage(AgoraExtensionRoomEvent.WidgetDialogBoundariesChanged, {
      widgetId,
      ...params,
    });
  }
  install(controller: AgoraWidgetController) {
    this._controller = controller;
    controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.Minimize,
      onMessage: this._handleMinimizedStateChange,
    });
    controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.SetVisible,
      onMessage: this._handleVisibleStateChange,
    });
    controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.WidgetDestroyed,
      onMessage: this._handleWidgetDestroy,
    });
  }

  uninstall() {
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.Minimize,
      onMessage: this._handleMinimizedStateChange,
    });
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.SetVisible,
      onMessage: this._handleVisibleStateChange,
    });
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.WidgetDestroyed,
      onMessage: this._handleWidgetDestroy,
    });

    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
  @bound
  private _sendMessage(event: AgoraExtensionRoomEvent, args?: unknown) {
    if (this._controller) {
      this._controller.broadcast(event, args);
    } else {
      this.logger.warn('Widget controller not ready, cannot broadcast message');
    }
  }
}
