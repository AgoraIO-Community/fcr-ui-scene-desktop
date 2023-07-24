import { SvgIconEnum } from '@components/svg-img';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { AGNetworkQuality } from 'agora-rte-sdk';
import { useStore } from './use-store';
import { useI18n } from 'agora-common-libs';

const colors = themeVal('colors');
const useConnectionStatus = () => {
  const transI18n = useI18n();
  return {
    [AGNetworkQuality.good]: {
      color: colors['green'],
      text: `${transI18n('fcr_network_label_network_quality_excellent')} 👍`,
      icon: SvgIconEnum.FCR_V2_SIGNAL_GOOD,
    },

    [AGNetworkQuality.bad]: {
      color: colors['yellow'],
      text: `${transI18n('fcr_network_label_network_quality_bad')} 💪`,
      icon: SvgIconEnum.FCR_V2_SIGNAL_NORMAL,
    },
    [AGNetworkQuality.down]: {
      color: colors['red.6'],
      text: `${transI18n('fcr_network_label_network_quality_down')} 😭`,
      icon: SvgIconEnum.FCR_V2_SIGNAL_BAD,
    },
  };
};
export const useNetwork = () => {
  const {
    statusBarUIStore: { networkQuality },
  } = useStore();
  const connectionStatus = useConnectionStatus();
  //@ts-ignore
  const currentStatus = connectionStatus[networkQuality];
  return currentStatus;
};
