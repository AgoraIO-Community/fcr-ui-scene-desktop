import { Layout } from '@ui-scene/uistores/type';
import { useStore } from './use-store';

export const usePinStream = () => {
  const {
    layoutUIStore: { layout, setLayout },
    streamUIStore: { addPin, removePin },
  } = useStore();
  const pin = (streamUuid: string) => {
    if (layout === Layout.Grid) setLayout(Layout.ListOnTop);
    addPin(streamUuid);
  };
  return { addPin: pin, removePin };
};
