import { EduUIStoreBase } from './base';
import { observable, action, computed, reaction, runInAction } from 'mobx';
import { CommonDialogType, DialogType, Layout } from './type';
import { bound, Lodash, Scheduler } from 'agora-rte-sdk';
import { Log } from 'agora-common-libs';
import { ConfirmDialogProps } from '@components/dialog/confirm-dialog';
import { AgoraViewportBoundaries } from 'agora-common-libs';
import { ClassDialogProps } from '@components/dialog/class-dialog';
import { v4 as uuidv4 } from 'uuid';
import { ClassroomState, EduRoleTypeEnum } from 'agora-edu-core';
import { AgoraExtensionRoomEvent } from '@ui-scene/extension/events';

@Log.attach({ proxyMethods: false })
export class LayoutUIStore extends EduUIStoreBase {
  private _clearScreenTask: Scheduler.Task | null = null;
  private _clearScreenDelay = 3000;
  private _isPointingBar = false;
  private _hasPopoverShowed = false;
  private _classroomViewportClassName = 'fcr-classroom-viewport';
  private _viewportResizeObserver?: ResizeObserver;
  @observable
  statusBarHeight = 36;
  @observable
  actionBarHeight = 58;

  @observable viewportBoundaries: AgoraViewportBoundaries = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
  };
  @observable mouseEnterClass = false;
  @observable layoutReady = false;
  @observable showStatusBar = true;
  @observable showActiobBar = true;
  @observable layout: Layout = Layout.Grid;
  @action.bound
  setLayout(layout: Layout) {
    this.layout = layout;
  }
  @observable showListView = true;

  @action.bound
  toggleShowListView() {
    this.showListView = !this.showListView;
  }
  @observable dialogMap: Map<string, { type: DialogType }> = new Map();

  hasDialogOf(type: DialogType) {
    let exist = false;
    this.dialogMap.forEach(({ type: dialogType }) => {
      if (dialogType === type) {
        exist = true;
      }
    });

    return exist;
  }
  isDialogIdExist(id: string) {
    return this.dialogMap.has(id);
  }
  addDialog(type: 'confirm', params: CommonDialogType<ConfirmDialogProps>): void;
  addDialog(type: 'participants'): void;
  addDialog(type: 'class-info', params: CommonDialogType<ClassDialogProps>): void;

  @action.bound
  addDialog(type: unknown, params?: CommonDialogType<unknown>) {
    this.dialogMap.set(params?.id || uuidv4(), { ...(params as any), type: type as DialogType });
  }

  @action.bound
  deleteDialog = (id: string) => {
    this.dialogMap.delete(id);
  };
  @bound
  setIsPointingBar(disable: boolean) {
    this._isPointingBar = disable;
  }
  @bound
  setHasPopoverShowed(has: boolean) {
    this._hasPopoverShowed = has;
  }
  @computed get showLoading() {
    const classroomState = this.classroomStore.connectionStore.classroomState;
    return (
      classroomState === ClassroomState.Connecting || classroomState === ClassroomState.Reconnecting
    );
  }
  @computed get stageSize() {
    return this.layout === Layout.Grid || !this.showListView
      ? 0
      : this.layout === Layout.ListOnRight
      ? 210
      : 135;
  }

  @computed get gridLayoutDisabled() {
    return (
      (this.getters.isScreenSharing && !this.getters.isLocalScreenSharing) ||
      this.getters.isBoardWidgetActive
    );
  }
  @computed
  get noAvailabelStream() {
    return (
      this.getters.cameraUIStreams.length < 1 ||
      (this.getters.cameraUIStreams.length === 1 &&
        !this.getters.cameraUIStreams[0]?.isVideoStreamPublished)
    );
  }
  @computed
  get disableClearScreen() {
    return (
      this._isPointingBar ||
      this._hasPopoverShowed ||
      (this.layout === Layout.Grid && this.getters.cameraUIStreams.length > 1) ||
      this.noAvailabelStream ||
      this.getters.localUser?.userRole === EduRoleTypeEnum.invisible ||
      (this.getters.isBoardWidgetActive && !this.getters.isBoardWidgetMinimized)
    );
  }
  get classroomViewportClassName() {
    return this._classroomViewportClassName;
  }
  @action.bound
  clearScreen = () => {
    if (this.disableClearScreen) return;
    this.showStatusBar = false;
    this.showActiobBar = false;
  };
  @action.bound
  activeStatusBarAndActionBar = () => {
    this.showStatusBar = true;
    this.showActiobBar = true;
  };

  @action.bound
  resetClearScreenTask = () => {
    this.activeStatusBarAndActionBar();
    this._clearScreenTask?.stop();
    this._clearScreenTask = Scheduler.shared.addDelayTask(this.clearScreen, this._clearScreenDelay);
  };

  @action.bound
  handleMouseMove() {
    this.mouseEnterClass = true;
    this.resetClearScreenTask();
  }
  @action.bound
  handleMouseLeave() {
    this.mouseEnterClass = false;
    this.clearScreen();
  }

  @action.bound
  setLayoutReady(ready: boolean) {
    this.layoutReady = ready;
  }

  classroomSizeToBoardSize = (containerNode: Window | HTMLElement) => {
    const height =
      containerNode instanceof Window ? containerNode.innerHeight : containerNode.clientHeight;
    const width =
      containerNode instanceof Window ? containerNode.innerWidth : containerNode.clientWidth;

    const calcWidth = width;
    const calcHeight =
      this.layout === Layout.ListOnRight
        ? height - this.statusBarHeight - this.actionBarHeight
        : height - this.statusBarHeight - this.actionBarHeight;

    return { calcWidth, calcHeight };
  };
  boardSizeToClassroomSize = ({ w, h }: { w: number; h: number }) => {
    const width = w;
    const height =
      this.layout === Layout.ListOnRight
        ? h + this.statusBarHeight + this.actionBarHeight
        : h + this.statusBarHeight + this.actionBarHeight;

    return { width, height };
  };
  @action.bound
  _handleLayoutChanged() {
    if (this.layout === Layout.Grid) {
      this.showListView = false;
    } else {
      this.showListView = true;
    }
  }

  @bound
  private _addViewportResizeObserver() {
    const observer = new ResizeObserver(this._updateViewportBoundaries);

    const viewport = document.querySelector(`body`);
    if (viewport) {
      observer.observe(viewport);
    }
    this._viewportResizeObserver = observer;
  }

  private _removeViewportResizeObserver() {
    this._viewportResizeObserver?.disconnect();
  }

  @bound
  @Lodash.debounced(100)
  private _updateViewportBoundaries() {
    const containerEle = document.querySelector(`body`);

    if (containerEle) {
      const { left, right, top, bottom, width, height } = containerEle.getBoundingClientRect();

      runInAction(() => {
        this.viewportBoundaries = {
          left,
          right,
          top,
          bottom,
          width,
          height,
        };
      });
    }
  }

  onDestroy(): void {
    this._removeViewportResizeObserver();
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }
  onInstall(): void {
    this._addViewportResizeObserver();
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);

    this.resetClearScreenTask();
    this._disposers.push(reaction(() => this.layout, this._handleLayoutChanged));

    this._disposers.push(
      reaction(
        () => {
          return this.getters.isScreenSharing;
        },
        (isScreenSharing) => {
          if (
            isScreenSharing &&
            !this.getters.isLocalScreenSharing &&
            this.layout === Layout.Grid
          ) {
            this.setLayout(Layout.ListOnTop);
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => {
          return this.getters.isBoardWidgetActive;
        },
        (isBoardWidgetActive) => {
          if (isBoardWidgetActive && this.layout === Layout.Grid) {
            this.setLayout(Layout.ListOnTop);
          }
        },
      ),
    );
    this._disposers.push(
      reaction(
        () => this.layout,
        (layout) => {
          this.classroomStore.widgetStore.widgetController?.broadcast(
            AgoraExtensionRoomEvent.LayoutChanged,
            layout,
          );
        },
      ),
    );
  }
}
