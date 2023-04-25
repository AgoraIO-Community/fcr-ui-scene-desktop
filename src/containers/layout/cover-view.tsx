import { ActionBar } from '@onlineclass/containers/action-bar';
import { StatusBar } from '@onlineclass/containers/status-bar';

export const CoverView = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 100,
        pointerEvents: 'none',
      }}>
      <StatusBar></StatusBar>

      <ActionBar></ActionBar>
    </div>
  );
};
