import { ClassDialog, ClassDialogProps } from '@components/dialog/class-dialog';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import { FC, useState } from 'react';

export const ClassInfoDialog: FC<ClassDialogProps> = observer((props) => {
  const [visible, setVisible] = useState(true);
  const {
    layoutUIStore: { classroomViewportClassName },
  } = useStore();
  const afterClose = () => {
    props.onClose?.();
  };
  return (
    <ClassDialog
      getContainer={() => {
        return document.querySelector(`.${classroomViewportClassName}`) as HTMLElement;
      }}
      maskClosable={false}
      visible={visible}
      {...props}
      afterClose={afterClose}
      onClose={() => {
        setVisible(false);
      }}></ClassDialog>
  );
});
