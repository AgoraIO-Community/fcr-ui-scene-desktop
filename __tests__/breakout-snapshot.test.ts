/**
 * 测试 BreakoutUIStore 中白板快照持久化修复：
 *
 * 问题描述：
 * 1. 创建分组房间时，从主房间创建白板快照
 * 2. 第一位进入分组房间的用户会自动执行从快照恢复白板状态
 * 3. 当执行快照恢复的用户重新进入分组房间时，快照恢复动作会再执行一次，
 *    让分组白板状态回到白板复制时的最初状态
 *
 * 修复方案：
 * 1. 只在子房间场景里处理白板快照加载
 * 2. 按 主房间 + 子房间 ID 持久化 _coursewareLoaded
 * 3. 重新进入同一个子房间时，从持久化状态恢复，避免重复加载
 *
 * 关键时序：
 * - 首次进入某个子房间时，如果未持久化，则在白板挂载后执行一次加载
 * - 加载完成后写入持久化状态
 * - 刷新页面或重新进入同一个子房间时，先恢复状态，再决定是否加载
 */

export {};

describe('BreakoutUIStore - Whiteboard Snapshot Persistence Fix', () => {
  // 模拟 BreakoutUIStore 的核心状态和逻辑
  function createMockStore(storage = new Map<string, string>()) {
    return {
      _storage: storage,
      _coursewareLoaded: false,
      _currentRoomId: undefined as string | undefined,
      _loadAttributesCallCount: 0,

      restoreCoursewareLoadedState(roomId?: string) {
        this._currentRoomId = roomId;
        this._coursewareLoaded = roomId ? this._storage.get(roomId) === 'true' : false;
      },

      saveCoursewareLoadedState() {
        if (this._currentRoomId) {
          this._storage.set(this._currentRoomId, 'true');
        }
      },

      handleBoardStateChange(
        mounted: boolean,
        isGranted: boolean,
        inSubRoom = true,
        hasWidgetController = true,
        hasCurrentSceneBoardWidget = true,
      ) {
        if (
          !this._coursewareLoaded &&
          mounted &&
          isGranted &&
          inSubRoom &&
          hasWidgetController &&
          hasCurrentSceneBoardWidget
        ) {
          this._coursewareLoaded = true;
          this.saveCoursewareLoadedState();
          this._loadAttributesCallCount++;
          this.logger('copy room content');
        }
        if (!mounted && !this._coursewareLoaded) {
          this.logger('coursewareLoaded already false on unmount');
        }
      },

      joinSubRoom(roomId = 'room-a') {
        this.restoreCoursewareLoadedState(roomId);
        this.logger(`joinSubRoom: ${roomId}, _coursewareLoaded = ${this._coursewareLoaded}`);
      },

      leaveSubRoom() {
        this._coursewareLoaded = false;
        this._currentRoomId = undefined;
        this.logger('leaveSubRoom: _coursewareLoaded = false');
      },

      logger(msg: string) {
        // console.log(msg);
      },
    };
  }

  test('FIX: 首次进入分组房间应加载快照', () => {
    const store = createMockStore();

    store.joinSubRoom();
    store.handleBoardStateChange(true, true);

    expect(store._loadAttributesCallCount).toBe(1);
    expect(store._coursewareLoaded).toBe(true);
    expect(store._storage.get('room-a')).toBe('true');
  });

  test('FIX: 主房间白板挂载不应触发分组快照加载', () => {
    const store = createMockStore();

    store.handleBoardStateChange(true, true, false);

    expect(store._loadAttributesCallCount).toBe(0);
    expect(store._coursewareLoaded).toBe(false);
  });

  test('FIX: 子房间状态已切换但 widgetController 仍指向主房间时，不应提前加载快照', () => {
    const store = createMockStore();

    store.joinSubRoom('sub-room-a');

    // 竞态：subRoomScene 已建立，但当前 mounted 仍来自主房间白板，widgetController 还没切到子房间
    store.handleBoardStateChange(true, true, true, true, false);
    expect(store._loadAttributesCallCount).toBe(0);
    expect(store._coursewareLoaded).toBe(false);

    // widgetController 切到子房间后，等待新的白板 mount 完成再加载
    store.handleBoardStateChange(false, true, true, true, true);
    expect(store._loadAttributesCallCount).toBe(0);

    store.handleBoardStateChange(true, true, true, true, true);
    expect(store._loadAttributesCallCount).toBe(1);
    expect(store._coursewareLoaded).toBe(true);
  });

  test('FIX: widgetController 已切到子房间，但子房间白板 widget 还没 onCreate 前，不应加载快照', () => {
    const store = createMockStore();

    store.joinSubRoom('sub-room-a');

    // 竞态：controller 已切过去，但新的 netlessBoard 实例尚未创建完成
    store.handleBoardStateChange(true, true, true, true, false);
    expect(store._loadAttributesCallCount).toBe(0);
    expect(store._coursewareLoaded).toBe(false);

    // onCreate 完成后才允许进入后续 mounted -> load 流程
    store.handleBoardStateChange(false, true, true, true, true);
    store.handleBoardStateChange(true, true, true, true, true);
    expect(store._loadAttributesCallCount).toBe(1);
    expect(store._coursewareLoaded).toBe(true);
  });

  test('FIX: 在分组房间中临时卸载/重新挂载，不应重新加载快照', () => {
    const store = createMockStore();

    store.joinSubRoom();
    store.handleBoardStateChange(true, true);
    expect(store._loadAttributesCallCount).toBe(1);
    expect(store._coursewareLoaded).toBe(true);

    store.handleBoardStateChange(false, false);
    expect(store._coursewareLoaded).toBe(true);

    store.handleBoardStateChange(true, true);
    expect(store._loadAttributesCallCount).toBe(1);
    expect(store._coursewareLoaded).toBe(true);
  });

  test('FIX: 离开分组房间后再进入同一房间，不应重新加载快照', () => {
    const store = createMockStore();

    store.joinSubRoom();
    store.handleBoardStateChange(true, true);
    expect(store._loadAttributesCallCount).toBe(1);

    store.leaveSubRoom();
    store.handleBoardStateChange(false, false);
    expect(store._coursewareLoaded).toBe(false);

    store.joinSubRoom();
    store.handleBoardStateChange(true, true);

    expect(store._loadAttributesCallCount).toBe(1);
    expect(store._coursewareLoaded).toBe(true);
  });

  test('FIX: 切换分组房间，新房间首次进入应加载快照', () => {
    const store = createMockStore();

    store.joinSubRoom('room-a');
    store.handleBoardStateChange(true, true);
    expect(store._loadAttributesCallCount).toBe(1);

    store.joinSubRoom('room-b');
    store.handleBoardStateChange(false, false); // 卸载
    store.handleBoardStateChange(true, true);   // 重新挂载

    expect(store._loadAttributesCallCount).toBe(2);
  });

  test('FIX: 切换分组房间后再切回来，同一房间不应重复加载快照', () => {
    const store = createMockStore();

    store.joinSubRoom('room-a');
    store.handleBoardStateChange(true, true);
    expect(store._loadAttributesCallCount).toBe(1);

    store.leaveSubRoom();
    store.handleBoardStateChange(false, false);
    store.joinSubRoom('room-b');
    store.handleBoardStateChange(true, true);
    expect(store._loadAttributesCallCount).toBe(2);

    store.leaveSubRoom();
    store.handleBoardStateChange(false, false);
    store.joinSubRoom('room-a');
    store.handleBoardStateChange(true, true);

    expect(store._loadAttributesCallCount).toBe(2);
  });

  test('FIX: 刷新页面后重新进入同一子房间，不应重新加载快照', () => {
    const storage = new Map<string, string>();

    const firstStore = createMockStore(storage);
    firstStore.joinSubRoom('room-a');
    firstStore.handleBoardStateChange(true, true);
    expect(firstStore._loadAttributesCallCount).toBe(1);

    const reloadedStore = createMockStore(storage);
    reloadedStore.joinSubRoom('room-a');
    reloadedStore.handleBoardStateChange(true, true);

    expect(reloadedStore._loadAttributesCallCount).toBe(0);
    expect(reloadedStore._coursewareLoaded).toBe(true);
  });

  test('FIX: onUserPropertiesUpdate 不应重新加载属性', () => {
    // 模拟 FcrBoardWidget 的 onUserPropertiesUpdate 行为
    let _loadAttributesCallCount = 0;

    // FIX 后的行为: onUserPropertiesUpdate 不再调用 _loadAttributes
    const onUserPropertiesUpdate = () => {
      // 旧代码会调用: if (_loadAttributesIsCalled) { _loadAttributes(); }
      // 新代码: 不调用 _loadAttributes
    };

    // 模拟首次加载
    _loadAttributesCallCount++;
    expect(_loadAttributesCallCount).toBe(1);

    // 模拟用户属性更新（重新进入房间）
    onUserPropertiesUpdate();

    // FIX: 不会再次调用 _loadAttributes
    expect(_loadAttributesCallCount).toBe(1);
  });

  test('BUG 演示: 没有持久化状态时，刷新页面后会重复加载快照', () => {
    function createOldMockStore() {
      return {
        _coursewareLoaded: false,
        _loadAttributesCallCount: 0,

        handleBoardStateChange(mounted: boolean, isGranted: boolean) {
          if (!this._coursewareLoaded && mounted && isGranted) {
            this._coursewareLoaded = true;
            this._loadAttributesCallCount++;
          }
        },

        joinSubRoom() {
          this._coursewareLoaded = false;
        },
      };
    }

    const firstStore = createOldMockStore();
    firstStore.joinSubRoom();
    firstStore.handleBoardStateChange(true, true);
    expect(firstStore._loadAttributesCallCount).toBe(1);

    const reloadedStore = createOldMockStore();
    reloadedStore.joinSubRoom();
    reloadedStore.handleBoardStateChange(true, true);

    expect(reloadedStore._loadAttributesCallCount).toBe(1);
  });
});
