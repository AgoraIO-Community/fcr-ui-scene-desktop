import { ConfirmDialog } from '@components/dialog';
import { ConfirmDialogProps } from '@components/dialog/confirm-dialog';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { FC, useState } from 'react';

export const ConfirmDialogWrapper: FC<ConfirmDialogProps> = observer((props) => {
  const [visible, setVisible] = useState(true);
  const {
    layoutUIStore: { classroomViewportClassName },
  } = useStore();
  const afterClose = () => {
    props.onClose?.();
  };
  return (
    <ConfirmDialog
      getContainer={() => {
        return document.querySelector(`.${classroomViewportClassName}`) as HTMLElement;
      }}
      maskClosable={false}
      visible={visible}
      {...props}
      closable={props.closable || false}
      afterClose={afterClose}
      onClose={() => {
        setVisible(false);
      }}
      onOk={() => {
        props.onOk?.();
        setVisible(false);
      }}></ConfirmDialog>
  );
});
