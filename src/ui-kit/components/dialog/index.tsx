import { themeVal } from '@onlineclass/ui-kit/tailwindcss';
import classNames from 'classnames';
import RcDialog from 'rc-dialog';
import './index.css';
import { FC, ReactNode } from 'react';
import { FcrButton } from '../button';
import { SvgIconEnum, SvgImg } from '../svg-img';
const colors = themeVal('colors');

interface FcrDialogProps {
  visible?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  onOk?: () => void;
  closable?: boolean;
  closeIcon?: ReactNode;
  maskClosable?: boolean;
}
export const FcrDialog: FC<FcrDialogProps> = (props) => {
  const { visible, onClose, children, title, closable, footer, closeIcon, maskClosable } = props;
  return (
    <RcDialog
      maskClosable={maskClosable}
      footer={null}
      prefixCls="fcr-dialog"
      animation={'zoom'}
      maskAnimation={'fade'}
      closable={false}
      visible={visible}
      onClose={onClose}>
      {closable && closeIcon ? (
        closeIcon
      ) : (
        <div onClick={onClose} className={classNames('fcr-dialog-close')}>
          <SvgImg
            type={SvgIconEnum.FCR_CLOSE}
            size={18}
            colors={{ iconPrimary: colors['notsb-inverse'] }}></SvgImg>
        </div>
      )}

      <div className={classNames('fcr-dialog-title')}>{title}</div>
      <div className={classNames('fcr-dialog-inner')}>{children}</div>
      <div className={classNames('fcr-dialog-footer')}>
        {footer || (
          <div className={classNames('fcr-dialog-footer-btns')}>
            <FcrButton size="S">Ok</FcrButton>
            <FcrButton size="S">Cancel</FcrButton>
          </div>
        )}
      </div>
    </RcDialog>
  );
};
