import { Layout } from '@ui-scene/uistores/type';
import { useStore } from '@ui-scene/utils/hooks/use-store';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import './index.css';
import { StreamWindow } from '../stream-window';
import { convertStreamUIStatus, StreamWindowContext } from '../stream-window/context';
import { FC, useEffect, useState } from 'react';
import { ListViewPagination } from '@components/pagination';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { CSSTransition } from 'react-transition-group';
export const PresentationView = observer(() => {
  const {
    streamUIStore: { subscribeMass },
    layoutUIStore: { layout, showListView, showStatusBar },
    presentationUIStore: {
      mainViewStream,
      listViewStreamsByPage,
      totalPage,
      currentPage,
      setCurrentPage,
    },
  } = useStore();
  useEffect(() => {
    const mainViewStreamList = mainViewStream ? [mainViewStream] : [];
    subscribeMass(listViewStreamsByPage.concat(mainViewStreamList).map((stream) => stream.stream));
  }, [listViewStreamsByPage, mainViewStream]);
  const direction =
    layout === Layout.ListOnTop ? 'row' : layout === Layout.ListOnRight ? 'col' : 'row';

  return (
    <div className={classnames(`fcr-layout-content-${layout}`)}>
      <CSSTransition
        unmountOnExit
        mountOnEnter
        timeout={200}
        in={showListView}
        classNames={'fcr-layout-content-list-view'}>
        <div
          className={classnames(`fcr-layout-content-list-view`, {
            'fcr-layout-content-list-view-without-status-bar':
              layout === Layout.ListOnTop && !showStatusBar,
          })}>
          <div
            className={classnames(
              `fcr-layout-content-video-list`,
              `fcr-layout-content-video-list-${direction}`,
            )}>
            <ListViewPagination
              onChange={setCurrentPage}
              direction={direction}
              total={totalPage}
              current={currentPage}>
              {listViewStreamsByPage.map((stream) => {
                const sideStreamSize = { width: 192, height: 114 };

                return (
                  <div key={stream.stream.streamUuid} style={{ ...sideStreamSize }}>
                    <StreamWindowContext.Provider
                      value={convertStreamUIStatus(stream, 'list-view', layout, false)}>
                      <StreamWindow></StreamWindow>
                    </StreamWindowContext.Provider>
                  </div>
                );
              })}
            </ListViewPagination>
          </div>
          {layout === Layout.ListOnTop && <ListViewCollapseButton></ListViewCollapseButton>}
        </div>
      </CSSTransition>
      {layout === Layout.ListOnRight && <ListViewCollapseButton></ListViewCollapseButton>}

      <div className={classnames(`fcr-layout-content-main-view`)}>
        {mainViewStream ? (
          <StreamWindowContext.Provider
            value={convertStreamUIStatus(mainViewStream, 'main-view', layout, false)}>
            <StreamWindow></StreamWindow>
          </StreamWindowContext.Provider>
        ) : null}
      </div>
    </div>
  );
});
const ListViewCollapseButton = observer(() => {
  const {
    layoutUIStore: { layout, toggleShowListView, showListView },
  } = useStore();
  const [showCollapseButton, setShowCollapseButton] = useState(false);
  const direction =
    layout === Layout.ListOnTop ? 'row' : layout === Layout.ListOnRight ? 'col' : 'row';
  useEffect(() => {
    if (direction === 'col') {
      document.addEventListener('mousemove', handleMoueMove);
    } else {
      document.removeEventListener('mousemove', handleMoueMove);
    }
    return () => {
      document.removeEventListener('mousemove', handleMoueMove);
    };
  }, [direction]);
  const handleMoueMove = (event: MouseEvent) => {
    const distanceFromRight = document.documentElement.clientWidth - event.clientX;

    if (distanceFromRight < 300) {
      setShowCollapseButton(true);
    } else {
      setShowCollapseButton(false);
    }
  };
  const colDirectionStyle =
    direction === 'col' ? (showCollapseButton ? { opacity: 1, transition: 'all .2s' } : {}) : {};
  return (
    <div
      onClick={() => direction === 'row' && toggleShowListView()}
      className={classnames(`fcr-layout-content-list-view-collapse-button-${direction}`, {
        'fcr-layout-content-list-view-collapse-button-collapsed': !showListView,
      })}>
      <div
        style={colDirectionStyle}
        onClick={() => direction !== 'row' && toggleShowListView()}
        className={classnames('fcr-layout-content-list-view-collapse-button')}>
        <SvgImg type={SvgIconEnum.FCR_RIGHT2} size={48}></SvgImg>
      </div>
    </div>
  );
});
const BoardViewContainer: FC = observer(() => {
  const {
    layoutUIStore: { showActiobBar, showStatusBar, showListView },
  } = useStore();

  const boardContainerCls = classnames('fcr-layout-board-container', {
    'fcr-layout-board-container-with-action-bar': showActiobBar,
    'fcr-layout-board-container-with-status-bar': showStatusBar && !showListView,
  });

  return (
    <div className={boardContainerCls}>
      <div className="fcr-layout-board-viewport">
        <div className="fcr-layout-board-view" />
      </div>
    </div>
  );
});
