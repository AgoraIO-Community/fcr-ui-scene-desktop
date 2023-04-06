import { action, computed, observable, reaction, runInAction } from 'mobx';
import { EduUIStoreBase } from './base';
import { EduStreamUI } from '@onlineclass/utils/stream/struct';
import { AgoraRteEventType, Lodash } from 'agora-rte-sdk';
export class PresentationUIStore extends EduUIStoreBase {
  @observable mainViewStream: EduStreamUI | null = null;
  pageSize = 6;
  @observable currentPage = 1;
  @computed get totalPage() {
    return Math.ceil(this.getters.cameraUIStreams.length / this.pageSize);
  }
  @computed get listViewStreamsByPage() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.getters.cameraUIStreams.slice(start, end);
  }

  @action
  setMainViewStream(streamUuid: string) {
    this.mainViewStream =
      this.getters.cameraUIStreams.find((stream) => stream.stream.streamUuid === streamUuid) ||
      null;
  }
  @action
  clearMainViewStream() {
    this.mainViewStream = null;
  }
  @Lodash.debounced(3000)
  @action.bound
  _handleStreamVolumes(volumes: Map<string, number>) {
    console.log(volumes, 'volumes');
    let activeStreamUuid = '';
    volumes.forEach((volume, key) => {
      if (volume * 100 > 50) activeStreamUuid = key;
    });
    if (activeStreamUuid) this.setMainViewStream(activeStreamUuid);
  }
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
        () => this.getters.boardApi.connected,
        () => {
          if (this.getters.boardApi.connected) {
            this.clearMainViewStream();
            // stop timer
          } else {
            // start timer
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => {
          return this.getters.cameraUIStreams;
        },
        (cameraUIStreams) => {
          if (cameraUIStreams.length === 1) {
            runInAction(() => {
              this.mainViewStream = cameraUIStreams[0];
            });
          }
        },
      ),
    );
  }
}
