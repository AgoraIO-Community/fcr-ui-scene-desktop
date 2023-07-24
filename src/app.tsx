import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { Classroom } from './scenarios/classroom';
import { DevicePretest } from './containers/device-pretest';
import { useStore } from './utils/hooks/use-store';
import './index.css';
import { zhCn } from './utils/i18n/zhCn';
import { enUs } from './utils/i18n/enUs';
import { addResourceBundle } from 'agora-common-libs';
export const App = observer(({ skipDevicePretest }: { skipDevicePretest: boolean }) => {
  const { initialize, destroy, initialized } = useStore();
  let { devicePretestFinished } = useStore();

  if (skipDevicePretest) {
    devicePretestFinished = true;
  }

  useEffect(() => {
    addResourceBundle('zh', zhCn);
    addResourceBundle('en', enUs);
    initialize();
    return destroy;
  }, []);

  if (!initialized) {
    return null;
  }

  return (
    <React.Fragment>
      {!devicePretestFinished && <DevicePretest />}
      {devicePretestFinished && <Classroom />}
    </React.Fragment>
  );
});
