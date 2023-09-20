import './preset';
import { render, unmountComponentAtNode } from 'react-dom';
import { ConvertMediaOptionsConfig, LaunchMediaOptions, LaunchOptions } from './type';
import { App } from './app';
import { Logger, changeLanguage, addResourceBundle } from 'agora-common-libs';
import {
  AgoraEduClassroomEvent,
  EduClassroomConfig,
  EduEventCenter,
  EduMediaEncryptionMode,
  EduRegion,
  EduRoleTypeEnum,
} from 'agora-edu-core';
import { initializeBuiltInExtensions } from './utils/rtc-extensions';
import { setLaunchOptions, setConfig, getConfig } from './utils/launch-options-holder';
import { ApiBase } from 'agora-rte-sdk';
import { zhCn } from './resources/translations/zhCn';
import { enUs } from './resources/translations/enUs';

/**
 * Scene SDK
 */
export class FcrUIScene {
  /**
   * 启动入口
   * @param dom 教室挂载节点
   * @param launchOption 教室启动参数
   * @param callbackSuccess 教室启动成功回调
   * @param callbackFailure 教室启动失败回调
   * @param callbackDestroy 教室销毁回调
   * @returns 卸载函数
   */
  /** @en
   * Entry point of FcrUIScene, which is used to create an online classroom app and render at the specified dom.
   * @param dom dom to mount classroom UI
   * @param launchOption options to launch a classroom
   * @param callbackSuccess callback fired when joined the room successfully
   * @param callbackFailure callback fired when failed to join the room
   * @param callbackDestroy callback fired when quitted the room
   * @returns unmount function
   */
  static launch(
    dom: HTMLElement,
    launchOptions: LaunchOptions,
    callbackSuccess?: () => void,
    callbackFailure?: (err: Error) => void,
    callbackDestroy?: (type: number) => void,
  ) {
    const {
      appId,
      userUuid,
      userName,
      roleType,
      roomUuid,
      userFlexProperties,
      token,
      recordUrl,
      latencyLevel,
      region,
      mediaOptions,
      devicePretest,
      roomName,
      roomType,
      startTime,
      duration,
      language,
      recordOptions,
    } = launchOptions;

    Logger.info('[FcrUIScene]launched with options:', launchOptions);

    setLaunchOptions(launchOptions);

    const sessionInfo = {
      userUuid,
      userName,
      role: roleType,
      roomUuid,
      roomName,
      roomType,
      startTime,
      duration,
      flexProperties: userFlexProperties,
      token,
    };
    if (recordOptions) {
      setConfig({
        recordOptions,
      });
    }
    const { virtualBackgroundExtension, beautyEffectExtension, aiDenoiserExtension } =
      initializeBuiltInExtensions();

    const rteRegion = this._convertRegion(region);

    const noDevicePermission = sessionInfo.role === EduRoleTypeEnum.invisible;

    const rtcConfigs = {
      ...this._convertMediaOptions(mediaOptions),
      noDevicePermission,
    };

    const config = new EduClassroomConfig(appId, sessionInfo, recordUrl || '', {
      latencyLevel,
      region: rteRegion,
      rtcConfigs,
      rtcSDKExtensions: [virtualBackgroundExtension, beautyEffectExtension, aiDenoiserExtension],
    });

    const host = getConfig().host as string;
    const ignoreUrlRegionPrefix = !!getConfig().ignoreUrlRegionPrefix;

    if (host) {
      config.host = host;
    }

    config.ignoreUrlRegionPrefix = ignoreUrlRegionPrefix;

    EduClassroomConfig.setConfig(config);

    Logger.info(`[FcrUIScene]classroomConfig`, config);

    changeLanguage(language);

    EduEventCenter.shared.onClassroomEvents((evt, ...args: unknown[]) => {
      if (evt === AgoraEduClassroomEvent.Ready) {
        FcrUIScene._setRecordReady();
      }

      if (evt === AgoraEduClassroomEvent.Ready && typeof callbackSuccess === 'function') {
        callbackSuccess();
      }

      if (evt === AgoraEduClassroomEvent.FailedToJoin && typeof callbackFailure === 'function') {
        callbackFailure(args[0] as Error);
      }

      if (evt === AgoraEduClassroomEvent.Destroyed && typeof callbackDestroy === 'function') {
        callbackDestroy(args[0] as number);
      }
    });

    const startTs = Date.now();
    let isUnmounted = false;

    Promise.all([addResourceBundle('zh', zhCn), addResourceBundle('en', enUs)]).then(() => {
      if (!isUnmounted) {
        render(<App skipDevicePretest={!devicePretest} />, dom, () => {
          Logger.info(`[FcrUIScene]render complete in ${Date.now() - startTs}ms.`);
        });
      } else {
        Logger.info('[FcrUIScene]SDK is unmounted before first render.');
      }
    });
    // return a disposer
    return () => {
      isUnmounted = true;
      unmountComponentAtNode(dom);
      Logger.info(`[FcrUIScene]unmounted.`);
    };
  }

  /**
   * 设置参数
   * @param params
   */
  /** @en
   * Sets parameters for SDK
   * @param params
   */
  static setParameters(params: string) {
    Logger.info(`[FcrUIScene]set parameters`, params);
    const { host, ignoreUrlRegionPrefix, logo, shareUrl, defaultEnableDevice } =
      JSON.parse(params) || {};

    const config = getConfig() || {};

    if (host) {
      config.host = host;
    }
    if (shareUrl) {
      config.shareUrl = shareUrl;
    }
    config.ignoreUrlRegionPrefix = ['dev', 'pre'].some((v) => (host ? host.includes(v) : false));

    if (ignoreUrlRegionPrefix) {
      config.ignoreUrlRegionPrefix = ignoreUrlRegionPrefix;
    }

    if (logo) {
      config.logo = logo;
    }

    if (defaultEnableDevice) {
      config.defaultEnableDevice = defaultEnableDevice;
    }
    setConfig(config);
  }

  private static _convertRegion(region: string): EduRegion {
    switch (region.toUpperCase()) {
      case 'CN':
        return EduRegion.CN;
      case 'AS':
        return EduRegion.AP;
      case 'EU':
        return EduRegion.EU;
      case 'NA':
        return EduRegion.NA;
    }
    return region as EduRegion;
  }

  private static _convertMediaOptions(opts?: LaunchMediaOptions): ConvertMediaOptionsConfig {
    const config: ConvertMediaOptionsConfig = {};
    if (opts) {
      const {
        cameraEncoderConfiguration,
        screenShareEncoderConfiguration,
        encryptionConfig,
        lowStreamCameraEncoderConfiguration,
        channelProfile,
        web,
      } = opts;
      if (cameraEncoderConfiguration) {
        config.defaultCameraEncoderConfigurations = {
          ...cameraEncoderConfiguration,
        };
      }
      if (screenShareEncoderConfiguration) {
        config.defaultScreenEncoderConfigurations = {
          ...screenShareEncoderConfiguration,
        };
      }
      if (encryptionConfig) {
        config.encryption = {
          mode: encryptionConfig.mode as unknown as EduMediaEncryptionMode,
          key: encryptionConfig.key,
        };
      }
      if (lowStreamCameraEncoderConfiguration) {
        config.defaultLowStreamCameraEncoderConfigurations = {
          ...lowStreamCameraEncoderConfiguration,
        };
      }
      if (typeof channelProfile !== 'undefined') {
        config.channelProfile = channelProfile;
      }
      if (web) {
        config.web = web;
      }
    }
    return config;
  }

  static _setRecordReady() {
    const {
      rteEngineConfig: { ignoreUrlRegionPrefix, region },
      sessionInfo: { roomUuid },
      appId,
    } = EduClassroomConfig.shared;
    const pathPrefix = `${
      ignoreUrlRegionPrefix ? '' : '/' + region.toLowerCase()
    }/edu/apps/${appId}`;
    new ApiBase().fetch({
      path: `/v2/rooms/${roomUuid}/records/ready`,
      method: 'PUT',
      pathPrefix,
    });
  }
}

export * from './type';
