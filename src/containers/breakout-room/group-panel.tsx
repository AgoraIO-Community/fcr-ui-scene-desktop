import { useStore } from '@ui-scene/utils/hooks/use-store';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { FC } from 'react';

export const GroupPanel: FC<{ groupId?: string; onChange: (groupId: string) => void }> = observer(
  ({ groupId, onChange }) => {
    const {
      breakoutUIStore: { groups },
    } = useStore();

    return (
      <div className="fcr-breakout-room__group-panel">
        <ul className="fcr-breakout-room__group-panel-list fcr-breakout-room--scroll">
          {groups.map(({ id, text, children }, index) => {
            const disabled = groupId === id;
            const liCls = classNames({
              'fcr-breakout-room__group-panel-list--disabled': disabled,
            });
            const handleChange = () => {
              if (!disabled) {
                onChange(id);
              }
            };
            return (
              <li key={id} className={liCls} onClick={handleChange}>
                <span>{index + 1}</span>
                <span className="fcr-breakout-room__group-panel-list__name">{text}</span>
                <span>({children.length})</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
