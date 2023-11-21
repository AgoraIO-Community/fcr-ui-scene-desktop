import {
  ConversionOption,
  EduRegion,
  EduRoleTypeEnum,
  EduRoomTypeEnum,
  EduRtcConfig,
  AgoraCloudProxyType,
} from 'agora-edu-core';
import { AGMediaOptions, AgoraLatencyLevel, AGVideoEncoderConfiguration } from 'agora-rte-sdk';
import { FcrMultiThemeMode } from 'agora-common-libs';
import { FcrUISceneWidget } from 'agora-common-libs';
import { IBaseProcessor, IExtension } from 'agora-rte-extension';
import { CloudDriveResourceConvertProgress } from './uistores/cloud/struct';

export type BoardWindowAnimationOptions = {
  minFPS?: number;
  maxFPS?: number;
  resolution?: number;
  autoResolution?: boolean;
  autoFPS?: boolean;
  maxResolutionLevel?: number;
  forceCanvas?: boolean;
};

/**
 * 启动参数
 */
/** @en
 * Options to launch SDK
 */
export type LaunchOptions = {
  /**
   * App ID
   */
  /** @en
   * App ID
   */
  appId: string;
  /**
   * 教育服务区域
   */
  /** @en
   * Edu service region
   */
  region: EduRegion;
  /**
   * 进入教室的令牌
   */
  /** @en
   * API Token used to join the room
   */
  token: string;
  /**
   * 界面语言
   */
  /** @en
   * UI language
   */
  language: Language;
  /**
   * 用户唯一标识
   */
  /** @en
   * User identifier
   */
  userUuid: string;
  /**
   * 用户昵称
   */
  /** @en
   * User nickname
   */
  userName: string;
  /**
   * 用户角色
   */
  /** @en
   * User role
   */
  roleType: EduRoleTypeEnum;
  /**
   * 房间唯一标识
   */
  /** @en
   * Room identifier
   */
  roomUuid: string;
  /**
   * 房间名称
   */
  /** @en
   * Room name
   */
  roomName: string;
  /**
   * 房间类型
   */
  /** @en
   * Room type
   */
  roomType: EduRoomTypeEnum;
  /**
   * 开始时间
   */
  /** @en
   * Start timestamp of the room
   */
  startTime?: number;
  /**
   * 房间时长
   */
  /** @en
   * Time duration of the room
   */
  duration: number;
  /**
   * 设备检测是否启用
   */
  /** @en
   * Wether device pretest is enabled
   */
  devicePretest: boolean;
  /**
   * 公共课件列表
   */
  /** @en
   * Public courseware list listing in the cloud drive
   */
  coursewareList?: CoursewareList;
  /**
   * 用户自定义属性
   */
  /** @en
   * User flexible properties
   */
  userFlexProperties?: { [key: string]: unknown };
  /**
   * RTC 延迟等级
   */
  /** @en
   * RTC latency level
   */
  latencyLevel?: AgoraLatencyLevel;
  /**
   * 录制页面地址
   */
  /** @en
   * Recording page URL
   */
  recordUrl?: string;
  /**
   * 录制重试间隔
   */
  /** @en
   * Time duration to wait before retrying when recording is failed to start
   */
  recordRetryTimeout?: number;
  /**
   * UI 主题
   */
  /** @en
   * UI Theme
   */
  uiMode?: FcrMultiThemeMode;
  /**
   * 分享链接
   */
  /** @en
   * Room share link
   */
  shareUrl?: string;
  /**
   * 虚拟背景图片
   */
  /** @en
   * Virtual background image assets
   */
  virtualBackgroundImages?: string[];
  /**
   * 虚拟背景视频
   */
  /** @en
   * Virtual background video assets
   */
  virtualBackgroundVideos?: string[];
  /**
   * 声网 WebRTC SDK 扩展插件包路径前缀
   */
  /** @en
   * URL prefix of extension binary assets of Agora WebRTC SDK
   */
  webrtcExtensionBaseUrl?: string;
  /**
   * 音视频编解码配置
   */
  /** @en
   * Configurations for video and audio codecs
   */
  mediaOptions?: LaunchMediaOptions;

  /**
   * 使用插件
   */
  /** @en
   * Widgets to use with SDK
   */
  widgets?: Record<string, typeof FcrUISceneWidget>;
  /**
   * 白板录制选项
   */
  /** @en
   * BoardRecordOptions
   */
  recordOptions?: BoardWindowAnimationOptions;

  /**
   * 云代理类型
   */
  /** @en
   * Cloud proxy type
   */
  cloudProxy?: AgoraCloudProxyType;
};

/**
 * 支持的语言
 */
/** @en
 * Supported languages
 */
export type Language = 'en' | 'zh';

/**
 * 课件页信息
 */
/** @en
 * Page info of slides
 */
export type CoursewarePageInfo = {
  /**
   * 预览图
   */
  /** @en
   * URL of the preview image of the page showing at nav bar of a slide window
   */
  preview?: string;
  /**
   * 图片资源链接
   */
  /** @en
   * URL of the page image
   */
  src: string;
  /**
   * 图片资源宽度
   */
  /** @en
   * Width of the page image
   */
  width: number;
  /**
   * 图片资源高度
   */
  /** @en
   * Height of the page image
   */
  height: number;
};

/**
 * 课件信息
 */
/** @en
 * Courseware slide info
 */
export type CoursewareItem = {
  /**
   *
   */
  /**
   *
   */
  resourceName: string;
  resourceUuid: string;
  ext: string;
  url?: string;
  size: number;
  updateTime: number;
  taskUuid?: string;
  taskProgress?: CloudDriveResourceConvertProgress;
  conversion?: ConversionOption;
  initOpen?: boolean;
};

/**
 * 公共课件列表
 */
/** @en
 *
 */
export type CoursewareList = CoursewareItem[];

/**
 * 设备采集编码配置
 */
/** @en
 *
 */
export type ConvertMediaOptionsConfig = EduRtcConfig & {
  defaultLowStreamCameraEncoderConfigurations?: AGVideoEncoderConfiguration;
};

/**
 * 音视频编解码配置
 */
/** @en
 *
 */
export type LaunchMediaOptions = AGMediaOptions & {
  lowStreamCameraEncoderConfiguration?: AGVideoEncoderConfiguration;
};

/**
 * WebRTC 扩展初始化器
 */
/** @en
 *
 */
export type ExtensionInitializer = {
  createInstance: () => IExtension<IBaseProcessor>;
  createProcessor: (extension: IExtension<IBaseProcessor>) => Promise<IBaseProcessor>;
};

/**
 * 音视频处理器初始化器
 */
/** @en
 *
 */
export type ProcessorInitializer<T extends IBaseProcessor> = {
  name: string;
  createProcessor: () => Promise<T>;
};

/**
 * 虚拟背景参数
 */
/** @en
 * Virtual background options
 */
export type VirtualBackgroundOptions = {
  url: string;
  type: 'image' | 'video';
};
/**
 * 美颜参数
 */
/** @en
 * Beauty filter options
 */
export type BeautyFilterOptions = {
  smooth: number;
  brightening: number;
  blush: number;
};

/**
 * 工具函数
 */
/** @en
 *
 */
export { isElectron, isWeb, isProduction } from './utils/check';
