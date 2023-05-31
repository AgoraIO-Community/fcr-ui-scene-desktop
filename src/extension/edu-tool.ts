import { AgoraWidgetController } from 'agora-edu-core';
import { Log, Logger } from 'agora-rte-sdk';
import { action, computed, IReactionDisposer, observable } from 'mobx';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from './events';
import { SvgIconEnum } from '@components/svg-img';

@Log.attach({ proxyMethods: false })
export class EduTool {
  logger!: Logger;
  private _controller?: AgoraWidgetController;
  private _disposers: IReactionDisposer[] = [];
  @observable
  private _minimizedStateMap = new Map<string, { icon: SvgIconEnum; tooltip?: string }>();

  @computed
  get minimizedWidgetIcons() {
    return Array.from(this._minimizedStateMap.entries()).map(([widgetId, { icon, tooltip }]) => ({
      icon,
      widgetId,
      tooltip,
    }));
  }

  isWidgetMinimized(widgetId: string) {
    return this._minimizedStateMap.has(widgetId);
  }

  @action.bound
  private _handleMinimizedStateChange({
    minimized,
    widgetId,
    icon,
    tooltip,
  }: {
    minimized: boolean;
    widgetId: string;
    icon: SvgIconEnum;
    tooltip?: string;
  }) {
    if (minimized) {
      this._minimizedStateMap.set(widgetId, { icon, tooltip });
    } else {
      this._minimizedStateMap.delete(widgetId);
    }
  }

  @action.bound
  private _handleWidgetDestroy({ widgetId }: { widgetId: string }) {
    this._minimizedStateMap.delete(widgetId);
  }

  setWidgetMinimized(minimized: boolean, widgetId: string) {
    this._sendMessage(AgoraExtensionRoomEvent.SetMinimize, { widgetId, minimized });
  }

  install(controller: AgoraWidgetController) {
    this._controller = controller;
    controller.addBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.Minimize,
      onMessage: this._handleMinimizedStateChange,
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
      messageType: AgoraExtensionWidgetEvent.WidgetDestroyed,
      onMessage: this._handleWidgetDestroy,
    });

    this._disposers.forEach((d) => d());
    this._disposers = [];
  }

  private _sendMessage(event: AgoraExtensionRoomEvent, args?: unknown) {
    if (this._controller) {
      this._controller.broadcast(event, args);
    } else {
      this.logger.warn('Widget controller not ready, cannot broadcast message');
    }
  }
}
