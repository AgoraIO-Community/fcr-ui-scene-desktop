import {
  AgoraEduClassroomEvent,
  ConversionOption,
  EduRegion,
  EduRoleTypeEnum,
  EduRoomTypeEnum,
  EduRtcConfig,
} from 'agora-edu-core';
import { AGMediaOptions, AgoraLatencyLevel, AGVideoEncoderConfiguration } from 'agora-rte-sdk';
import { FcrMultiThemeMode } from 'agora-common-libs';
import { AgoraOnlineclassWidget } from 'agora-common-libs';
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
   *
   */
  appId: string;
  /**
   * 区域
   */
  /** @en
   *
   */
  region: EduRegion;
  /**
   * 令牌
   */
  /** @en
   *
   */
  token: string;
  /**
   * 语言
   */
  /** @en
   *
   */
  language: Language;
  /**
   * 用户UUID
   */
  /** @en
   *
   */
  userUuid: string;
  /**
   * 用户昵称
   */
  /** @en
   *
   */
  userName: string;
  /**
   * 房间UUID
   */
  /** @en
   *
   */
  roomUuid: string;
  /**
   * 用户角色
   */
  /** @en
   *
   */
  roleType: EduRoleTypeEnum;
  /**
   * 设备检测是否启用
   */
  /** @en
   *
   */
  devicePretest: boolean;
  /**
   * 公共课件列表
   */
  /** @en
   *
   */
  coursewareList?: CoursewareList;
  /**
   * 用户自定义属性
   */
  /** @en
   *
   */
  userFlexProperties?: { [key: string]: unknown };
  /**
   * 延迟等级
   */
  /** @en
   *
   */
  latencyLevel?: AgoraLatencyLevel;
  /**
   * 录制页面地址
   */
  /** @en
   *
   */
  recordUrl?: string;
  /**
   * 录制重试间隔
   */
  /** @en
   *
   */
  recordRetryTimeout?: number;
  /**
   * UI主题
   */
  /** @en
   *
   */
  uiMode?: FcrMultiThemeMode;
  /**
   * 分享链接
   */
  /** @en
   *
   */
  shareUrl?: string;
  /**
   * 虚拟背景图片
   */
  /** @en
   *
   */
  virtualBackgroundImages?: string[];
  /**
   * 虚拟背景视频
   */
  /** @en
   *
   */
  virtualBackgroundVideos?: string[];
  /**
   * WebRTC 扩展插件包路径前缀
   */
  /** @en
   *
   */
  webrtcExtensionBaseUrl?: string;
  /**
   * 音视频编解码配置
   */
  /** @en
   *
   */
  mediaOptions?: LaunchMediaOptions;

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
   *
   */
  roomType: EduRoomTypeEnum;
  /**
   * 开始时间
   */
  /** @en
   *
   */
  startTime?: number;
  /**
   * 房间时长
   */
  /** @en
   *
   */
  duration: number;

  /**
   * 插件
   */
  /** @en
   * Widgets
   */
  widgets?: Record<string, typeof AgoraOnlineclassWidget>;
  /**
   * 白板录制选项
   */
  /** @en
   * BoardRecordOptions
   */
  recordOptions?: BoardWindowAnimationOptions;

  /**
   * 教室事件回调
   */
  /** @en
   *
   */
  listener?: ListenerCallback; // launch状态
};

export type ListenerCallback = (evt: AgoraEduClassroomEvent, ...args: unknown[]) => void;

/**
 * 支持的语言
 */
/** @en
 *
 */
export type Language = 'en' | 'zh';

/**
 * 课件页信息
 */
/** @en
 *
 */
export type CoursewarePageInfo = {
  /**
   * 预览图
   */
  /** @en
   *
   */
  preview?: string;
  /**
   * 图片资源链接
   */
  /** @en
   *
   */
  src: string;
  /**
   * 图片资源宽度
   */
  /** @en
   *
   */
  width: number;
  /**
   * 图片资源高度
   */
  /** @en
   *
   */
  height: number;
};

/**
 * 课件信息
 */
/** @en
 *
 */
export type CoursewareItem = {
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
