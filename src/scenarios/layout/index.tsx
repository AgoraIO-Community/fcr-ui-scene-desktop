import { AskHelpList } from '@onlineclass/containers/breakout-room/ask-help-list';
import { GroupInfoPanel } from '@onlineclass/containers/breakout-room/group-info-panel';
import { GroupStatusPanel } from '@onlineclass/containers/breakout-room/group-status-panel';
import { CoverView } from '@onlineclass/containers/layout/cover-view';
import { GalleryView } from '@onlineclass/containers/layout/gallery-view';
import { PresentationView } from '@onlineclass/containers/layout/presentation-view';
import { WidgetContainer } from '@onlineclass/containers/widget';
import { Layout } from '@onlineclass/uistores/type';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { useEffect } from 'react';
export const ClassroomLayout = observer(() => {
  const {
    layoutUIStore: { layout, setLayoutReady },
  } = useStore();
  useEffect(() => {
    setLayoutReady(true);
  }, []);
  return (
    <>
      <CoverView></CoverView>
      {layout === Layout.Grid ? <GalleryView></GalleryView> : <PresentationView></PresentationView>}
      <WidgetContainer />
      <GroupInfoPanel />
      <GroupStatusPanel />
      <AskHelpList />
    </>
  );
});
