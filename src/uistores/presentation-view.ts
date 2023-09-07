import { action, computed, observable, reaction } from 'mobx';
import { EduUIStoreBase } from './base';
import { Log } from 'agora-rte-sdk';
import { Layout } from './type';
import { EduRoleTypeEnum } from 'agora-edu-core';
export enum ListViewStreamPageSize {
  Normal = 6,
  Compact = 5,
}
@Log.attach({ proxyMethods: false })
export class PresentationUIStore extends EduUIStoreBase {
  @observable boardViewportSize?: { width: number; height: number };
  @observable pageSize = ListViewStreamPageSize.Normal;
  @action.bound
  setPageSize(size: number) {
    this.pageSize = size;
  }
  @observable currentPage = 1;
  @action.bound
  setCurrentPage(page: number) {
    this.currentPage = page;
  }

  @computed get isBoardWidgetActive() {
    return this.getters.isBoardWidgetActive;
  }
  @computed get isBoardWidgetMinimized() {
    return this.getters.isBoardWidgetMinimized;
  }
  @computed get mainViewStream() {
    //观众优先展示屏幕分享
    if (this.getters.screenShareUIStream && !this.getters.isLocalScreenSharing)
      return this.getters.screenShareUIStream;
    //如果有pin，展示pin
    if (this.getters.pinnedUIStream) {
      return this.getters.pinnedUIStream;
    }
    //默认逻辑，如果有老师展示老师，没老师展示学生
    if (this.getters.teacherUIStream) return this.getters.teacherUIStream;
    return this.getters.localCameraStream;
  }

  @computed get totalPage() {
    return Math.ceil(this.cameraUIStreamsSortByRole.length / this.pageSize);
  }
  @computed get showPager() {
    return this.totalPage > 1;
  }

  @computed get listViewStreamsByPage() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const currentPageStreams = this.cameraUIStreamsSortByRole.slice(start, end);
    const needFill =
      this.cameraUIStreamsSortByRole.length > this.pageSize &&
      start + currentPageStreams.length >= this.cameraUIStreamsSortByRole.length;
    let list = [];
    if (needFill) {
      list = this.cameraUIStreamsSortByRole.slice(
        this.cameraUIStreamsSortByRole.length - this.pageSize,
        this.cameraUIStreamsSortByRole.length,
      );
    } else {
      list = currentPageStreams;
    }
    return list.sort(({ role }) => (role === EduRoleTypeEnum.teacher ? -1 : 0));
  }

  @computed get cameraUIStreamsSortByRole() {
    const { cameraUIStreams } = this.getters;
    return cameraUIStreams.slice().sort(({ role }) => (role === EduRoleTypeEnum.teacher ? -1 : 0));
  }

  onDestroy(): void {
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
  onInstall(): void {
    this._disposers.push(
      reaction(
        () => ({
          layout: this.getters.layout,
          viewportBoundaries: this.getters.viewportBoundaries,
        }),
        ({ layout, viewportBoundaries }) => {
          if (layout === Layout.ListOnRight && (viewportBoundaries?.height || 0) <= 820) {
            this.setPageSize(ListViewStreamPageSize.Compact);
          } else {
            this.setPageSize(ListViewStreamPageSize.Normal);
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.totalPage,
        (totalPage) => {
          if (this.currentPage > totalPage) this.setCurrentPage(totalPage <= 0 ? 1 : totalPage);
        },
      ),
    );
  }
}
