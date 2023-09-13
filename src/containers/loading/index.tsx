import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import loadingGif from './assets/loading.gif';
import './index.css';
export const ClassroomLoading = observer(() => {
  const {
    layoutUIStore: { showLoading },
  } = useStore();

  return showLoading ? (
    <div className="fcr-classroom-loading">
      <div className="fcr-classroom-loading-img-wrap">
        <img src={loadingGif} />
      </div>
    </div>
  ) : null;
});
