import { Button } from '@components/button';
import { Input } from '@components/input';
import { Pagination } from '@components/pagination';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ColumnsType, Table, TableEmpty } from '@components/table';
import { Progress } from '@components/progress';
import { TextArea } from '@components/textarea';
import { observer } from 'mobx-react';
import './index.css';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import dayjs from 'dayjs';
import { supportedTypes } from '@ui-scene/uistores/cloud/helper';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { Checkbox } from '@components/checkbox';
import { CloudDriveResource, CloudDriveResourceUploadStatus } from 'agora-edu-core';
import { ToolTip } from '@components/tooltip';
import { ClickableIcon } from '@components/svg-img/clickable-icon';
import { convertableTypes } from '@ui-scene/uistores/type';
import { CloudDriveCourseResource } from '@ui-scene/uistores/cloud/struct';
import throttle from 'lodash/throttle';
import { themeVal } from '@ui-kit-utils/tailwindcss';
import { Logger } from 'agora-rte-sdk';
import { useI18n } from 'agora-common-libs';

export const PersonalResource = observer(() => {
  const [uploadListVisible, setUploadListVisible] = useState(false);
  const [tableRowHover, setTableRowHover] = useState('');
  const { columns, selectedResources } = usePersonalTableColumns({ tableRowHover });
  const transI18n = useI18n();
  const reloadRef = useRef<HTMLDivElement>(null);
  const {
    classroomStore: {
      cloudDriveStore: { retryUpload },
    },
    cloudUIStore: {
      fileNameToType,
      personalResourcesList,
      fetchPersonalResources,
      currentPersonalResPage,
      pageSize,
      personalResourcesTotalNum,
      personalResourcesTotalPage,
      setCurrentPersonalResPage,
      reloadPersonalResources,
      uploadingProgresses,
      removePersonalResources,
      setSearchPersonalResourcesKeyword,
      searchPersonalResourcesKeyword,
    },
    layoutUIStore: { addDialog },
  } = useStore();
  useEffect(() => {
    fetchPersonalResources({
      pageNo: currentPersonalResPage,
      pageSize,
    });
  }, [currentPersonalResPage]);
  const hasUploadingFiles = uploadingProgresses.some((progress) => {
    return progress.status === CloudDriveResourceUploadStatus.Pending;
  });
  const uploadingFilesNum = uploadingProgresses.filter((progress) => {
    return progress.status === CloudDriveResourceUploadStatus.Pending;
  }).length;
  useEffect(() => {
    uploadingProgresses.length > 0 && hasUploadingFiles && setUploadListVisible(true);
  }, [uploadingProgresses.length, hasUploadingFiles]);

  const noPersonalResources = useMemo(() => {
    return personalResourcesTotalNum === 0;
  }, [personalResourcesTotalNum]);
  const noPersonalResourcesSearchResult = useMemo(() => {
    return personalResourcesList.length === 0;
  }, [personalResourcesTotalNum]);
  const deleteResource = (resourceUuids: string[]) => {
    addDialog('confirm', {
      title: transI18n('fcr_cloud_tips_delete_confirm_title'),
      content: transI18n('fcr_cloud_tips_delete_confirm_content'),
      okButtonProps: {
        styleType: 'danger',
      },
      okText: transI18n('fcr_cloud_tips_delete_confirm_ok_text'),
      onOk: () => {
        removePersonalResources(resourceUuids);
      },
    });
  };
  const reload = () => {
    const aniApi = reloadRef.current?.animate(
      {
        transform: ['rotate(0deg)', 'rotate(360deg)'],
      },
      { duration: 500 },
    );
    aniApi?.play();
    reloadPersonalResources();
  };
  return (
    <div className="fcr-cloud-personal-tab-content">
      <div className="fcr-cloud-personal-tab-search">
        <Input
          value={searchPersonalResourcesKeyword}
          onChange={setSearchPersonalResourcesKeyword}
          size="small"
          iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
          placeholder={transI18n('fcr_cloud_search')}></Input>
      </div>
      <div className="fcr-cloud-personal-tab-table">
        <Table
          emptyText={
            <TableEmpty style={{ paddingTop: 70 }}>
              {noPersonalResources && (
                <div className="fcr-cloud-personal-tab-table-empty">
                  {transI18n('fcr_cloud_tips_upload_private_disk')}
                  <UploadButton></UploadButton>
                </div>
              )}
            </TableEmpty>
          }
          showHeader={!noPersonalResourcesSearchResult}
          onRow={(record) => ({
            onMouseEnter: () => {
              setTableRowHover(record.resourceUuid);
            },
            onMouseLeave: () => {
              setTableRowHover('');
            },
          })}
          rowKey={(record) => record.resourceUuid}
          scroll={{ y: 357 }}
          data={personalResourcesList}
          columns={columns}></Table>
      </div>

      {!noPersonalResources && (
        <div className="fcr-cloud-personal-tab-footer">
          <Pagination
            size="small"
            onChange={setCurrentPersonalResPage}
            current={currentPersonalResPage}
            total={personalResourcesTotalPage}></Pagination>

          {selectedResources.length > 0 ? (
            <Button
              onClick={() => {
                deleteResource(selectedResources);
              }}
              size="XS"
              styleType="danger">
              {transI18n('fcr_cloud_button_delete')}
            </Button>
          ) : (
            <UploadButton></UploadButton>
          )}
        </div>
      )}
      {uploadingProgresses.length > 0 && (
        <div
          className="fcr-cloud-personal-tab-float-btn fcr-cloud-personal-tab-open-upload"
          onClick={() => {
            setUploadListVisible(true);
          }}>
          <SvgImg type={SvgIconEnum.FCR_UPLOADLIST} size={32}></SvgImg>
        </div>
      )}

      <div
        className="fcr-cloud-personal-tab-float-btn fcr-cloud-personal-tab-refresh"
        onClick={reload}>
        <div ref={reloadRef}>
          <SvgImg type={SvgIconEnum.FCR_RESET} size={32}></SvgImg>
        </div>
      </div>

      {
        <CSSTransition
          in={uploadListVisible}
          timeout={500}
          classNames="fcr-cloud-personal-tab-upload-list-transition"
          unmountOnExit>
          <div className="fcr-cloud-personal-tab-upload-list">
            <div className="fcr-cloud-personal-tab-upload-list-header">
              （{uploadingFilesNum}/{uploadingProgresses.length}）
              {transI18n('fcr_cloud_tips_close_during_uploading')}
              <div
                className="fcr-cloud-personal-tab-upload-list-header-collapsed"
                onClick={() => {
                  setUploadListVisible(false);
                }}>
                <SvgImg
                  type={SvgIconEnum.FCR_DOWN}
                  colors={{ iconPrimary: themeVal('colors')['black'] }}
                  size={16}></SvgImg>
              </div>
            </div>

            <div className="fcr-cloud-personal-tab-upload-list-content">
              {uploadingProgresses
                .slice()
                .reverse()
                .map((progress) => {
                  return (
                    <div
                      key={progress.resourceUuid}
                      className="fcr-cloud-personal-tab-upload-list-item">
                      <div className="fcr-cloud-personal-tab-upload-list-item-filename">
                        <SvgImg size={24} type={fileNameToType(progress.ext || '')}></SvgImg>
                        <span>{progress.fileName}</span>
                      </div>
                      <div className="fcr-cloud-personal-tab-upload-list-item-size">
                        {progress.fileSize}
                      </div>
                      <div className="fcr-cloud-personal-tab-upload-list-item-status">
                        {progress.status === CloudDriveResourceUploadStatus.Success && (
                          <div>{transI18n('fcr_cloud_upload_status_done')}</div>
                        )}
                        {progress.status === CloudDriveResourceUploadStatus.Pending && (
                          <Progress percent={progress.currentProgress}></Progress>
                        )}
                        {progress.status === CloudDriveResourceUploadStatus.Failed && (
                          <>
                            <div className="fcr-cloud-personal-tab-upload-list-item-status-failed">
                              {transI18n('fcr_cloud_upload_status_failed')}
                            </div>
                            <Button
                              size="XXS"
                              onClick={() => {
                                retryUpload(progress.resourceUuid);
                              }}>
                              {transI18n('fcr_cloud_button_retry')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </CSSTransition>
      }
    </div>
  );
});
const UploadButton = observer(() => {
  const {
    cloudUIStore: {
      validateFiles,
      uploadPersonalResource,
      addOnlineCourseware,
      reloadPersonalResources,
    },
  } = useStore();
  const [extraPopoverVisible, setExtraPopoverVisible] = useState(false);
  const transI18n = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const handleUpload = async (evt: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(evt.target.files || []);
    if (validateFiles(files)) {
      const filesArr = Array.from(files);
      uploadPersonalResource(filesArr);
    }
  };
  const handleOnlineCoursewareUpload = throttle(
    async (data: { coursewareLink: string; coursewareName: string }) => {
      const { coursewareLink, coursewareName } = data;
      await addOnlineCourseware({ resourceName: coursewareName, url: coursewareLink });
      reloadPersonalResources();
      setExtraPopoverVisible(false);
    },
    2000,
  );
  return (
    <>
      <input
        ref={fileRef}
        id="upload-image"
        accept={supportedTypes.map((item) => '.' + item).join(',')}
        onChange={handleUpload}
        multiple
        type="file"
        style={{ display: 'none' }}
      />
      <Button
        onClick={() => {
          fileRef.current?.click();
        }}
        size="XS"
        preIcon={SvgIconEnum.FCR_FILE}
        extra={{
          visible: extraPopoverVisible,
          onVisibleChange: (visible) => {
            visible && setExtraPopoverVisible(visible);
          },
          trigger: 'click',

          content: (
            <OnlineCoursewareUploadContent
              onSubmit={handleOnlineCoursewareUpload}
              onClose={() => {
                setExtraPopoverVisible(false);
              }}></OnlineCoursewareUploadContent>
          ),
          overlayOffset: 15,
          overlayInnerStyle: { width: 270 },
        }}>
        {transI18n('fcr_online_courseware_button_upload')}
      </Button>
    </>
  );
});

const OnlineCoursewareUploadContent = observer(
  ({
    onClose,
    onSubmit,
  }: {
    onClose: () => void;
    onSubmit: (data: { coursewareLink: string; coursewareName: string }) => void;
  }) => {
    const [coursewareLink, setCoursewareLink] = useState('');
    const [coursewareName, setCoursewareName] = useState('');
    const transI18n = useI18n();
    return (
      <div
        className="fcr-cloud-personal-tab-footer-upload"
        onClick={(e) => {
          e.stopPropagation();
        }}>
        <div onClick={onClose} className="fcr-cloud-personal-tab-footer-upload-close">
          <SvgImg type={SvgIconEnum.FCR_CLOSE} size={10}></SvgImg>
        </div>
        <div className="fcr-cloud-personal-tab-footer-upload-title">
          {transI18n('fcr_online_courseware_button_upload_online_file')}
        </div>
        <div className="fcr-cloud-personal-tab-footer-upload-item-wrapper">
          <div className="fcr-cloud-personal-tab-footer-upload-item">
            <div>{transI18n('fcr_online_courseware_label_link')}</div>
            <TextArea
              value={coursewareLink}
              onChange={setCoursewareLink}
              placeholder={transI18n('fcr_online_courseware_label_link')}></TextArea>
          </div>

          <div className="fcr-cloud-personal-tab-footer-upload-item">
            <div>{transI18n('fcr_online_courseware_label_file_name')}</div>
            <Input
              shape="rounded"
              value={coursewareName}
              onChange={setCoursewareName}
              placeholder={transI18n('fcr_online_courseware_label_file_name')}></Input>
          </div>
        </div>

        <div className="fcr-cloud-personal-tab-footer-upload-actions">
          <Button onClick={onClose} size="XS" styleType="gray" shape="rounded">
            {transI18n('fcr_online_courseware_button_close')}
          </Button>
          <Button
            disabled={!coursewareLink || !coursewareName}
            onClick={() => {
              onSubmit({
                coursewareLink,
                coursewareName,
              });
            }}
            size="XS"
            shape="rounded">
            {transI18n('fcr_online_courseware_button_upload')}
          </Button>
        </div>
      </div>
    );
  },
);

const usePersonalTableColumns = ({ tableRowHover }: { tableRowHover: string }) => {
  const {
    cloudUIStore: {
      formatFileSize,
      personalResourcesList,
      personalResourcesTotalNum,
      removePersonalResources,
      updatePersonalResource,
      openResource,
      setCloudDialogVisible,
    },
    layoutUIStore: { addDialog },
  } = useStore();
  const [renameResource, setRenameResource] = useState<string>('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const transI18n = useI18n();
  const selectedAll = useMemo(() => {
    return (
      selectedResources.length > 0 && selectedResources.length === personalResourcesList.length
    );
  }, [selectedResources, personalResourcesList]);
  const selectIndeterminate = useMemo(() => {
    return selectedResources.length > 0 && !selectedAll;
  }, [selectedResources, selectedAll]);
  const deleteResource = (resourceUuid: string) => {
    addDialog('confirm', {
      title: transI18n('fcr_cloud_tips_delete_confirm_title'),
      content: transI18n('fcr_cloud_tips_delete_confirm_content'),
      okButtonProps: {
        styleType: 'danger',
      },
      okText: transI18n('fcr_cloud_tips_delete_confirm_ok_text'),
      onOk: () => {
        removePersonalResources([resourceUuid]);
      },
    });
  };
  const columns: ColumnsType<CloudDriveResource> = [
    {
      key: 'file-name',
      title: (
        <div className="fcr-cloud-personal-tab-table-header-filename">
          <Checkbox
            styleType="white"
            indeterminate={selectIndeterminate}
            checked={selectedAll}
            onChange={(checked) => {
              if (checked) {
                setSelectedResources(personalResourcesList.map((item) => item.resourceUuid));
              } else {
                setSelectedResources([]);
              }
            }}
            size="small"></Checkbox>
          <span>
            {' '}
            {transI18n('fcr_cloud_file_name')} ({personalResourcesTotalNum})
          </span>
        </div>
      ),
      align: 'left',

      render: (_, record) => {
        const { resourceUuid, resourceName, ext } = record;
        const checked = selectedResources.includes(resourceUuid);
        const hovered = tableRowHover === resourceUuid;
        const renaming = renameResource === resourceUuid;
        const onCheckedChanged = (checed: boolean) => {
          if (checed) {
            setSelectedResources([...selectedResources, resourceUuid]);
          } else {
            setSelectedResources(selectedResources.filter((item) => item !== resourceUuid));
          }
        };
        const onRenameCancel = () => {
          setRenameResource('');
        };
        const onRename = async (name: string) => {
          await updatePersonalResource(resourceUuid, {
            resourceName: `${name}.${ext}`,
          });
          setRenameResource('');
        };
        return (
          <PersonalTableFilenameRow
            onClick={async () => {
              try {
                await openResource(record);
                setCloudDialogVisible(false);
              } catch (error) {
                Logger.error(error);
              }
            }}
            resourceName={resourceName}
            ext={ext}
            onRename={onRename}
            onRenameCancel={onRenameCancel}
            onCheckedChanged={onCheckedChanged}
            hovered={hovered}
            renaming={renaming}
            checked={checked}></PersonalTableFilenameRow>
        );
      },
    },
    {
      key: 'size',
      title: transI18n('fcr_cloud_size'),
      dataIndex: 'resource.size',
      width: 65,
      align: 'left',
      render: (_, record) => {
        const { size, resourceUuid } = record;
        const hovered = tableRowHover === resourceUuid;
        const renaming = renameResource === resourceUuid;

        return renaming ? null : hovered ? (
          <div className="fcr-cloud-personal-tab-table-row-actions">
            <ToolTip content={transI18n('fcr_cloud_button_tooltip_delete')} placement="bottom">
              <Button
                onClick={() => {
                  deleteResource(resourceUuid);
                }}
                type="secondary"
                size="XXS"
                shape="circle"
                styleType="danger"
                preIcon={SvgIconEnum.FCR_DELETE3}></Button>
            </ToolTip>
            <ToolTip content={transI18n('fcr_cloud_button_tooltip_rename')} placement="bottom">
              <Button
                onClick={() => {
                  setRenameResource(record.resourceUuid);
                }}
                type="secondary"
                size="XXS"
                shape="circle"
                preIcon={SvgIconEnum.FCR_RENAME}></Button>
            </ToolTip>
          </div>
        ) : (
          formatFileSize(size)
        );
      },
    },
    {
      key: 'update-time',
      title: (
        <div className="fcr-cloud-personal-tab-table-header-update-time">
          {transI18n('fcr_cloud_upload_at')}
        </div>
      ),
      dataIndex: 'resource.updateTime',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const { updateTime, resourceUuid } = record;
        const hovered = tableRowHover === resourceUuid;
        const renaming = renameResource === resourceUuid;
        const needConvert = convertableTypes.includes(record.ext);
        const isConverting = needConvert
          ? (record as CloudDriveCourseResource).status === 'Converting'
          : false;
        return renaming || hovered ? null : isConverting ? (
          <div className="fcr-cloud-personal-tab-table-convert-progress">
            <SvgImg type={SvgIconEnum.FCR_LOADING} size={16}></SvgImg>
            {transI18n('fcr_cloud_button_label_converting')} &nbsp;
            {(record as CloudDriveCourseResource).convertedPercentage}%
          </div>
        ) : (
          <div className="fcr-cloud-personal-tab-table-update-time">
            {dayjs(updateTime).format('YYYY-MM-DD HH:mm')}
          </div>
        );
      },
    },
  ];
  return {
    columns,
    selectedResources,
  };
};
const PersonalTableFilenameRow = observer(
  ({
    checked,
    hovered,
    renaming,
    resourceName,
    ext,
    onCheckedChanged,
    onRenameCancel,
    onRename,
    onClick,
  }: {
    checked: boolean;
    hovered: boolean;
    renaming: boolean;
    resourceName: string;
    ext: string;
    onCheckedChanged?: (checked: boolean) => void;
    onRenameCancel?: () => void;
    onRename?: (name: string) => void;
    onClick?: () => void;
  }) => {
    const {
      cloudUIStore: { fileNameToType },
    } = useStore();

    const showCheckbox = hovered || checked;
    const [fileName, setFileName] = useState('');
    useEffect(() => {
      setFileName(resourceName.split(`.${ext}`)[0]);
    }, [renaming]);
    return (
      <div className="fcr-cloud-personal-tab-table-filename">
        <Checkbox
          styleType="white"
          style={{ visibility: showCheckbox ? 'visible' : 'hidden' }}
          checked={checked}
          onChange={onCheckedChanged}
          size="small"></Checkbox>

        <SvgImg size={24} type={fileNameToType(ext)}></SvgImg>
        {renaming ? (
          <div className="fcr-cloud-personal-tab-table-row-rename">
            <Input
              shape="rounded"
              style={{ width: 231 }}
              allowClear={false}
              value={fileName}
              onChange={setFileName}
              size="mini"></Input>
            <ClickableIcon
              size="mini"
              onClick={() => {
                onRename?.(fileName);
              }}
              icon={SvgIconEnum.FCR_CHOOSEIT}></ClickableIcon>
            <ClickableIcon
              onClick={onRenameCancel}
              size="mini"
              icon={SvgIconEnum.FCR_WRONG}></ClickableIcon>
          </div>
        ) : (
          <span onClick={onClick} title={resourceName}>
            {resourceName}
          </span>
        )}
      </div>
    );
  },
);
