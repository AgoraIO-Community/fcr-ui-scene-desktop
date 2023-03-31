import { FC, ReactNode } from 'react';
import './index.css';
import classnames from 'classnames';
import { SvgIconEnum, SvgImg } from '../svg-img';
import { themeVal } from '@onlineclass/utils/tailwindcss';
const colors = themeVal('colors');
export interface CheckboxProps {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  styleType?: 'brand' | 'white';
  size?: 'medium' | 'small';
}
export const Checkbox: FC<CheckboxProps> = (props) => {
  const { label, onChange, styleType = 'brand', size = 'medium', ...inputProps } = props;
  const cls = classnames('fcr-checkbox', `fcr-checkbox-${styleType}`, {
    'fcr-checkbox-s': size === 'small',
  });

  return (
    <label className={cls}>
      <span className="fcr-checkbox-input-wrapper">
        <input
          {...inputProps}
          onChange={(e) => {
            onChange?.(e.target.checked);
          }}
          type="checkbox"></input>
        <span className="fcr-btn-click-effect fcr-checkbox-inner">
          <SvgImg
            type={SvgIconEnum.FCR_CHECKBOX_CHECK}
            colors={{
              iconPrimary: styleType === 'brand' ? colors['white'] : colors['brand'][6],
            }}
            size={12}></SvgImg>
        </span>
      </span>
      {label && <span className="fcr-checkbox-label">{label}</span>}
    </label>
  );
};
