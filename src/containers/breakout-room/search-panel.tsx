import { Checkbox } from '@components/checkbox';
import { Input } from '@components/input';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { useI18n } from 'agora-common-libs';
import { observer } from 'mobx-react';
import { FC, useState } from 'react';

export const SearchPanel: FC<{ groupId: string; onChange: (users: string[]) => void }> = observer(
  ({ groupId, onChange }) => {
    const {
      breakoutUIStore: { students, groupDetails },
    } = useStore();
    const transI18n = useI18n();

    const [inputVal, setInputVal] = useState('');

    const list = students.filter(
      ({ userName, groupUuid }) =>
        (groupUuid === groupId || !groupUuid) &&
        userName.toLowerCase().startsWith(inputVal.toLowerCase()),
    );

    const handleChange = (userUuid: string) => {
      return (checked: boolean) => {
        const users = groupDetails.get(groupId)?.users || [];
        if (checked) {
          const newUsers = users.map((user) => user.userUuid).concat(userUuid);
          onChange(newUsers);
        } else {
          const newUsers = users.map((user) => user.userUuid).filter((id) => userUuid !== id);
          onChange(newUsers);
        }
      };
    };

    return (
      <div className="fcr-breakout-room__search">
        <Input
          placeholder={transI18n('fcr_group_search')}
          iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
          value={inputVal}
          onChange={setInputVal}
          size="small"
        />
        {list.length ? (
          <ul className="fcr-breakout-room__search-list fcr-breakout-room--scroll">
            {list.map((item) => (
              <li key={item.userUuid}>
                <Checkbox
                  label={item.userName}
                  checked={item.groupUuid === groupId}
                  onChange={handleChange(item.userUuid)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="fcr-breakout-room__search-placeholder">
            <SvgImg type={SvgIconEnum.FCR_HEAD} size={64} />
            <div className="fcr-breakout-room__search-placeholder-label">
              {transI18n('fcr_group_no_data')}
            </div>
          </div>
        )}
      </div>
    );
  },
);
