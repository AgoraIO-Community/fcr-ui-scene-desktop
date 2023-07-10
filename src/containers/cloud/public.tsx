import './index.css';
import { Input } from '@components/input';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { Table } from '@components/table';

import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@onlineclass/utils/hooks/use-store';
import dayjs from 'dayjs';
import { Logger } from 'agora-rte-sdk';

export const PublicResource = observer(() => {
  const {
    cloudUIStore: {
      publicResources,
      fileNameToType,
      formatFileSize,
      openResource,
      setSearchPublicResourcesKeyword,
      searchPublicResourcesKeyword,
      setCloudDialogVisible,
    },
  } = useStore();
  return (
    <div className="fcr-cloud-public-tab-content">
      <div className="fcr-cloud-public-tab-search">
        <Input
          value={searchPublicResourcesKeyword}
          onChange={setSearchPublicResourcesKeyword}
          size="small"
          iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
          placeholder="search"></Input>
      </div>
      <div className="fcr-cloud-public-tab-table">
        <Table
          rowKey={'resourceName'}
          scroll={{ y: 335 }}
          columns={[
            {
              key: 'file-name',
              title: <div className="fcr-cloud-public-tab-table-header-filename">File Name</div>,
              dataIndex: 'resourceName',
              align: 'left',

              render: (fileName: string, record) => {
                return (
                  <div
                    className="fcr-cloud-public-tab-table-filename"
                    onClick={async () => {
                      try {
                        await openResource(record);
                        setCloudDialogVisible(false);
                      } catch (error) {
                        Logger.error(error);
                      }
                    }}>
                    <SvgImg size={24} type={fileNameToType(record.ext)}></SvgImg>
                    <span title={fileName}>{fileName}</span>
                  </div>
                );
              },
            },
            {
              key: 'size',
              title: 'Size',
              dataIndex: 'size',
              width: 65,
              align: 'left',
              render: (size: number) => {
                return formatFileSize(size);
              },
            },
            {
              key: 'update-time',
              title: (
                <div className="fcr-cloud-public-tab-table-header-update-time">Updated at</div>
              ),
              dataIndex: 'updateTime',
              width: 130,
              align: 'right',
              render: (time) => {
                return (
                  <div className="fcr-cloud-public-tab-table-update-time">
                    {dayjs(time).format('YYYY-MM-DD HH:mm')}
                  </div>
                );
              },
            },
          ]}
          data={publicResources}></Table>
      </div>
    </div>
  );
});
