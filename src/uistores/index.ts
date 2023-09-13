import { ConvertMediaOptionsConfig } from '@ui-scene/type';
import {
  AGServiceErrorCode,
  EduClassroomConfig,
  EduClassroomStore,
  EduRoomTypeEnum,
  EduStoreFactory,
  LeaveReason,
  Platform,
} from 'agora-edu-core';
import { AGError, AGRtcConnectionType, AgoraRteScene, bound } from 'agora-rte-sdk';
import { observable, action, runInAction } from 'mobx';
import { EduUIStoreBase } from './base';
import { DeviceSettingUIStore } from './device-setting';
import { ActionBarUIStore } from './action-bar';
import { FcrUISceneContext } from './context';
import { Getters } from './getters';
import { LayoutUIStore } from './layout';
import { StatusBarUIStore } from './status-bar';
import { GalleryUIStore } from './gallery-view';
import { StreamUIStore } from './stream';
import { Board } from '../extension/board';
import { WidgetUIStore } from './widget';
import { PresentationUIStore } from './presentation-view';
import { SubscriptionUIStore } from './subscription';
import { ParticipantsUIStore } from './participants';
import { NotiticationUIStore } from './notification';
import { EduTool } from '@ui-scene/extension/edu-tool';
import { CloudUIStore } from './cloud';
import { BreakoutUIStore } from './breakout';
import { transI18n } from 'agora-common-libs';

export class SceneUIStore {
  @observable
  private _installed = false;
  @observable
  private _devicePretestFinished = false;
  readonly getters: Getters;
  readonly classroomStore: EduClassroomStore;
  readonly layoutUIStore: LayoutUIStore;
  readonly statusBarUIStore: StatusBarUIStore;
  readonly deviceSettingUIStore: DeviceSettingUIStore;
  readonly actionBarUIStore: ActionBarUIStore;
  readonly galleryUIStore: GalleryUIStore;
  readonly streamUIStore: StreamUIStore;
  readonly widgetUIStore: WidgetUIStore;
  readonly presentationUIStore: PresentationUIStore;
  readonly subscriptionUIStore: SubscriptionUIStore;
  readonly participantsUIStore: ParticipantsUIStore;
  readonly notiticationUIStore: NotiticationUIStore;
  readonly cloudUIStore: CloudUIStore;
  readonly breakoutUIStore: BreakoutUIStore;

  readonly boardApi = new Board();
  readonly eduToolApi = new EduTool();

  constructor() {
    this.classroomStore = EduStoreFactory.createWithType(EduRoomTypeEnum.RoomSmallClass);
    this.getters = new Getters(this);
    this.layoutUIStore = new LayoutUIStore(this.classroomStore, this.getters);
    this.statusBarUIStore = new StatusBarUIStore(this.classroomStore, this.getters);
    this.deviceSettingUIStore = new DeviceSettingUIStore(this.classroomStore, this.getters);
    this.actionBarUIStore = new ActionBarUIStore(this.classroomStore, this.getters);
    this.galleryUIStore = new GalleryUIStore(this.classroomStore, this.getters);
    this.streamUIStore = new StreamUIStore(this.classroomStore, this.getters);
    this.widgetUIStore = new WidgetUIStore(this.classroomStore, this.getters);
    this.presentationUIStore = new PresentationUIStore(this.classroomStore, this.getters);
    this.subscriptionUIStore = new SubscriptionUIStore(this.classroomStore, this.getters);
    this.participantsUIStore = new ParticipantsUIStore(this.classroomStore, this.getters);
    this.notiticationUIStore = new NotiticationUIStore(this.classroomStore, this.getters);
    this.cloudUIStore = new CloudUIStore(this.classroomStore, this.getters);
    this.breakoutUIStore = new BreakoutUIStore(this.classroomStore, this.getters);
  }

  get initialized() {
    return this._installed;
  }

  get devicePretestFinished() {
    return this._devicePretestFinished;
  }

  @bound
  initialize() {
    if (this._installed) {
      return;
    }
    Object.getOwnPropertyNames(this).forEach((propertyName) => {
      if (propertyName.endsWith('UIStore')) {
        const uiStore = this[propertyName as keyof typeof this];
        if (uiStore instanceof EduUIStoreBase) {
          uiStore.onInstall();
        }
      }
    });

    this.classroomStore.initialize();

    runInAction(() => {
      this._installed = true;
    });
    //@ts-ignore
    window.globalStore = this;
  }

  @action.bound
  setDevicePretestFinished() {
    this._devicePretestFinished = true;
  }
  @bound
  async enableDualStream(fromScene?: AgoraRteScene) {
    try {
      const lowStreamCameraEncoderConfigurations = (
        EduClassroomConfig.shared.rteEngineConfig.rtcConfigs as ConvertMediaOptionsConfig
      )?.defaultLowStreamCameraEncoderConfigurations;

      const enableDualStream = EduClassroomConfig.shared.platform !== Platform.H5;
      await this.classroomStore.mediaStore.enableDualStream(
        enableDualStream,
        AGRtcConnectionType.main,
        fromScene,
      );

      await this.classroomStore.mediaStore.setLowStreamParameter(
        lowStreamCameraEncoderConfigurations || EduClassroomConfig.defaultLowStreamParameter(),
        AGRtcConnectionType.main,
        fromScene,
      );
    } catch (e) {
      this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
        closable: false,
        title: transI18n('fcr_unknown_error_occurred'),
        content: (e as AGError).message,
        okText: transI18n('fcr_room_button_ok'),
        okButtonProps: { styleType: 'danger' },
        cancelButtonVisible: false,
      });
    }
  }
  @bound
  async join() {
    const { joinClassroom, joinRTC } = this.classroomStore.connectionStore;
    try {
      await joinClassroom();
    } catch (e) {
      if (AGError.isOf(e as AGError, AGServiceErrorCode.SERV_CANNOT_JOIN_ROOM)) {
        return this.classroomStore.connectionStore.leaveClassroom(
          LeaveReason.kickOut,
          new Promise((resolve) => {
            this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
              title: transI18n('fcr_user_tips_kick_out_notice'),
              content: transI18n('fcr_user_tips_local_kick_out'),
              closable: false,
              onOk: resolve,
              okText: transI18n('fcr_room_button_ok'),
              okButtonProps: { styleType: 'danger' },
              cancelButtonVisible: false,
            });
          }),
        );
      }

      return this.classroomStore.connectionStore.leaveClassroom(
        LeaveReason.leave,
        new Promise((resolve) => {
          this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
            closable: false,
            title: transI18n('fcr_room_label_join_error'),
            content: (e as AGError).message,
            onOk: resolve,
            okText: transI18n('fcr_room_button_join_error_leave'),
            okButtonProps: { styleType: 'danger' },
            cancelButtonVisible: false,
          });
        }),
      );
    }
    await this.enableDualStream();
    try {
      await joinRTC();
    } catch (e) {
      this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
        closable: false,
        title: transI18n('fcr_unknown_error_occurred'),
        content: (e as AGError).message,
        okText: transI18n('fcr_room_button_ok'),
        okButtonProps: { styleType: 'danger' },
        cancelButtonVisible: false,
      });
    }
  }

  @bound
  destroy() {
    this.classroomStore.destroy();
    Object.getOwnPropertyNames(this).forEach((propertyName) => {
      if (propertyName.endsWith('UIStore')) {
        const uiStore = this[propertyName as keyof typeof this];

        if (uiStore instanceof EduUIStoreBase) {
          uiStore.onDestroy();
        }
      }
    });
    FcrUISceneContext.reset();
  }
}
