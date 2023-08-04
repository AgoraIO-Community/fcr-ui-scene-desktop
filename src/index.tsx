import './preset';
import { render, unmountComponentAtNode } from 'react-dom';
import {
  ConvertMediaOptionsConfig,
  CoursewareList,
  LaunchMediaOptions,
  LaunchOptions,
} from './type';
import { App } from './app';
import { Logger, changeLanguage, addResourceBundle } from 'agora-common-libs';
import {
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
 * Online class SDK
 */
export class AgoraOnlineclassSDK {
  static coursewareList: CoursewareList = [];
  /**
   * 启动入口
   * @param dom
   * @param launchOption
   * @returns
   */
  /** @en
   * Entry point of AgoraOnlineclassSDK, which is used to create an online classroom app and render at the specified dom.
   * @param dom
   * @param launchOption
   * @returns
   */
  static launch(dom: HTMLElement, launchOptions: LaunchOptions) {
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
      listener,
      coursewareList,
      language,
    } = launchOptions;
    if (coursewareList) this.coursewareList = coursewareList;
    Logger.info('[AgoraOnlineclassSDK]launched with options:', launchOptions);

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

    changeLanguage(language);

    listener && EduEventCenter.shared.onClassroomEvents(listener);

    Logger.info(`[AgoraOnlineclassSDK]classroomConfig`, config);

    const startTs = Date.now();
    let isUnmounted = false;

    Promise.all([addResourceBundle('zh', zhCn), addResourceBundle('en', enUs)]).then(() => {
      if (!isUnmounted) {
        render(<App skipDevicePretest={!devicePretest} />, dom, () => {
          Logger.info(`[AgoraOnlineclassSDK]render complete in ${Date.now() - startTs}ms.`);
        });
      } else {
        Logger.info('[AgoraOnlineclassSDK]SDK is unmounted before first render.');
      }
    });
    // return a disposer
    return () => {
      isUnmounted = true;
      unmountComponentAtNode(dom);
      Logger.info(`[AgoraOnlineclassSDK]unmounted.`);
    };
  }

  /**
   * 设置参数
   * @param params
   */
  /** @en
   *
   * @param params
   */
  static setParameters(params: string) {
    Logger.info(`[AgoraOnlineclassSDK]set parameters`, params);
    const { host, ignoreUrlRegionPrefix, logo, shareUrl } = JSON.parse(params) || {};

    const config = getConfig() || {};

    if (host) {
      config.host = host;
    }
    if (shareUrl) {
      config.shareUrl = shareUrl;
    }
    config.ignoreUrlRegionPrefix = ['dev', 'pre'].some((v) => (config.host as string).includes(v));

    if (ignoreUrlRegionPrefix) {
      config.ignoreUrlRegionPrefix = ignoreUrlRegionPrefix;
    }

    if (logo) {
      config.logo = logo;
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
  static setRecordReady() {
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
