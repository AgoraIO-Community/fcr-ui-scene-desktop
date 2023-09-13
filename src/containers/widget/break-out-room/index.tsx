import { BreakoutDialog } from '@ui-scene/containers/breakout-room';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
export const BreakoutDialogWrapper = observer(() => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    breakoutUIStore: { breakoutDialogVisible },
  } = useStore();

  return (
    <CSSTransition
      nodeRef={ref}
      in={breakoutDialogVisible}
      timeout={500}
      unmountOnExit
      classNames="fcr-widget-dialog-transition">
      <BreakoutDialog ref={ref}></BreakoutDialog>
    </CSSTransition>
  );
});
