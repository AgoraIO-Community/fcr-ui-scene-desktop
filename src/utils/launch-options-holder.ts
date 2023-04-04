import { FcrTheme, FcrUIConfig } from 'agora-common-libs/lib/ui';
import { LaunchOptions } from '..';

type Config = Partial<
  Record<
    | 'host'
    | 'ignoreUrlRegionPrefix'
    | 'logo'
    | 'language'
    | 'shareUrl'
    | 'uiConfig'
    | 'theme'
    | 'logo',
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
  _config = config;
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
