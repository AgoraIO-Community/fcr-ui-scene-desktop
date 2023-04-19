import { action, computed, observable, reaction } from 'mobx';
import { EduUIStoreBase } from './base';
import { EduStreamUI } from '@onlineclass/utils/stream/struct';
import { AgoraRteEventType, bound, Lodash, Log } from 'agora-rte-sdk';
import debounce from 'lodash/debounce';
@Log.attach({ proxyMethods: false })
export class PresentationUIStore extends EduUIStoreBase {
  private _boardViewportClassName = 'fcr-layout-board-viewport';
  @observable boardViewportSize?: { width: number; height: number };
  @observable isMainViewStreamPinned = false;
  @observable mainViewStreamUuid: string | null = null;
  @observable showListView = true;
  pageSize = 6;
  @observable currentPage = 1;
  @action.bound
  setCurrentPage(page: number) {
    this.currentPage = page;
  }
  @action.bound
  toggleShowListView() {
    this.showListView = !this.showListView;
  }
  @action.bound
  pinStream(streamUuid: string) {
    this.setMainViewStream(streamUuid);

    this.isMainViewStreamPinned = true;
  }
  @action.bound
  removePinnedStream() {
    this.isMainViewStreamPinned = false;
  }
  @computed get pinnedUserUuid() {
    return this.isMainViewStreamPinned && this.mainViewStream?.fromUser.userUuid;
  }
  @computed get isBoardWidgetActive() {
    return this.getters.isBoardWidgetActive;
  }
  @computed get mainViewStream() {
    if (!this.mainViewStreamUuid) return null;
    const stream = this.classroomStore.streamStore.streamByStreamUuid.get(this.mainViewStreamUuid);
    if (stream) return new EduStreamUI(stream);
    return null;
  }

  @computed get totalPage() {
    return Math.ceil(this.getters.cameraUIStreams.length / this.pageSize);
  }
  @computed get showPager() {
    return this.totalPage > 1;
  }
  @computed get listViewStreamsByPage() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.getters.cameraUIStreams.slice(start, end);
  }

  @action
  setMainViewStream(streamUuid: string | null) {
    if (this.isMainViewStreamPinned || this.getters.isBoardWidgetActive) return;
    this.mainViewStreamUuid = streamUuid;
  }
  @action
  clearMainViewStream() {
    this.mainViewStreamUuid = null;
  }
  @Lodash.debounced(3000)
  @action.bound
  _handleStreamVolumes(volumes: Map<string, number>) {
    let activeStreamUuid = '';
    volumes.forEach((volume, key) => {
      if (volume * 100 > 50) activeStreamUuid = key;
    });
    if (activeStreamUuid && !this.getters.screenShareUIStream)
      this.setMainViewStream(activeStreamUuid);
  }
  @action.bound
  private _handleMainCameraStream() {
    if (!this.getters.screenShareUIStream && this.getters.cameraUIStreams.length) {
      this.setMainViewStream(this.getters.cameraUIStreams[0].stream.streamUuid);
    }
  }
  @bound
  addBoardViewportResizeObserver() {
    const observer = new ResizeObserver(debounce(this.updateBoardViewportSize, 300));

    const containerEle = document.querySelector(`.${this._boardViewportClassName}`);
    if (containerEle) {
      observer.observe(containerEle);
    }
    this.updateBoardViewportSize();
    return observer;
  }

  @action.bound
  updateBoardViewportSize() {
    const containerEle = document.querySelector(`.${this._boardViewportClassName}`);
    if (containerEle) {
      const { width, height } = this.getRootDimensions(containerEle as HTMLElement);

      const aspectRatio = 708 / 1186;

      const curAspectRatio = height / width;

      const scopeSize = { height, width };

      if (curAspectRatio > aspectRatio) {
        // shrink height
        scopeSize.height = width * aspectRatio;
      } else if (curAspectRatio < aspectRatio) {
        // shrink width
        scopeSize.width = height / aspectRatio;
      }

      this.boardViewportSize = { width: scopeSize.width, height: scopeSize.height };
    }
  }
  getRootDimensions = (containerNode: Window | HTMLElement) => {
    const height =
      containerNode instanceof Window ? containerNode.innerHeight : containerNode.clientHeight;
    const width =
      containerNode instanceof Window ? containerNode.innerWidth : containerNode.clientWidth;
    return { width, height };
  };

  onDestroy(): void {}
  onInstall(): void {
    this._disposers.push(
      computed(() => this.classroomStore.connectionStore.scene).observe(
        ({ oldValue, newValue }) => {
          if (oldValue) oldValue.off(AgoraRteEventType.AudioVolumes, this._handleStreamVolumes);
          if (newValue) {
            newValue.on(AgoraRteEventType.AudioVolumes, this._handleStreamVolumes);
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.getters.isBoardWidgetActive,
        (isBoardWidgetActive) => {
          if (isBoardWidgetActive) {
            this.clearMainViewStream();
            // stop timer
          } else {
            this._handleMainCameraStream();
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => {
          return this.getters.screenShareUIStream;
        },
        (screenShareUIStream) => {
          if (screenShareUIStream) {
            this.setMainViewStream(screenShareUIStream.stream.streamUuid);
          } else {
            this.setMainViewStream(null);

            this._handleMainCameraStream();
          }
        },
      ),
    );
    this._disposers.push(
      reaction(() => {
        return this.getters.cameraUIStreams.length && this.mainViewStream;
      }, this._handleMainCameraStream),
    );
  }
}
