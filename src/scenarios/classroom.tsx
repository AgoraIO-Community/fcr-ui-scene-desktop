import { ClassRoomDialogContainer } from '@ui-scene/containers/dialog';
import { ClassroomLoading } from '@ui-scene/containers/loading';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { useEffect } from 'react';

import { ClassroomLayout } from './layout';
import { DeviceSettingsDialog } from '@ui-scene/containers/device-settings/dialog-wrapper';
import { CloudDialog } from '@ui-scene/containers/cloud';

export const Classroom = observer(() => {
  const {
    join,
    layoutUIStore: { classroomViewportClassName },
  } = useStore();
  useEffect(() => {
    join();
  }, []);
  return (
    <div className={classroomViewportClassName}>
      <ClassroomLayout></ClassroomLayout>
      <ClassRoomDialogContainer></ClassRoomDialogContainer>
      <DeviceSettingsDialog></DeviceSettingsDialog>
      <CloudDialog></CloudDialog>
      <ClassroomLoading></ClassroomLoading>
    </div>
  );
});
