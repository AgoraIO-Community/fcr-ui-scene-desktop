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
import { CommonDialogType, RttTypeEnum } from './type';
import { v4 as uuidv4 } from 'uuid';
@Log.attach({ proxyMethods: false })
export class WidgetUIStore extends EduUIStoreBase {
  @observable layoutReady = false;
  @action.bound
  setLayoutReady(ready: boolean) {
    this.layoutReady = ready;
  }
  private _defaultActiveWidgetIds = ['easemobIM','rtt',"rttbox"];
  private _registeredWidgets: Record<string, typeof FcrUISceneWidget> = {};
  private _widgetInstanceRenderKeys: Record<string, string> = {};
  @observable
  private _widgetInstances: Record<string, FcrUISceneWidget> = {};
  //widget是否正在使用的列表，当前为rtt新增的变量，后续也可以添加使用
  private _widgetActiveList: string[] = [];
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
  get widgetActiveList() {
    return this._widgetActiveList;
  }

  get widgetInstanceRenderKeys() {
    return this._widgetInstanceRenderKeys;
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
      this._widgetInstanceRenderKeys[widgetId] = uuidv4();
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
      delete this._widgetInstanceRenderKeys[widgetId];
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
  private _handlePropertiesUpdate(widgetId: string, props: unknown,operator:unknown) {
    const widget = this._widgetInstances[widgetId];
    if (widget) {
      this._callWidgetPropertiesUpdate(widget, props,operator);
    }
  }

  @bound
  private _handleUserPropertiesUpdate(widgetId: string, userProps: unknown,operator:unknown) {
    const widget = this._widgetInstances[widgetId];
    if (widget) {
      this._callWidgetUserPropertiesUpdate(widget, userProps,operator);
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

  private _callWidgetPropertiesUpdate(widget: FcrUISceneWidget, props: unknown,operator:any) {
    if (widget.onPropertiesUpdate) {
      widget.onPropertiesUpdate(props,operator);
    }
  }
  private _callWidgetUserPropertiesUpdate(widget: FcrUISceneWidget, userProps: unknown,operator:unknown) {
    if (widget.onUserPropertiesUpdate) {
      widget.onUserPropertiesUpdate(userProps,operator);
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
        type?: 'error' | 'success' | 'warning',
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
          toastProps: { type: type ? toastTypeMap[type] : 'info', content: message },
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

  onInstall() {
    this._registeredWidgets = this._getEnabledWidgets();

    this._disposers.push(
      reaction(
        () => ({controller: this.classroomStore.widgetStore.widgetController}),
        ({ controller }) => {
          if (controller) {
            controller.removeBroadcastListener({
              messageType: AgoraExtensionWidgetEvent.RttShowConversion,
              onMessage: this._handleVisibleRttConversionChange,
            })
            controller.addBroadcastListener({
              messageType: AgoraExtensionWidgetEvent.WidgetActiveStateChange,
              onMessage: this._handleWidgetActiveStateChange,
            })
            controller.addBroadcastListener({
              messageType: AgoraExtensionWidgetEvent.RttSettingShowConversion,
              onMessage: this._handleVisibleRttConversionChange,
            })
          }
        },
      ),
    );
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
          controller.broadcast(
            AgoraExtensionRoomEvent.BoardSetAnimationOptions,
            getConfig().recordOptions,
          );
        }
      }),
      reaction(
        () => ({
          controller: this.classroomStore.widgetStore.widgetController,
          layoutReady: this.layoutReady,
          widgetIds: this.classroomStore.widgetStore.widgetController?.widgetIds,
        }),
        ({ controller, layoutReady, widgetIds }) => {
          // install widgets
          if (controller && layoutReady && widgetIds) {
            // recovery widget state
            widgetIds.forEach((widgetId) => {
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

  @bound
  private _handleVisibleRttConversionChange() {
    this.createWidget(RttTypeEnum.CONVERSION);
    if (this.classroomStore.widgetStore.widgetController) {
      this.classroomStore.widgetStore.widgetController.broadcast(AgoraExtensionWidgetEvent.SetVisible, {
        widgetId: RttTypeEnum.CONVERSION,
        visible: true,
      });
    }
  }
  //widge状态改变监听
  @bound
  @action
  private _handleWidgetActiveStateChange(message:{state:boolean,widgetId:string}) {
    if(message.state){
      this._widgetActiveList.push(message.widgetId)
    }else{
      const index = this._widgetActiveList.indexOf(message.widgetId)
      if(index >= 0){
        this._widgetActiveList.splice(index,1)
      }
    }
  }
  onDestroy() {
    this.classroomStore.widgetStore.widgetController?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.RttShowConversion,
      onMessage: this._handleVisibleRttConversionChange,
    })
    this.classroomStore.widgetStore.widgetController?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.WidgetActiveStateChange,
      onMessage: this._handleWidgetActiveStateChange,
    })
    this.classroomStore.widgetStore.widgetController?.removeBroadcastListener({
      messageType: AgoraExtensionWidgetEvent.RttSettingShowConversion,
      onMessage: this._handleVisibleRttConversionChange,
    })
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
}
