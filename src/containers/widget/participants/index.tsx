import { ParticipantsDialog } from '@ui-scene/containers/participants/dialog';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

export const ParticipantsDialogWrapper = observer(() => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    participantsUIStore: { participantsDialogVisible },
  } = useStore();
  return (
    <CSSTransition
      nodeRef={ref}
      in={participantsDialogVisible}
      timeout={500}
      unmountOnExit
      classNames="fcr-widget-dialog-transition">
      <ParticipantsDialog ref={ref}></ParticipantsDialog>
    </CSSTransition>
  );
});
