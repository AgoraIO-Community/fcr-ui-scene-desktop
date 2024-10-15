import { SvgIconEnum, SvgImg } from "@components/svg-img"
import { ToolTip } from "@components/tooltip";
import { useStore } from "@ui-scene/utils/hooks/use-store";
import { useI18n } from 'agora-common-libs';
import { observer } from "mobx-react";
import { useZIndex } from '@ui-scene/utils/hooks/use-z-index';
import './index.css'

export const GroupDiscuss = observer(() => {
    const transI18n = useI18n();
    const {
        eduToolApi,
        breakoutUIStore: { studentInvites, breakoutDialogVisible },
    } = useStore();
    const { updateZIndex } = useZIndex('breakout');
    const { breakoutUIStore } = useStore();
    const handleClick = () => {
        if (breakoutDialogVisible) {
            updateZIndex();
            eduToolApi.setMinimizedState({
                minimized: false,
                widgetId: 'breakout',
                minimizedProperties: {
                    minimizedCollapsed: false,
                },
            });
        } else {
            breakoutUIStore.setDialogVisible(true);
        }

    };
    const studentInvitesList = studentInvites.filter((v: { isInvite: boolean; }) => v.isInvite) || []
    return (
        <ToolTip
            trigger="hover"
            content={!studentInvitesList.length ? transI18n('fcr_group_label_breakout_rooms_open') : transI18n('fcr_group_label_breakout_rooms_open_help', {
                reason1: studentInvitesList.length
            })}
            overlayInnerStyle={{
                fontSize: '14px',
                fontWeight: 400,
            }}
        >
            <div className="fcr-action-bar-item-wrapper group" onClick={handleClick}>
                <div className="fcr-action-bar-item">
                    <div className="fcr-action-bar-item-icon">
                        <SvgImg type={SvgIconEnum.FCR_GROUP} size={32}></SvgImg>
                    </div>
                    {studentInvitesList.length > 0 && <span className="fcr-group-bar-item-count">{studentInvitesList.length}</span>}
                    <div className="fcr-action-bar-item-text">{transI18n('fcr_group_label_breakout_rooms')}</div>
                </div>
            </div>
        </ToolTip>

    )
})