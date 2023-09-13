import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useNetwork } from '@ui-scene/utils/hooks/use-network';
import { useI18n } from 'agora-common-libs';

export const NetworkConnection = observer(() => {
  const transI18n = useI18n();
  const network = useNetwork();
  return (
    <div className="fcr-network-connection">
      <div className="fcr-network-connection-title">
        {transI18n('fcr_network_label_network_connection')}
      </div>
      <div className="fcr-network-connection-status" style={{ color: network.color }}>
        {network.text} <img src={network.img}></img>
      </div>
    </div>
  );
});
export const NetworkDetail = observer(() => {
  const {
    statusBarUIStore: { delay, packetLoss },
  } = useStore();
  const transI18n = useI18n();

  return (
    <div className="fcr-network-connection-detail">
      <div className="fcr-network-connection-detail-key">
        <div>{transI18n('fcr_network_label_network_latency')}:</div>
        <div>{transI18n('fcr_network_label_packet_loss_rate')}:</div>
      </div>
      <div className="fcr-network-connection-detail-value">
        <div>
          <span>{delay}</span>
        </div>
        <div>
          <span>
            {packetLoss} <SvgImg size={14} type={SvgIconEnum.FCR_UPORDER}></SvgImg>
          </span>
          <span>
            {packetLoss} <SvgImg size={14} type={SvgIconEnum.FCR_UPORDER}></SvgImg>
          </span>
        </div>
      </div>
    </div>
  );
});
