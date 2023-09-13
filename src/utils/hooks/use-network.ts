import { SvgIconEnum } from '@components/svg-img';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { AGNetworkQuality } from 'agora-rte-sdk';
import { useStore } from './use-store';
import { useI18n } from 'agora-common-libs';
import NetworkBadImg from '@ui-scene/containers/status-bar/network/assets/network_bad.png';
import NetworkGoodImg from '@ui-scene/containers/status-bar/network/assets/network_good.png';
import NetworkDownImg from '@ui-scene/containers/status-bar/network/assets/network_down.png';
const colors = themeVal('colors');
const useConnectionStatus = () => {
  const transI18n = useI18n();
  return {
    [AGNetworkQuality.good]: {
      color: colors['green'],
      text: `${transI18n('fcr_network_label_network_quality_excellent')}`,
      img: NetworkGoodImg,
      icon: SvgIconEnum.FCR_V2_SIGNAL_GOOD,
    },

    [AGNetworkQuality.bad]: {
      color: colors['yellow'],
      text: `${transI18n('fcr_network_label_network_quality_bad')}`,
      img: NetworkBadImg,
      icon: SvgIconEnum.FCR_V2_SIGNAL_NORMAL,
    },
    [AGNetworkQuality.down]: {
      color: colors['red.6'],
      text: `${transI18n('fcr_network_label_network_quality_down')}`,
      img: NetworkDownImg,
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
