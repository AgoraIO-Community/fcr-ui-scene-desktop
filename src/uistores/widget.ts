import { AgoraUiCapableConfirmDialogProps, FcrUISceneWidget, transI18n } from 'agora-common-libs';
import { AgoraWidgetTrack, AgoraWidgetController, WidgetState } from 'agora-edu-core';
import { bound, Log } from 'agora-rte-sdk';
import { action, computed, observable, reaction } from 'mobx';
import { EduUIStoreBase } from './base';
import {
  getLaunchOptions,
  getUiConfig,
  getTheme,
  getConfig,
} from '@ui-scene/utils/launch-options-holder';
import { ToastApi } from '@components/toast';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '@ui-scene/extension/events';
import { ConfirmDialogProps } from '@components/dialog/confirm-dialog';
import { CommonDialogType } from './type';

@Log.attach({ proxyMethods: false })
export class WidgetUIStore extends EduUIStoreBase {
  private _defaultActiveWidgetIds = ['easemobIM'];
  private _registeredWidgets: Record<string, typeof FcrUISceneWidget> = {};
  @observable
  private _widgetInstances: Record<string, FcrUISceneWidget> = {};
  private _stateListener = {
    onActive: this._handleWidgetActive,
    onInactive: this._handleWidgetInactive,
    onPropertiesUpdate: this._handlePropertiesUpdate,
    onUserPropertiesUpdate: this._handleUserPropertiesUpdate,
    onTrackUpdate: () => {},
  };

  @computed
  get ready() {
    return !!this.classroomStore.widgetStore.widgetController;
  }

  @computed
  get registeredWidgetNames() {
    return Object.keys(this._registeredWidgets);
  }

  @computed
  get widgetInstanceList() {
    return Object.values(this._widgetInstances);
  }

  @computed
  get z0Widgets() {
    return this.widgetInstanceList.filter(({ zContainer }) => zContainer === 0);
  }

  get z10Widgets() {
    return this.widgetInstanceList.filter(({ zContainer }) => zContainer === 10);
  }

  @action.bound
  createWidget(
    widgetId: string,
    defaults?: {
      properties?: Record<string, any>;
      userProperties?: Record<string, any>;
    },
  ) {
    const [widgetName, instanceId] = this._extractWidgetNameId(widgetId);

    const WidgetClass = this._registeredWidgets[widgetName];

    if (!WidgetClass) {
      this.logger.info(`Widget [${widgetId}] is active but not registered`);
      return;
    }

    if (this._widgetInstances[widgetId]) {
      this.logger.info(`Widget [${widgetId}] is already created, do not create again`);
      return;
    }

    const { widgetController } = this.classroomStore.widgetStore;

    if (widgetController) {
      const widget = new (WidgetClass as any)(
        widgetController,
        this.classroomStore,
        this._createUiCapable(),
        getUiConfig(),
        getTheme(),
      ) as FcrUISceneWidget;

      if (instanceId) {
        this._callWidgetSetInstanceId(widget, instanceId);
      }

      const props =
        widgetController?.getWidgetProperties(widget.widgetId) || (defaults?.properties ?? {});

      const userProps =
        widgetController?.getWidgetUserProperties(widget.widgetId) ||
        (defaults?.userProperties ?? {});

      this._callWidgetCreate(widget, props, userProps);
      this.logger.info(
        `Create widget [${instanceId}] with props: ${JSON.stringify(
          props,
        )} userProps: ${JSON.stringify(userProps)}`,
      );

      this._widgetInstances[widgetId] = widget;
      this.logger.info('Current created widgets:', Object.keys(this._widgetInstances));
    } else {
      this.logger.info('Widget controller not ready for creating widget');
    }
  }

  @action.bound
  destroyWidget(widgetId: string) {
    const widget = this._widgetInstances[widgetId];
    if (widget) {
      this.logger.info(`Widget [${widgetId}] is going to be destroyed`);
      this._callWidgetDestroy(widget);
      delete this._widgetInstances[widgetId];
      this.logger.info(`Widget [${widgetId}] is destroyed`);
    }
  }

  setWidgetActive(
    widgetId: string,
    defaults?: {
      properties?: Record<string, any>;
      userProperties?: Record<string, any>;
      trackProperties?: AgoraWidgetTrack;
    },
  ) {
    this.classroomStore.widgetStore.setActive(widgetId, {
      ...defaults?.properties,
      ...defaults?.trackProperties,
    });
  }
  @bound
  setWidgetInactive(widgetId: string) {
    this.classroomStore.widgetStore.setInactive(widgetId);
  }

  private _extractWidgetNameId(widgetId: string) {
    const [widgetName, instanceId] = widgetId.split('-');
    return [widgetName, instanceId];
  }

  @bound
  private _handleWidgetActive(widgetId: string) {
    this.createWidget(widgetId);
  }

  @bound
  private _handleWidgetInactive(widgetId: string) {
    this.destroyWidget(widgetId);
  }

  @bound
  private _handlePropertiesUpdate(widgetId: string, props: unknown) {
    const widget = this._widgetInstances[widgetId];
    if (widget) {
      this._callWidgetPropertiesUpdate(widget, props);
    }
  }

  @bound
  private _handleUserPropertiesUpdate(widgetId: string, userProps: unknown) {
    const widget = this._widgetInstances[widgetId];
    if (widget) {
      this._callWidgetUserPropertiesUpdate(widget, userProps);
    }
  }

  private _callWidgetCreate(widget: FcrUISceneWidget, props: unknown, userProps: unknown) {
    if (widget.onCreate) {
      widget.onCreate(props, userProps);
    }
  }

  private _callWidgetSetInstanceId(widget: FcrUISceneWidget, instanceId: string) {
    if (widget.setInstanceId) {
      widget.setInstanceId(instanceId);
    }
  }

  private _callWidgetPropertiesUpdate(widget: FcrUISceneWidget, props: unknown) {
    if (widget.onPropertiesUpdate) {
      widget.onPropertiesUpdate(props);
    }
  }
  private _callWidgetUserPropertiesUpdate(widget: FcrUISceneWidget, userProps: unknown) {
    if (widget.onUserPropertiesUpdate) {
      widget.onUserPropertiesUpdate(userProps);
    }
  }

  private _callWidgetDestroy(widget: FcrUISceneWidget) {
    if (widget.onDestroy) {
      widget.onDestroy();
    }
  }

  private _callWidgetInstall(widget: FcrUISceneWidget, controller: AgoraWidgetController) {
    if (widget.onInstall) {
      widget.onInstall(controller);
    }
  }

  private _callWidgetUninstall(widget: FcrUISceneWidget, controller: AgoraWidgetController) {
    if (widget.onUninstall) {
      widget.onUninstall(controller);
    }
  }

  private _installWidgets(controller: AgoraWidgetController) {
    Object.values(this._registeredWidgets).forEach((Clz) => {
      this._callWidgetInstall(Object.create(Clz.prototype), controller);
    });
  }

  private _uninstallWidgets(controller: AgoraWidgetController) {
    Object.values(this._registeredWidgets).forEach((Clz) => {
      this._callWidgetUninstall(Object.create(Clz.prototype), controller);
    });
  }

  @bound
  private _handleBecomeActive({
    widgetId,
    defaults,
  }: {
    widgetId: string;
    defaults: {
      properties: any;
      userProperties: any;
      trackProperties: any;
    };
  }) {
    this.createWidget(widgetId, defaults);
  }

  @bound
  private _handleBecomeInactive(widgetId: string) {
    this.destroyWidget(widgetId);
  }

  private _getEnabledWidgets() {
    const { widgets } = getLaunchOptions();

    return widgets || {};
  }

  private _createUiCapable() {
    return {
      addToast: (
        message: string,
        type: 'error' | 'success' | 'warning',
        options?: { persist?: boolean; duration?: number },
      ) => {
        const { persist, duration } = options || {};
        const toastTypeMap = {
          error: 'error' as const,
          success: 'normal' as const,
          warning: 'normal' as const,
        };

        ToastApi.open({
          persist,
          duration,
          toastProps: { type: toastTypeMap[type], content: message },
        });
      },
      addConfirmDialog: (params: AgoraUiCapableConfirmDialogProps) => {
        this.getters.classroomUIStore.layoutUIStore.addDialog(
          'confirm',
          params as unknown as CommonDialogType<ConfirmDialogProps>,
        );
      },
    };
  }

  @bound
  private _handlePollActiveStateChanged(state: boolean) {
    if (this.getters.isStudent && !state) {
      ToastApi.open({
        toastProps: {
          type: 'info',
          content: transI18n('fcr_room_tips_end_poll'),
        },
      });
    }
  }

  onInstall() {
    this._registeredWidgets = this._getEnabledWidgets();

    this._disposers.push(
      computed(() => ({
        controller: this.classroomStore.widgetStore.widgetController,
      })).observe(({ oldValue, newValue }) => {
        const oldController = oldValue?.controller;
        const controller = newValue.controller;

        // destory all widget instances after switched to a new scene
        this.widgetInstanceList.forEach((instance) => {
          this._handleWidgetInactive(instance.widgetId);
        });
        // uninstall all installed widgets
        if (oldController) {
          this._uninstallWidgets(oldController);
          oldController.removeWidgetStateListener(this._stateListener);
          this.getters.boardApi.uninstall();
          this.getters.eduTool.uninstall();
          oldController.removeBroadcastListener({
            messageType: AgoraExtensionWidgetEvent.WidgetBecomeActive,
            onMessage: this._handleBecomeActive,
          });
          oldController.removeBroadcastListener({
            messageType: AgoraExtensionWidgetEvent.WidgetBecomeInactive,
            onMessage: this._handleBecomeInactive,
          });
          oldController.removeBroadcastListener({
            messageType: AgoraExtensionWidgetEvent.PollActiveStateChanged,
            onMessage: this._handlePollActiveStateChanged,
          });
        }
        // install widgets
        if (controller) {
          this.getters.boardApi.install(controller);
          this.getters.eduTool.install(controller);

          this._installWidgets(controller);
          controller.addWidgetStateListener(this._stateListener);
          controller.addBroadcastListener({
            messageType: AgoraExtensionWidgetEvent.WidgetBecomeActive,
            onMessage: this._handleBecomeActive,
          });
          controller.addBroadcastListener({
            messageType: AgoraExtensionWidgetEvent.WidgetBecomeInactive,
            onMessage: this._handleBecomeInactive,
          });
          controller.addBroadcastListener({
            messageType: AgoraExtensionWidgetEvent.PollActiveStateChanged,
            onMessage: this._handlePollActiveStateChanged,
          });
          controller.broadcast(
            AgoraExtensionRoomEvent.BoardSetAnimationOptions,
            getConfig().recordOptions,
          );
        }
      }),
      reaction(
        () => ({
          widgetIds: this.classroomStore.widgetStore.widgetController?.widgetIds,
          isJoingingSubRoom: this.getters.isJoiningSubRoom,
          controller: this.classroomStore.widgetStore.widgetController,
        }),
        ({ controller, isJoingingSubRoom, widgetIds }) => {
          // install widgets
          if (controller && !isJoingingSubRoom && widgetIds) {
            // recovery widget state

            controller.widgetIds.forEach((widgetId) => {
              const state = controller.getWidgetState(widgetId);

              if (state === WidgetState.Active || this._defaultActiveWidgetIds.includes(widgetId)) {
                this._handleWidgetActive(widgetId);
              }
            });
          }
        },
      ),
    );
  }

  onDestroy() {
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
}
