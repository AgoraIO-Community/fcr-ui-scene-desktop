import { isInvisible, isWeb } from '@ui-scene/utils/check';
import { builtInExtensions, getProcessorInitializer } from '@ui-scene/utils/rtc-extensions';
import { ClassroomState, DEVICE_DISABLE } from 'agora-edu-core';
import { action, computed, observable, reaction, runInAction } from 'mobx';
import { IAIDenoiserProcessor } from 'agora-extension-ai-denoiser';
import { IVirtualBackgroundProcessor } from 'agora-extension-virtual-background';
import { IBeautyProcessor } from 'agora-extension-beauty-effect';
import { EduUIStoreBase } from './base';
import {
  AgoraRtcLocalVideoCanvas,
  AgoraRteCustomMessage,
  AgoraRteMediaPublishState,
  AgoraRteMediaSourceState,
  bound,
  Log,
} from 'agora-rte-sdk';
import { transI18n } from 'agora-common-libs';
import { BeautyFilterOptions, VirtualBackgroundOptions } from '..';
import { fetchMediaFileByUrl } from '@ui-scene/utils';
import { getConfig, getLaunchOptions } from '@ui-scene/utils/launch-options-holder';
import concat from 'lodash/concat';
import map from 'lodash/map';
import {
  CustomMessageCommandType,
  CustomMessageData,
  CustomMessageDeviceSwitchType,
  CustomMessageDeviceState,
  CustomMessageDeviceType,
  DeviceSwitchDialogId,
} from './type';
import { matchVirtualSoundCardPattern } from '@ui-scene/utils/vsd-pattern';
import { toJS } from 'mobx';

/**
 * 设备设置
 */
/** @en
 *
 */
@Log.attach()
export class DeviceSettingUIStore extends EduUIStoreBase {
  private _defaultBeautyOptions = { smooth: 0.5, brightening: 0.6, blush: 0.1 };
  // for publish tracks
  private _virtualBackgroundProcessor?: IVirtualBackgroundProcessor;
  private _beautyEffectProcessor?: IBeautyProcessor;
  private _aiDenoiserProcessor?: IAIDenoiserProcessor;
  // for preview tracks

  private _virtualBackgroundProcessorForPreview?: IVirtualBackgroundProcessor;
  private _beautyEffectProcessorForPreview?: IBeautyProcessor;
  private _aiDenoiserProcessorForPreview?: IAIDenoiserProcessor;

  private _defaultSystemAudioRecordingDeviceId?: string;
  private _defaultSystemAudioPlaybackDeviceId?: string;

  private _userHasSelectedAudioRecordingDevice = false;
  private _userHasSelectedAudioPlaybackDevice = false;

  @observable deviceSettingDialogVisible = false;
  @action.bound
  setDeviceSettingDialogVisible(visible: boolean) {
    this.deviceSettingDialogVisible = visible;
  }
  @observable
  private _virtualBackgroundOptions?: VirtualBackgroundOptions;
  @observable
  private _beautyOptions?: BeautyFilterOptions;
  @observable
  private _beautyType?: keyof BeautyFilterOptions;
  @observable
  private _cameraDeviceId?: string;
  @observable
  private _audioRecordingDeviceId?: string;
  @observable
  private _audioPlaybackDeviceId?: string;
  @observable
  private _cameraDeviceEnabled = false;
  @observable
  private _audioRecordingDeviceEnabled = false;
  @observable
  private _previewCameraDeviceEnabled = false;
  @observable
  private _previewAudioRecordingDeviceEnabled = false;
  @observable
  private _audioPlaybackDeviceEnabled = true;
  @observable
  private _localMirrorEnabled = false;
  @observable
  private _virtualBackgroundEnabled = false;
  @observable
  private _beautyFilterEnabled = false;
  @observable
  private _aiDenoiserEnabled = false;

  private _userHasEnabledCamera = true;
  private _userHasEnabledAudioRecording = true;

  @computed
  get isAiDenoiserEnabled() {
    return this._aiDenoiserEnabled;
  }
  @computed
  get noCameraDevice() {
    return this.cameraDevicesList.length === 0;
  }

  get cameraDeviceId() {
    return this._cameraDeviceId;
  }
  @computed
  get noAudioRecordingDevice() {
    return this.recordingDevicesList.length === 0;
  }
  get audioRecordingDeviceId() {
    return this._audioRecordingDeviceId;
  }

  get audioPlaybackDeviceId() {
    return this._audioPlaybackDeviceId;
  }

  get isCameraDeviceEnabled() {
    return this._cameraDeviceEnabled;
  }

  get isAudioRecordingDeviceEnabled() {
    return this._audioRecordingDeviceEnabled;
  }
  get isPreviewCameraDeviceEnabled() {
    return this._previewCameraDeviceEnabled;
  }

  get isPreviewAudioRecordingDeviceEnabled() {
    return this._previewAudioRecordingDeviceEnabled;
  }
  get isAudioPlaybackDeviceEnabled() {
    return this._audioPlaybackDeviceEnabled;
  }

  get isLocalMirrorEnabled() {
    return this._localMirrorEnabled;
  }

  get isVirtualBackgroundEnabled() {
    return this._virtualBackgroundEnabled;
  }

  get isBeautyFilterEnabled() {
    return this._beautyFilterEnabled;
  }

  get activeBackgroundUrl() {
    return this._virtualBackgroundOptions?.url;
  }

  get activeBeautyType() {
    return this._beautyType;
  }

  get activeBeautyValue() {
    if (this._beautyOptions && this._beautyType) {
      return this._beautyOptions[this._beautyType];
    }
  }

  get beautySmoothValue() {
    return this._beautyOptions?.smooth;
  }

  get beautyBrighteningValue() {
    return this._beautyOptions?.brightening;
  }

  get beautyBlushValue() {
    return this._beautyOptions?.blush;
  }

  get defaultBeautyOptions() {
    return this._defaultBeautyOptions;
  }

  /**
   * 麦克风测试音量
   * @returns 音量 0 ~ 1
   */
  @computed
  get localRecordingTestVolume(): number {
    return this.isPreviewAudioRecordingDeviceEnabled
      ? this.classroomStore.mediaStore.localPreviewMicAudioVolume
      : 0;
  }

  /**
   * 扬声器测试音量
   * @returns 音量 0 ~ 1
   */
  @computed
  get localPlaybackTestVolume(): number {
    return this.isAudioPlaybackDeviceEnabled
      ? this.classroomStore.mediaStore.localPlaybackTestVolume
      : 0;
  }

  /**
   * 摄像头设备列表
   * @returns
   */
  /** @en
   *
   */
  @computed
  get cameraDevicesList() {
    return this.classroomStore.mediaStore.videoCameraDevices
      .filter(({ deviceid }) => deviceid !== DEVICE_DISABLE)
      .map((item) => ({
        text:
          item.deviceid === DEVICE_DISABLE
            ? transI18n('fcr_device_label_disabled')
            : item.devicename,
        value: item.deviceid,
      }));
  }

  /**
   * 麦克风设备列表
   * @returns
   */
  /** @en
   *
   */
  @computed
  get recordingDevicesList() {
    return this.classroomStore.mediaStore.audioRecordingDevices
      .filter(({ deviceid }) => deviceid !== DEVICE_DISABLE)
      .filter(({ devicename }) => !matchVirtualSoundCardPattern(devicename))
      .slice()
      .sort(({ isDefault }) => {
        if (isDefault) {
          return 1;
        }
        return 0;
      })
      .map((item) => ({
        text:
          item.deviceid === DEVICE_DISABLE
            ? transI18n('fcr_device_label_disabled')
            : item.devicename,
        value: item.deviceid,
      }));
  }

  /**
   * 扬声器设备列表
   * @returns
   */
  /** @en
   *
   */
  @computed
  get playbackDevicesList() {
    const playbackDevicesList = this.classroomStore.mediaStore.audioPlaybackDevices
      .filter(({ deviceid }) => deviceid !== DEVICE_DISABLE)
      .filter(({ devicename }) => !matchVirtualSoundCardPattern(devicename))
      .slice()
      .sort(({ isDefault }) => {
        if (isDefault) {
          return 1;
        }
        return 0;
      })
      .map((item) => ({
        text: item.devicename,
        value: item.deviceid,
      }));
    return playbackDevicesList.length
      ? playbackDevicesList
      : [
          {
            text: transI18n('fcr_device_label_default_speaker'),
            value: 'default',
          },
        ];
  }

  /**
   * 获取视频设备信息
   **/
  /** @en
   * get camera accessors
   */
  @computed
  get cameraAccessors() {
    return {
      classroomState: this.classroomStore.connectionStore.classroomState,
      subRoomState: this.classroomStore.connectionStore.subRoomState,
      cameraDeviceId: this._cameraDeviceId,
      localCameraStream: this.classroomStore.streamStore.streamByStreamUuid.get(
        this.classroomStore.streamStore.localCameraStreamUuid || '',
      ),
    };
  }

  /**
   * 音频设备信息
   **/
  /** @en
   * mic Accessors
   */
  @computed
  get micAccessors() {
    return {
      classroomState: this.classroomStore.connectionStore.classroomState,
      subRoomState: this.classroomStore.connectionStore.subRoomState,
      recordingDeviceId: this._audioRecordingDeviceId,
      localMicStream: this.classroomStore.streamStore.streamByStreamUuid.get(
        this.classroomStore.streamStore.localMicStreamUuid || '',
      ),
    };
  }

  get virtualBackgroundList() {
    const { virtualBackgroundImages, virtualBackgroundVideos } = getLaunchOptions();
    return concat<{ type: 'image' | 'video'; url: string }>(
      map(virtualBackgroundImages, (url) => ({ type: 'image', url })),
      map(virtualBackgroundVideos, (url) => ({ type: 'video', url })),
    );
  }

  /**
   * 开始扬声器测试
   * @param url
   */
  @bound
  startPlaybackDeviceTest(url: string) {
    this.classroomStore.mediaStore.startPlaybackDeviceTest(url);
  }

  /**
   * 停止扬声器测试
   */
  @bound
  stopPlaybackDeviceTest() {
    this.classroomStore.mediaStore.stopPlaybackDeviceTest();
  }

  /**
   * 开始麦克风测试
   */
  @bound
  startRecordingDeviceTest() {
    this.classroomStore.mediaStore.startRecordingDeviceTest(100);
  }

  /**
   * 停止麦克风测试
   */
  @bound
  stopRecordingDeviceTest() {
    this.classroomStore.mediaStore.stopRecordingDeviceTest();
  }

  /**
   *
   * @param options
   */
  /** @en
   *
   * @param options
   */
  @action.bound
  setVirtualBackground(options: VirtualBackgroundOptions) {
    this._virtualBackgroundEnabled = true;
    this._virtualBackgroundOptions = options;
  }

  /**
   *
   * @param type
   */
  /** @en
   *
   * @param type
   */
  @action.bound
  setBeautyType(type: keyof BeautyFilterOptions) {
    this._beautyFilterEnabled = true;
    this._beautyType = type;
  }
  /**
   *
   * @param options
   */
  /** @en
   *
   * @param options
   */
  @action.bound
  setBeautyFilter(options: Partial<BeautyFilterOptions>) {
    this._beautyOptions = {
      smooth: 0,
      brightening: 0,
      blush: 0,
      ...this._beautyOptions,
      ...options,
    };
  }

  @action.bound
  setCameraDevice(deviceId: string) {
    this._cameraDeviceId = deviceId;
    const track = this.classroomStore.mediaStore.mediaControl.createCameraVideoTrack();
    track.setDeviceId(deviceId);
  }

  @bound
  toggleCameraDevice() {
    if (this.isCameraDeviceEnabled) {
      this.enableCamera(false);
    } else {
      this.enableCamera(true);
    }
  }

  @action.bound
  enableCamera(value: boolean) {
    if (value === this._cameraDeviceEnabled) return;
    if (value) {
      if (this.cameraDeviceId) {
        const track = this.classroomStore.mediaStore.mediaControl.createCameraVideoTrack();
        track.setDeviceId(this.cameraDeviceId);
        track.start();
      }
    } else {
      const track = this.classroomStore.mediaStore.mediaControl.createCameraVideoTrack();
      track.stop();
    }
  }
  @bound
  toggleCameraPreview() {
    this._userHasEnabledCamera = !this._userHasEnabledCamera;
    if (this.isPreviewCameraDeviceEnabled) {
      this.stopCameraPreview();
    } else {
      this.startCameraPreview();
    }
  }
  @action.bound
  startCameraPreview() {
    const track = this.classroomStore.mediaStore.mediaControl.createCameraVideoTrack();
    const processors = [];

    if (this._virtualBackgroundProcessorForPreview) {
      processors.push(this._virtualBackgroundProcessorForPreview);
    }
    if (this._beautyEffectProcessorForPreview) {
      processors.push(this._beautyEffectProcessorForPreview);
    }
    track.startPreview(processors);
  }
  @action.bound
  stopCameraPreview() {
    const track = this.classroomStore.mediaStore.mediaControl.createCameraVideoTrack();
    track.stopPreview();
  }
  @action.bound
  setAudioRecordingDevice(deviceId: string) {
    this._audioRecordingDeviceId = deviceId;
    const track = this.classroomStore.mediaStore.mediaControl.createMicrophoneAudioTrack();
    track.setRecordingDevice(deviceId);
  }

  @bound
  setUserHasSelectedAudioRecordingDevice() {
    this._userHasSelectedAudioRecordingDevice = true;
  }

  @bound
  setUserHasSelectedAudioPlaybackDevice() {
    this._userHasSelectedAudioPlaybackDevice = true;
  }

  @bound
  updateAudioRecordingTrack() {
    if (this.audioRecordingDeviceId) {
      const track = this.classroomStore.mediaStore.mediaControl.createMicrophoneAudioTrack();
      track.setRecordingDevice(this.audioRecordingDeviceId);
      track.start();
    }
  }
  @bound
  toggleAudioRecordingDevice() {
    if (this.isAudioRecordingDeviceEnabled) {
      this.enableAudioRecording(false);
    } else {
      this.enableAudioRecording(true);
    }
  }
  @action.bound
  enableAudioRecording(value: boolean) {
    if (value === this._audioRecordingDeviceEnabled) return;
    if (value) {
      this.updateAudioRecordingTrack();
    } else {
      const track = this.classroomStore.mediaStore.mediaControl.createMicrophoneAudioTrack();
      track.stop();
    }
  }
  @bound
  toggleAudioRecordingPreview() {
    this._userHasEnabledAudioRecording = !this._userHasEnabledAudioRecording;
    if (this.isPreviewAudioRecordingDeviceEnabled) {
      this.stopAudioRecordingPreview();
    } else {
      this.startAudioRecordingPreview();
    }
  }
  @action.bound
  startAudioRecordingPreview() {
    const track = this.classroomStore.mediaStore.mediaControl.createMicrophoneAudioTrack();
    const processors = [];
    if (this._aiDenoiserProcessorForPreview) {
      processors.push(this._aiDenoiserProcessorForPreview);
    }
    track.startPreview(processors);
  }
  @action.bound
  stopAudioRecordingPreview() {
    const track = this.classroomStore.mediaStore.mediaControl.createMicrophoneAudioTrack();

    track.stopPreview();
  }
  @action.bound
  setAudioPlaybackDevice(deviceId: string) {
    const { setPlaybackDevice } = this.classroomStore.mediaStore;
    this._audioPlaybackDeviceId = deviceId;
    setPlaybackDevice(deviceId);
  }

  @bound
  toggleAudioPlaybackDevice() {
    if (this._audioPlaybackDeviceEnabled) {
      this.enableAudioPlayback(false);
    } else {
      this.enableAudioPlayback(true);
    }
  }

  @action.bound
  enableAudioPlayback(value: boolean) {
    if (value) {
      if (this.audioPlaybackDeviceId) {
        this.classroomStore.mediaStore.enableLocalPlayback(value);
        this._audioPlaybackDeviceEnabled = true;
      }
    } else {
      this.classroomStore.mediaStore.enableLocalPlayback(value);
      this._audioPlaybackDeviceEnabled = false;
    }
  }

  @action.bound
  toggleLocalMirror() {
    if (this._localMirrorEnabled) {
      this._localMirrorEnabled = false;
    } else {
      this._localMirrorEnabled = true;
    }
  }

  @bound
  setupLocalVideo(dom: HTMLElement, mirror: boolean) {
    this.classroomStore.mediaStore.setupLocalVideo(dom, mirror);
  }
  @bound
  setupLocalVideoPreview(dom: HTMLElement, mirror: boolean) {
    const track = this.classroomStore.mediaStore.mediaControl.createCameraVideoTrack();
    track.setPreviewView(new AgoraRtcLocalVideoCanvas(dom, mirror));
  }
  @bound
  getStream() {
    return this.classroomStore.mediaStore.mediaControl.createCameraVideoTrack();
  }

  @action.bound
  closeVirtualBackground() {
    this._virtualBackgroundEnabled = false;
  }

  @action.bound
  closeBeautyFilter() {
    this._beautyFilterEnabled = false;
  }

  @action.bound
  toggleAiDenoiser() {
    if (this._aiDenoiserEnabled) {
      this._aiDenoiserEnabled = false;
    } else {
      this._aiDenoiserEnabled = true;
    }
  }
  @bound
  private _onReceiveChannelMessage(message: AgoraRteCustomMessage) {
    const data = message.payload as CustomMessageData<CustomMessageDeviceSwitchType>;
    const cmd = data.cmd;
    switch (cmd) {
      case CustomMessageCommandType.deviceSwitchBatch: {
        const deviceSwitchData = data.data;
        if (deviceSwitchData.deviceState === CustomMessageDeviceState.open) {
          if (message.fromUser.userUuid === this.classroomStore.userStore.localUser?.userUuid)
            return;
          if (deviceSwitchData.deviceType === CustomMessageDeviceType.camera) {
            const dialogId = DeviceSwitchDialogId.StartVideo;
            const hasStartVideoDialog =
              this.getters.classroomUIStore.layoutUIStore.isDialogIdExist(dialogId);

            if (!hasStartVideoDialog && !this._cameraDeviceEnabled) {
              this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
                id: dialogId,
                title: transI18n('fcr_user_tips_teacher_start_video_title'),
                content: transI18n('fcr_user_tips_teacher_start_video_content'),
                okText: transI18n('fcr_user_tips_teacher_unmute_ok'),
                cancelText: transI18n('fcr_user_tips_teacher_unmute_cancel'),
                onOk: () => {
                  this.enableCamera(true);
                },
              });
            }
          }
          if (deviceSwitchData.deviceType === CustomMessageDeviceType.mic) {
            const dialogId = DeviceSwitchDialogId.Unmute;
            const hasUnmuteDialog =
              this.getters.classroomUIStore.layoutUIStore.isDialogIdExist(dialogId);
            if (!hasUnmuteDialog && !this._audioRecordingDeviceEnabled) {
              this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
                id: dialogId,
                title: transI18n('fcr_user_tips_teacher_unmute_title'),
                content: transI18n('fcr_user_tips_teacher_unmute_content'),
                okText: transI18n('fcr_user_tips_teacher_unmute_ok'),
                cancelText: transI18n('fcr_user_tips_teacher_unmute_cancel'),
                onOk: () => {
                  this.enableAudioRecording(true);
                },
              });
            }
          }
        }
      }
    }
  }
  @bound
  private _onReceivePeerMessage(message: AgoraRteCustomMessage) {
    const data = message.payload as CustomMessageData<CustomMessageDeviceSwitchType>;
    const cmd = data.cmd;
    switch (cmd) {
      case CustomMessageCommandType.deviceSwitch: {
        const deviceSwitchData = data.data;
        if (deviceSwitchData.deviceState === CustomMessageDeviceState.open) {
          if (message.fromUser.userUuid === this.classroomStore.userStore.localUser?.userUuid)
            return;

          if (deviceSwitchData.deviceType === CustomMessageDeviceType.camera) {
            const dialogId = DeviceSwitchDialogId.StartVideo;
            const hasStartVideoDialog =
              this.getters.classroomUIStore.layoutUIStore.isDialogIdExist(dialogId);

            if (!hasStartVideoDialog && !this._cameraDeviceEnabled) {
              this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
                id: dialogId,
                title: transI18n('fcr_user_tips_teacher_start_video_title'),
                content: transI18n('fcr_user_tips_teacher_start_video_content'),
                okText: transI18n('fcr_user_tips_teacher_unmute_ok'),
                cancelText: transI18n('fcr_user_tips_teacher_unmute_cancel'),
                onOk: () => {
                  this.enableCamera(true);
                },
              });
            }
          }
          if (deviceSwitchData.deviceType === CustomMessageDeviceType.mic) {
            const dialogId = DeviceSwitchDialogId.Unmute;
            const hasUnmuteDialog =
              this.getters.classroomUIStore.layoutUIStore.isDialogIdExist(dialogId);
            if (!hasUnmuteDialog && !this._audioRecordingDeviceEnabled) {
              this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
                id: dialogId,
                title: transI18n('fcr_user_tips_teacher_unmute_title'),
                content: transI18n('fcr_user_tips_teacher_unmute_content'),
                okText: transI18n('fcr_user_tips_teacher_unmute_ok'),
                cancelText: transI18n('fcr_user_tips_teacher_unmute_cancel'),
                onOk: () => {
                  this.enableAudioRecording(true);
                },
              });
            }
          }
        }
      }
    }
  }

  /**
   * @internal
   */
  /** @en
   * @internal
   */
  onInstall(): void {
    // set some default values
    runInAction(() => {
      if (this.virtualBackgroundList.length) {
        this._virtualBackgroundOptions = this.virtualBackgroundList[0];
      }
      this._beautyType = 'smooth';
      this._beautyOptions = { ...this._defaultBeautyOptions };
    });
    this.classroomStore.roomStore.addCustomMessageObserver({
      onReceiveChannelMessage: this._onReceiveChannelMessage,
      onReceivePeerMessage: this._onReceivePeerMessage,
    });
    this._disposers.push(
      reaction(
        () => {
          return this.classroomStore.connectionStore.engine && isWeb() && !isInvisible();
        },
        (processorsRequired) => {
          if (processorsRequired) {
            getProcessorInitializer<IVirtualBackgroundProcessor>(
              builtInExtensions.virtualBackgroundExtension,
            )
              .createProcessor()
              .then((processor) => {
                this.logger.info('VirtualBackgroundProcessor initialized');
                this._virtualBackgroundProcessor = processor;
                this.classroomStore.mediaStore.addCameraProcessors([processor]);
              });

            getProcessorInitializer<IBeautyProcessor>(builtInExtensions.beautyEffectExtension)
              .createProcessor()
              .then((processor) => {
                this.logger.info('BeautyEffectProcessor initialized');
                this._beautyEffectProcessor = processor;
                this.classroomStore.mediaStore.addCameraProcessors([processor]);
              });

            getProcessorInitializer<IAIDenoiserProcessor>(builtInExtensions.aiDenoiserExtension)
              .createProcessor()
              .then((processor) => {
                this.logger.info('AiDenoiserProcessor initialized');
                this._aiDenoiserProcessor = processor;
                this.classroomStore.mediaStore.addMicrophoneProcessors([processor]);
              });
            // for preview tracks
            getProcessorInitializer<IVirtualBackgroundProcessor>(
              builtInExtensions.virtualBackgroundExtension,
            )
              .createProcessor()
              .then((processor) => {
                this.logger.info('VirtualBackgroundProcessor initialized');
                this._virtualBackgroundProcessorForPreview = processor;
                this.classroomStore.mediaStore.addPreviewCameraProcessors([processor]);
              });

            getProcessorInitializer<IBeautyProcessor>(builtInExtensions.beautyEffectExtension)
              .createProcessor()
              .then((processor) => {
                this.logger.info('BeautyEffectProcessor initialized');
                this._beautyEffectProcessorForPreview = processor;
                this.classroomStore.mediaStore.addPreviewCameraProcessors([processor]);
              });

            getProcessorInitializer<IAIDenoiserProcessor>(builtInExtensions.aiDenoiserExtension)
              .createProcessor()
              .then((processor) => {
                this.logger.info('AiDenoiserProcessor initialized');
                this._aiDenoiserProcessorForPreview = processor;
                this.classroomStore.mediaStore.addPreviewMicrophoneProcessors([processor]);
              });
          }
        },
      ),
    );

    // 处理视频设备列表变更
    const videoDisposer = computed(() => this.classroomStore.mediaStore.videoCameraDevices).observe(
      ({ newValue, oldValue }) => {
        const cameraDeviceId = this._cameraDeviceId;

        const _newValue = newValue.filter(({ deviceid }) => {
          return deviceid !== 'DEVICE_DISABLE';
        });

        const _oldValue = oldValue?.filter(({ deviceid }) => {
          return deviceid !== 'DEVICE_DISABLE';
        });
        // if there's a new device plugged in and no devices selected yet, switch to default device
        if (!cameraDeviceId && _newValue.length > (_oldValue?.length ?? 0)) {
          this.logger.info('set to first camera device', toJS(newValue[0]));
          if (newValue[0]) {
            this.setCameraDevice(newValue[0].deviceid);
          }
        } else if (_newValue.length < (_oldValue?.length ?? 0)) {
          const unpluggedDevice = _oldValue?.find((v) => {
            return !_newValue.find((newv) => newv.deviceid === v.deviceid);
          });
          this.logger.info('camera device unplugged', toJS(unpluggedDevice));
          if (unpluggedDevice) {
            if (cameraDeviceId === unpluggedDevice.deviceid) {
              this.enableCamera(false);
            }
          }
        }
      },
    );

    this._disposers.push(videoDisposer);

    // 处理录音设备列表变更
    const audioRecordingDisposer = computed(
      () => this.classroomStore.mediaStore.audioRecordingDevices,
    ).observe(({ newValue, oldValue }) => {
      const recordingDeviceId = this._audioRecordingDeviceId;

      const _newValue = newValue.filter(({ deviceid, devicename }) => {
        return deviceid !== 'DEVICE_DISABLE' && !matchVirtualSoundCardPattern(devicename);
      });

      const _oldValue = oldValue?.filter(({ deviceid, devicename }) => {
        return deviceid !== 'DEVICE_DISABLE' && !matchVirtualSoundCardPattern(devicename);
      });
      // if there's a new device plugged in and no devices selected yet, switch to default device
      if (!recordingDeviceId && _newValue.length > (_oldValue?.length ?? 0)) {
        const defaultDevice = _newValue.find((v) => v.isDefault);
        this.logger.info('set default audio recording device', toJS(defaultDevice));
        if (defaultDevice) {
          this._defaultSystemAudioRecordingDeviceId = defaultDevice.deviceid;
          this.setAudioRecordingDevice(defaultDevice.deviceid);
        }
        // there's a new device plugged in but there's already a device selected, switch to the new one
      } else if (_newValue.length > (_oldValue?.length ?? 0)) {
        const pluggedDevice = _newValue.find((v) => {
          return !_oldValue?.find((old) => old.deviceid === v.deviceid);
        });
        this.logger.info('new audio recording device plugged in', toJS(pluggedDevice));
        if (pluggedDevice && !this._userHasSelectedAudioRecordingDevice) {
          this.setAudioRecordingDevice(pluggedDevice.deviceid);
        }
        // there's a device unplugged, switch to the default device if the default device exists otherwise switch to the first device
      } else if (_newValue.length < (_oldValue?.length ?? 0)) {
        const unpluggedDevice = _oldValue?.find((v) => {
          return !_newValue.find((newv) => newv.deviceid === v.deviceid);
        });
        this.logger.info('audio recording device unplugged', toJS(unpluggedDevice));

        if (unpluggedDevice) {
          if (unpluggedDevice.deviceid === recordingDeviceId) {
            const defaultDevice = _newValue.find(
              (v) => v.isDefault || this._defaultSystemAudioRecordingDeviceId === v.deviceid,
            );

            if (defaultDevice) {
              this.logger.info('switch to the default audio recording device', toJS(defaultDevice));
              this.setAudioRecordingDevice(defaultDevice.deviceid);
            } else if (_newValue.length > 0) {
              this.logger.info('switch to the default audio recording device', toJS(_newValue[0]));
              this.setAudioRecordingDevice(_newValue[0].deviceid);
            }
          }
        }
      }
    });

    this._disposers.push(audioRecordingDisposer);
    // 处理扬声器设备列表变更
    const playbackDisposer = computed(
      () => this.classroomStore.mediaStore.audioPlaybackDevices,
    ).observe(({ newValue, oldValue }) => {
      const audioPlaybackDeviceId = this._audioPlaybackDeviceId;

      const _newValue = newValue.filter(({ deviceid, devicename }) => {
        return deviceid !== 'DEVICE_DISABLE' && !matchVirtualSoundCardPattern(devicename);
      });

      const _oldValue = oldValue?.filter(({ deviceid, devicename }) => {
        return deviceid !== 'DEVICE_DISABLE' && !matchVirtualSoundCardPattern(devicename);
      });
      // if there's a new device plugged in and no devices selected yet, switch to default device
      if (!audioPlaybackDeviceId && _newValue.length > (_oldValue?.length ?? 0)) {
        const defaultDevice = _newValue.find((v) => v.isDefault);
        this.logger.info('set default audio playback device', toJS(defaultDevice));
        if (defaultDevice) {
          this._defaultSystemAudioPlaybackDeviceId = defaultDevice.deviceid;
          this.setAudioPlaybackDevice(defaultDevice.deviceid);
        }
        // there's a new device plugged in but there's already a device selected, switch to the new one
      } else if (_newValue.length > (_oldValue?.length ?? 0)) {
        const pluggedDevice = _newValue.find((v) => {
          return !_oldValue?.find((old) => old.deviceid === v.deviceid);
        });
        this.logger.info('new audio playback device plugged in', toJS(pluggedDevice));
        if (pluggedDevice && !this._userHasSelectedAudioPlaybackDevice) {
          this.setAudioPlaybackDevice(pluggedDevice.deviceid);
        }
        // there's a device unplugged, switch to the default device if the default device exists otherwise switch to the first device
      } else if (_newValue.length < (_oldValue?.length ?? 0)) {
        const unpluggedDevice = _oldValue?.find((v) => {
          return !_newValue.find((newv) => newv.deviceid === v.deviceid);
        });
        this.logger.info('audio playback device unplugged', toJS(unpluggedDevice));

        if (unpluggedDevice) {
          if (unpluggedDevice.deviceid === audioPlaybackDeviceId) {
            const defaultDevice = _newValue.find(
              (v) => v.isDefault || this._defaultSystemAudioPlaybackDeviceId === v.deviceid,
            );

            if (defaultDevice) {
              this.logger.info('switch to the default audio playback device', toJS(defaultDevice));
              this.setAudioPlaybackDevice(defaultDevice.deviceid);
            } else if (_newValue.length > 0) {
              this.logger.info('switch to the default audio playback device', toJS(_newValue[0]));
              this.setAudioPlaybackDevice(_newValue[0].deviceid);
            }
          }
        }
      }
    });

    this._disposers.push(playbackDisposer);
    // 摄像头设备变更
    this._disposers.push(
      computed(() => this.cameraAccessors).observe(({ newValue, oldValue }) => {
        const { cameraDeviceId } = this;
        if (newValue.classroomState === ClassroomState.Idle) {
          // if idle, e.g. pretest
          if (cameraDeviceId) {
            this.logger.info('enableLocalVideo => true in device pretest');
            this.startCameraPreview();
          } else {
            this.logger.info('enableLocalVideo => false in device pretest');
            //if no device selected, disable device
            this.stopCameraPreview();
          }
        }
        if (newValue.classroomState === ClassroomState.Connected) {
          if (!oldValue?.localCameraStream && newValue.localCameraStream) {
            const stream = newValue.localCameraStream;
            if (stream.videoState === AgoraRteMediaPublishState.Published) {
              const enableDefault = !!(getConfig().defaultEnableDevice ?? true);
              const userHasEnabledCamera = this._userHasEnabledCamera;

              if (enableDefault && userHasEnabledCamera) {
                this.enableCamera(true);
              }
            }
          }
        }
      }),
    );
    // 麦克风设备变更
    this._disposers.push(
      computed(() => this.micAccessors).observe(({ newValue, oldValue }) => {
        const { audioRecordingDeviceId } = this;
        if (newValue.classroomState === ClassroomState.Idle) {
          // if idle, e.g. pretest
          if (audioRecordingDeviceId && audioRecordingDeviceId !== DEVICE_DISABLE) {
            this.logger.info('enableLocalAudio => true in device pretest');
            this.startAudioRecordingPreview();
          } else {
            this.logger.info('enableLocalAudio => false in device pretest');
            //if no device selected, disable device
            this.stopAudioRecordingPreview();
          }
        }
        if (newValue.classroomState === ClassroomState.Connected) {
          if (!oldValue?.localMicStream && newValue.localMicStream) {
            const stream = newValue.localMicStream;
            if (stream.audioState === AgoraRteMediaPublishState.Published) {
              const enableDefault = !!(getConfig().defaultEnableDevice ?? true);
              const userHasEnabledAudioRecording = this._userHasEnabledAudioRecording;

              if (enableDefault && userHasEnabledAudioRecording) {
                this.enableAudioRecording(true);
              }
            }
          }
        }
      }),
    );

    // 扬声器设备变更
    this._disposers.push(
      reaction(
        () => this.audioPlaybackDeviceId,
        () => {
          const { audioPlaybackDeviceId } = this;

          if (audioPlaybackDeviceId) {
            const track = this.classroomStore.mediaStore.mediaControl.createMicrophoneAudioTrack();
            this.logger.info('change playback device to', audioPlaybackDeviceId);
            track.setPlaybackDevice(audioPlaybackDeviceId);
          }
        },
      ),
    );

    this._disposers.push(
      reaction(
        () => ({
          enabled: this._virtualBackgroundEnabled,
          options: this._virtualBackgroundOptions,
        }),
        ({ enabled, options }) => {
          this.logger.info('enabled', enabled, 'options', options);
          if (enabled && options) {
            const { type } = options;

            fetchMediaFileByUrl(options).then((data) => {
              this._virtualBackgroundProcessor?.setOptions({
                type: type === 'image' ? 'img' : 'video',
                source: data,
              });
              this._virtualBackgroundProcessorForPreview?.setOptions({
                type: type === 'image' ? 'img' : 'video',
                source: data,
              });
            });

            this._virtualBackgroundProcessor?.enable();
            this._virtualBackgroundProcessorForPreview?.enable();
          } else {
            this._virtualBackgroundProcessor?.disable();
            this._virtualBackgroundProcessorForPreview?.disable();
          }
        },
      ),
      reaction(
        () => ({ enabled: this._beautyFilterEnabled, options: this._beautyOptions }),
        ({ enabled, options }) => {
          this.logger.info('enabled', enabled, 'options', options);
          if (enabled && options) {
            this._beautyEffectProcessor?.setOptions({
              lighteningContrastLevel: 0,
              sharpnessLevel: 0,
              lighteningLevel: options.brightening,
              smoothnessLevel: options.smooth,
              rednessLevel: options.blush,
            });
            this._beautyEffectProcessorForPreview?.setOptions({
              lighteningContrastLevel: 0,
              sharpnessLevel: 0,
              lighteningLevel: options.brightening,
              smoothnessLevel: options.smooth,
              rednessLevel: options.blush,
            });
            this._beautyEffectProcessor?.enable();
            this._beautyEffectProcessorForPreview?.enable();
          } else {
            this._beautyEffectProcessor?.disable();
            this._beautyEffectProcessorForPreview?.disable();
          }
        },
      ),
      reaction(
        () => this._aiDenoiserEnabled,
        (enabled) => {
          this.logger.info('enabled', enabled);
          if (enabled) {
            this._aiDenoiserProcessor?.enable();
            this._aiDenoiserProcessorForPreview?.enable();
          } else {
            this._aiDenoiserProcessor?.disable();
            this._aiDenoiserProcessorForPreview?.enable();
          }
        },
      ),
      reaction(
        () => {
          return {
            localMicTrackState: this.classroomStore.mediaStore.localMicTrackState,
            localCameraTrackState: this.classroomStore.mediaStore.localCameraTrackState,
          };
        },
        ({ localMicTrackState, localCameraTrackState }) => {
          runInAction(() => {
            this._cameraDeviceEnabled = localCameraTrackState === AgoraRteMediaSourceState.started;
            this._audioRecordingDeviceEnabled =
              localMicTrackState === AgoraRteMediaSourceState.started;
          });
        },
      ),
      reaction(
        () => {
          return {
            localPreviewMicTrackState: this.classroomStore.mediaStore.localPreviewMicTrackState,
            localPreviewCameraTrackState:
              this.classroomStore.mediaStore.localPreviewCameraTrackState,
          };
        },
        ({ localPreviewMicTrackState, localPreviewCameraTrackState }) => {
          runInAction(() => {
            this._previewCameraDeviceEnabled =
              localPreviewCameraTrackState === AgoraRteMediaSourceState.started;
            this._previewAudioRecordingDeviceEnabled =
              localPreviewMicTrackState === AgoraRteMediaSourceState.started;
          });
        },
      ),
      // reaction(
      //   () => ({
      //     classroomState: this.classroomStore.connectionStore.classroomState,
      //     audioPlaybackDeviceEnabled: this._audioPlaybackDeviceEnabled,
      //     streamUuids: Array.from(this.classroomStore.streamStore.streamByStreamUuid.keys()),
      //   }),
      //   ({ classroomState, audioPlaybackDeviceEnabled, streamUuids }) => {
      //     if (classroomState === ClassroomState.Connected) {
      //       streamUuids.forEach((streamUuid) => {
      //         this.classroomStore.connectionStore.scene?.setRemoteTrackVolume(
      //           streamUuid,
      //           audioPlaybackDeviceEnabled ? 100 : 0,
      //         );
      //       });
      //     }
      //   },
      // ),
    );
  }

  /**
   * @internal
   */
  /** @en
   * @internal
   */
  onDestroy(): void {
    this.classroomStore.roomStore.removeCustomMessageObserver({
      onReceiveChannelMessage: this._onReceiveChannelMessage,
      onReceivePeerMessage: this._onReceivePeerMessage,
    });
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
}
