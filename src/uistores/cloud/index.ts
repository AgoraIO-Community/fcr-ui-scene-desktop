import { action, computed, observable, reaction, runInAction, when } from 'mobx';
import { EduUIStoreBase } from '../base';
import { SvgIconEnum } from '@components/svg-img';
import {
  AGEduErrorCode,
  CloudDrivePagingOption,
  CloudDriveResource,
  EduErrorCenter,
} from 'agora-edu-core';
import {
  CloudDriveCourseResource,
  CloudDriveH5Resource,
  CloudDriveImageResource,
  CloudDriveLinkResource,
  CloudDriveMediaResource,
} from './struct';
import { Lodash, bound, transI18n } from 'agora-common-libs';
import {
  conversionOption,
  createCloudResource,
  extractFileExt,
  fileExt2ContentType,
} from './helper';
import { MimeTypesKind, UploadItem, supportedTypes } from '../type';
import { CloudDriveResourceInfo } from 'agora-edu-core/lib/stores/domain/common/cloud-drive/type';
import { ToastApi } from '@components/toast';
import { AGErrorWrapper } from 'agora-rte-sdk';
import { getLaunchOptions } from '@ui-scene/utils/launch-options-holder';

export class CloudUIStore extends EduUIStoreBase {
  cloudHelpTips = [
    {
      svgType: SvgIconEnum.FCR_FILE_PPT,
      desc: 'PPT',
      supportType: ['ppt', 'pptx'],
    },
    {
      svgType: SvgIconEnum.FCR_FILE_DOC,
      desc: 'Word',
      supportType: ['docx', 'doc'],
    },
    {
      svgType: SvgIconEnum.FCR_FILE_PDF,
      desc: 'Pdf',
      supportType: ['pdf'],
    },
    {
      svgType: SvgIconEnum.FCR_FILE_VIDEO,
      desc: 'Video',
      supportType: ['mp4'],
    },
    {
      svgType: SvgIconEnum.FCR_FILE_AUDIO,
      desc: 'Audio',
      supportType: ['mp3'],
    },
    {
      svgType: SvgIconEnum.FCR_FILE_PHOTO,
      desc: 'Photo',
      supportType: ['png', 'jpg'],
    },
    {
      svgType: SvgIconEnum.FCR_FILE_ALF,
      desc: 'Sharing courseware',
      supportType: ['alf'],
    },
  ];
  @observable
  searchPublicResourcesKeyword = '';
  @action.bound
  setSearchPublicResourcesKeyword(keyword: string) {
    this.searchPublicResourcesKeyword = keyword;
  }
  @computed
  get publicResources() {
    const keyword = this.searchPublicResourcesKeyword;
    const list = getLaunchOptions().coursewareList || [];
    return list
      .filter((item) => (keyword ? item.resourceName.includes(keyword) : true))
      .map((courseware) => {
        return createCloudResource(courseware);
      });
  }

  @observable cloudDialogVisible = false;
  @action.bound
  setCloudDialogVisible(visible: boolean) {
    this.cloudDialogVisible = visible;
  }
  @observable
  searchPersonalResourcesKeyword = '';
  @action.bound
  setSearchPersonalResourcesKeyword(keyword: string) {
    this.searchPersonalResourcesKeyword = keyword;
  }
  @observable personalResourceUuidByPage: Map<number, string[]> = new Map<number, string[]>();
  pageSize = 10;
  @observable
  currentPersonalResPage = 1;
  @action
  setCurrentPersonalResPage = (num: number) => {
    this.currentPersonalResPage = num;
  };
  @observable
  personalResourcesTotalNum = 0;
  @computed
  get personalResourcesTotalPage() {
    return Math.ceil(this.personalResourcesTotalNum / this.pageSize);
  }
  @computed
  get personalResources() {
    return this.classroomStore.cloudDriveStore.personalResources;
  }
  @computed
  get personalResourcesList() {
    const uuids = this.personalResourceUuidByPage.get(this.currentPersonalResPage) || [];
    const arr = [];
    for (const uuid of uuids) {
      const res = this.personalResources.get(uuid);
      if (res) {
        arr.push(res);
      }
    }
    return arr;
  }
  @computed
  get uploadingProgresses(): (UploadItem & { ext: string })[] {
    const { uploadProgress } = this.classroomStore.cloudDriveStore;
    const arr = [];
    for (const item of uploadProgress.values()) {
      const { resourceName, size, progress, status, resourceUuid, ext } = item;
      const progressValue = Math.floor(progress * 100);
      arr.push({
        iconType: this.fileNameToType(ext),
        fileName: resourceName,
        fileSize: this.formatFileSize(size),
        currentProgress: progressValue,
        resourceUuid,
        status,
        ext,
      });
    }
    return arr;
  }
  fileNameToType(name: string) {
    if (name.match(/ppt|pptx|pptx/i)) {
      return SvgIconEnum.FCR_FILE_PPT;
    }
    if (name.match(/doc|docx/i)) {
      return SvgIconEnum.FCR_FILE_DOC;
    }
    if (name.match(/xls|xlsx/i)) {
      return SvgIconEnum.FCR_FILE_EXCEL;
    }
    if (name.match(/mp4/i)) {
      return SvgIconEnum.FCR_FILE_VIDEO;
    }
    if (name.match(/mp3/i)) {
      return SvgIconEnum.FCR_FILE_AUDIO;
    }
    if (name.match(/gif|png|jpeg|jpg|bmp/i)) {
      return SvgIconEnum.FCR_FILE_PHOTO;
    }
    if (name.match(/pdf/i)) {
      return SvgIconEnum.FCR_FILE_PDF;
    }
    if (name.match(/h5/i)) {
      return SvgIconEnum.FCR_FILE_AH5;
    }
    if (name.match(/alf/i)) {
      return SvgIconEnum.FCR_FILE_ALF;
    }
    return SvgIconEnum.FCR_FILE_NOFORMAT;
  }
  formatFileSize(fileByteSize: number, decimalPoint?: number) {
    const bytes = +fileByteSize;
    if (bytes === 0) return '- -';
    const k = 1000;
    const dm = decimalPoint || 2;
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i];
  }
  @bound
  async fetchPersonalResources(options: CloudDrivePagingOption) {
    try {
      const data = await this.classroomStore.cloudDriveStore.fetchPersonalResources(options);
      const { list = [], total = 0 } = data;
      const resourceList = list.map((data) => createCloudResource(data));
      runInAction(() => {
        const resourceUuids: string[] = [];
        for (let i = 0; i < resourceList.length; i++) {
          const item = resourceList[i];
          resourceUuids.push(item.resourceUuid);
          this.personalResources.set(item.resourceUuid, item);
        }
        this.personalResourcesTotalNum = total;
        this.personalResourceUuidByPage.set(options.pageNo, resourceUuids);
      });

      return data;
    } catch (e) {
      // this.shareUIStore.addGenericErrorDialog(e as AGError);
    }
  }
  @bound
  async updatePersonalResource(
    resourceUuid: string,
    resourceInfo: Pick<CloudDriveResourceInfo, 'resourceName'>,
  ) {
    try {
      await this.classroomStore.cloudDriveStore.updatePersonalResource(resourceUuid, resourceInfo);
    } catch (e) {}
    this.reloadPersonalResources();
  }
  validateFiles(files: File[]) {
    if (!files?.length) {
      return false;
    }

    try {
      for (const file of files) {
        const ext = extractFileExt(file.name)?.toLowerCase();
        if (!ext) {
          EduErrorCenter.shared.handleThrowableError(
            AGEduErrorCode.EDU_ERR_UPLOAD_FAILED_NO_FILE_EXT,
            new Error(`no file ext`),
          );
        }

        if (!supportedTypes.includes(ext)) {
          EduErrorCenter.shared.handleThrowableError(
            AGEduErrorCode.EDU_ERR_INVALID_CLOUD_RESOURCE,
            new Error(`unsupported file type ${ext}`),
          );
        }
      }
    } catch (e) {
      // this.shareUIStore.addGenericErrorDialog(e as AGError);
      return false;
    }

    return true;
  }
  @bound
  async uploadPersonalResource(files: File[]) {
    if (!this.validateFiles(files)) {
      return;
    }

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];

      try {
        const ext = extractFileExt(file.name)?.toLowerCase() || '';

        const resourceUuid = await this.classroomStore.cloudDriveStore.calcResourceUuid(file);
        const contentType = fileExt2ContentType(ext);
        const conversion = conversionOption(ext);

        await this.classroomStore.cloudDriveStore.uploadPersonalResource(
          file,
          resourceUuid,
          ext,
          contentType,
          conversion,
        );
      } catch (e) {
        // this.shareUIStore.addGenericErrorDialog(e as AGError);
      } finally {
        this.reloadPersonalResources();
      }
    }
  }
  @bound
  async addOnlineCourseware({ resourceName, url }: { resourceName: string; url: string }) {
    const resourceUuid = await this.classroomStore.cloudDriveStore.calcResourceUuid(
      `${resourceName}${url}`,
    );
    await this.classroomStore.cloudDriveStore.addPersonalResource(resourceUuid, {
      url,
      resourceName: resourceName + '.alf',
      ext: 'alf',
      size: 0,
    });
  }
  @bound
  @Lodash.debounced(500)
  async reloadPersonalResources() {
    this.fetchPersonalResources({
      pageNo: this.currentPersonalResPage,
      pageSize: this.pageSize,
      resourceName: this.searchPersonalResourcesKeyword,
    });
  }
  @action
  removePersonalResources = async (resourceUuids: string[]) => {
    try {
      await this.classroomStore.cloudDriveStore.removePersonalResources(resourceUuids);
    } catch (e) {
      return;
    }
    const { list = [] } =
      (await this.fetchPersonalResources({
        pageNo: this.currentPersonalResPage,
        pageSize: this.pageSize,
        resourceName: this.searchPersonalResourcesKeyword,
      })) || {};
    if (!list.length && this.currentPersonalResPage > 1) {
      this.setCurrentPersonalResPage(this.currentPersonalResPage - 1);
    }
  };
  @bound
  checkBoardEnabled() {
    return new Promise((resolve, reject) => {
      if (!this.getters.isBoardWidgetActive) {
        this.getters.classroomUIStore.layoutUIStore.addDialog('confirm', {
          title: transI18n('fcr_room_tips_open_whiteboard'),
          content: transI18n('fcr_cloud_tips_open_whiteboard_content'),
          onOk: async () => {
            this.getters.boardApi.enable();
            await when(() => this.getters.boardApi.mounted);
            resolve(null);
          },
          onCancel() {
            reject();
          },
        });
      } else {
        resolve(null);
      }
    });
  }
  @bound
  async openResource(resource: CloudDriveResource) {
    const ext = resource.ext?.toLowerCase?.();

    if (!supportedTypes.includes(ext)) {
      ToastApi.open({
        toastProps: {
          type: 'error',
          content: transI18n('fcr_cloud_unsupported_file_type', { reason1: ext }),
        },
      });
      throw AGErrorWrapper(
        AGEduErrorCode.EDU_ERR_INVALID_CLOUD_RESOURCE,
        Error(`unsupported file type ${ext}`),
      );
    }

    if (resource instanceof CloudDriveCourseResource) {
      const isBoardActive = this.getters.isBoardWidgetActive;
      await this.checkBoardEnabled();
      this.openCourseware(resource, isBoardActive);
    }

    if (resource instanceof CloudDriveMediaResource) {
      let mimeType = '';
      if (resource.type === 'video') {
        mimeType = MimeTypesKind[resource.ext] || 'video/mp4';
      } else if (resource.type === 'audio') {
        mimeType = MimeTypesKind[resource.ext] || 'audio/mpeg';
      }
      await this.checkBoardEnabled();

      this.getters.boardApi.openMediaResourceWindow({
        resourceUuid: resource.resourceUuid,
        resourceUrl: resource.url,
        title: resource.resourceName,
        mimeType,
      });
    }

    if (resource instanceof CloudDriveImageResource) {
      await this.checkBoardEnabled();

      this.getters.boardApi.putImageResource(resource.url);
    }

    if (resource instanceof CloudDriveH5Resource) {
      await this.checkBoardEnabled();

      this.getters.boardApi.openH5ResourceWindow({
        resourceUuid: resource.resourceUuid,
        resourceUrl: resource.url,
        title: resource.resourceName,
      });
    }

    if (resource instanceof CloudDriveLinkResource) {
      const isYoutube = [
        'youtube.com/watch?v=',
        'youtube.com/embed/',
        'youtu.be/',
        'youtube.com/embed/',
      ].some((part) => resource.url.toLowerCase().includes(part));
      if (isYoutube) {
        this.getters.eduTool.openMediaStreamPlayer({
          resourceUuid: resource.resourceUuid,
          url: resource.url,
          title: resource.resourceName,
        });
      } else {
        this.getters.eduTool.openWebview({
          resourceUuid: resource.resourceUuid,
          url: resource.url,
          title: resource.resourceName,
        });
      }
    }
  }
  @bound
  async openCourseware(resource: CloudDriveCourseResource, isBoardActive: boolean) {
    if (resource.status == 'Converting') {
      return;
    }

    if (resource.status == 'Fail') {
      ToastApi.open({
        toastProps: {
          type: 'error',
          content: transI18n('fcr_cloud_fail_to_convert'),
        },
      });
      throw AGErrorWrapper(
        AGEduErrorCode.EDU_ERR_CLOUD_RESOURCE_CONVERSION_FAIL,
        Error('fail to convert resource'),
      );
    }
    const pageList = (resource.scenes || []).map(
      ({ name, contentUrl, previewUrl, width, height }) => {
        return {
          name,
          contentUrl,
          previewUrl,
          contentWidth: width,
          contentHeight: height,
        };
      },
    );

    // prevent showing the annoying red toast when user re-opens the whiteboard by click courseware in clouddrive
    if (!isBoardActive && this.getters.boardApi.isCoursewareOpened(resource.resourceUuid)) {
      return;
    }

    this.getters.boardApi.openMaterialResourceWindow({
      resourceUuid: resource.resourceUuid,
      urlPrefix: resource.prefix || '',
      title: resource.resourceName,
      pageList: pageList,
      taskUuid: resource.taskUuid,
      resourceHasAnimation: resource.hasAnimation,
    });
  }
  onDestroy(): void {}
  onInstall(): void {
    this._disposers.push(
      reaction(
        () => this.personalResourcesList,
        (personalResourcesList) => {
          if (personalResourcesList.length) {
            const hasConverting = personalResourcesList.some(
              (item) => item instanceof CloudDriveCourseResource && item.status === 'Converting',
            );
            if (hasConverting) {
              this.fetchPersonalResources({
                pageNo: this.currentPersonalResPage,
                pageSize: this.pageSize,
                resourceName: this.searchPersonalResourcesKeyword,
              });
            }
          }
        },
        {
          delay: 1500,
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.searchPersonalResourcesKeyword,
        (keyword) => {
          this.setCurrentPersonalResPage(1);
          this.fetchPersonalResources({
            pageNo: this.currentPersonalResPage,
            pageSize: this.pageSize,
            resourceName: keyword,
          });
        },
        {
          delay: 500,
        },
      ),
    );
  }
}
