import { AgoraWidgetController } from 'agora-edu-core';
import { Log, Logger, bound } from 'agora-rte-sdk';
import { action, computed, IReactionDisposer, observable } from 'mobx';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from './events';
import { SvgIconEnum } from '@components/svg-img';
import { computedFn } from 'mobx-utils';
import { StreamMediaPlayerOpenParams, WebviewOpenParams } from '@ui-scene/uistores/type';
import { transI18n, FcrUISceneWidget } from 'agora-common-libs';
import { AgoraIMMessageBase, CabinetToolItem } from './type';

@Log.attach({ proxyMethods: false })
export class EduTool {
  logger!: Logger;
  private _controller?: AgoraWidgetController;
  private _disposers: IReactionDisposer[] = [];
  private _stateListener = {
    onActive: () => {},
    onInactive: this._handleWidgetDestroy,
    onPropertiesUpdate: () => {},
    onUserPropertiesUpdate: () => {},
    onTrackUpdate: () => {},
  };
  @observable
  private _registeredCabinetToolItems: CabinetToolItem[] = [
    {
      name: transI18n('fcr_tool_box_breakout_room'),
      id: 'breakout',
      iconType: SvgIconEnum.FCR_V2_BREAKROOM,
    },
  ];
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
  @observable lastUnreadMessage: AgoraIMMessageBase | null = null;
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
  @computed
  get registeredCabinetToolItems() {
    return this._registeredCabinetToolItems;
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
    minimizedProperties: FcrUISceneWidget['minimizedProperties'];
  }) {
    const { minimized, widgetId, minimizedProperties } = params;
    this._handleMinimizedStateChange(params);
    this._sendMessage(AgoraExtensionRoomEvent.SetMinimize, {
      widgetId,
      minimized,
      minimizedProperties,
    });
  }
  @action.bound
  private _handleMinimizedStateChange({
    minimized,
    widgetId,
    minimizedProperties,
  }: {
    minimized: boolean;
    widgetId: string;
    minimizedProperties: FcrUISceneWidget['minimizedProperties'];
  }) {
    const {
      minimizedTooltip,
      minimizedIcon = SvgIconEnum.FCR_CLOSE,
      minimizedKey = '',
      minimizedCollapsed,
      minimizedCollapsedIcon,
    } = minimizedProperties;
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
  private _deleteMinimizedState(widgetId: string) {
    if (this._minimizedStateMap.has(widgetId)) {
      this._minimizedStateMap.delete(widgetId);
    } else {
      this._minimizedStateMap.forEach((value, key) => {
        if (Array.isArray(value)) {
          const newValue = value.filter((item) => item.widgetId !== widgetId);
          if (value.length <= 0) {
            this._minimizedStateMap.delete(key);
          } else {
            this._minimizedStateMap.set(key, newValue);
          }
        }
      });
    }
  }
  @action.bound
  private _handleWidgetDestroy(widgetId: string) {
    this._deleteMinimizedState(widgetId);
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

  @action.bound
  private _handleRegisterCabinetTool(cabinetToolItem: CabinetToolItem) {
    const existed = this._registeredCabinetToolItems.some(({ id }) => id === cabinetToolItem.id);
    if (!existed) {
      this._registeredCabinetToolItems.push(cabinetToolItem);
    }
  }

  @action.bound
  private _handleUnregisterCabinetTool(id: string) {
    this._registeredCabinetToolItems = this._registeredCabinetToolItems.filter(
      (item) => id !== item.id,
    );
  }
  @action.bound
  private _handleChatUnreadMessageUpdate(message: AgoraIMMessageBase) {
    this.lastUnreadMessage = message;
  }
  install(controller: AgoraWidgetController) {
    this._controller = controller;
    this._controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.ChatUnreadMessageUpdate,
      onMessage: this._handleChatUnreadMessageUpdate,
    });
    this._controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.RegisterCabinetTool,
      onMessage: this._handleRegisterCabinetTool,
    });
    this._controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.UnregisterCabinetTool,
      onMessage: this._handleUnregisterCabinetTool,
    });
    controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.SetMinimize,
      onMessage: this._handleMinimizedStateChange,
    });
    controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.SetVisible,
      onMessage: this._handleVisibleStateChange,
    });
    controller.addWidgetStateListener(this._stateListener);
  }

  uninstall() {
    this._controller?.removeWidgetStateListener(this._stateListener);
    this._minimizedStateMap.clear();
    this._visibleStateMap.clear();
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.ChatUnreadMessageUpdate,
      onMessage: this._handleChatUnreadMessageUpdate,
    });
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.RegisterCabinetTool,
      onMessage: this._handleRegisterCabinetTool,
    });
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.UnregisterCabinetTool,
      onMessage: this._handleUnregisterCabinetTool,
    });
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.SetMinimize,
      onMessage: this._handleMinimizedStateChange,
    });
    this._controller?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.SetVisible,
      onMessage: this._handleVisibleStateChange,
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
