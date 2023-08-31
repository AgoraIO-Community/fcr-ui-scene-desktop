import { FcrTheme, FcrUIConfig } from 'agora-common-libs';
import { LaunchOptions } from '..';

type Config = Partial<
  Record<
    | 'host'
    | 'ignoreUrlRegionPrefix'
    | 'logo'
    | 'shareUrl'
    | 'uiConfig'
    | 'theme'
    | 'recordOptions'
    | 'defaultEnableDevice',
    unknown
  >
>;

let _launchOptions: LaunchOptions | null = null;
let _config: Config = {};

export const setLaunchOptions = (launchOptions: LaunchOptions) => {
  _launchOptions = launchOptions;
};

export const getLaunchOptions = () => {
  if (!_launchOptions) {
    throw new Error(
      'you need to call setLaunchOptions to set a launch option before you use getLaunchOptions',
    );
  }

  return _launchOptions;
};

export const setConfig = (config: Config) => {
  _config = { ..._config, ...config };
};

export const getConfig = () => {
  return _config;
};

export const getUiConfig = () => {
  return getConfig().uiConfig as FcrUIConfig;
};

export const getTheme = () => {
  return getConfig().theme as FcrTheme;
};
