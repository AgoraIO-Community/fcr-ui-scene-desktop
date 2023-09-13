import { Boundaries, Size } from '@ui-scene/utils/clamp-bounds';

export const WINDOW_TITLE_HEIGHT = 28;
// width / height
export const WINDOW_ASPECT_RATIO = 1836 / 847;
export const VIDEO_ROW_CLASSNAME = 'fcr-layout-content-video-list-row';

export const LAYOUT_CONTENT_CLASSNAME = 'fcr-layout-content-main-view';

export const WINDOW_REMAIN_SIZE = { width: 783, height: 388 };
export const WINDOW_REMAIN_POSITION = { x: 0, y: 171 };
export const RND_BOUNDS = 'parent';

export const isHorizontalLayout = () => {
  const clasNameExists = document.querySelector(`.${VIDEO_ROW_CLASSNAME}`);

  return !!clasNameExists;
};
export const getMaxSizeInContainer = (containerSize: Size) => {
  let width = containerSize.width;
  let height = containerSize.width / WINDOW_ASPECT_RATIO + WINDOW_TITLE_HEIGHT;

  if (height > containerSize.height) {
    height = containerSize.height - WINDOW_TITLE_HEIGHT;
    width = height * WINDOW_ASPECT_RATIO;
    height = height + WINDOW_TITLE_HEIGHT;
  }

  return { width, height };
};
export const resizeHandleStyleOverride = { zIndex: 999 };
export const getContentAreaSize = () => {
  const layoutContentDom = document.querySelector(`.${LAYOUT_CONTENT_CLASSNAME}`);

  const contentAreaSize = { width: 0, height: 0, top: 0, left: 0 };
  if (layoutContentDom) {
    const { width, height, left, top } = layoutContentDom.getBoundingClientRect();
    contentAreaSize.width = width;
    contentAreaSize.height = height;
    contentAreaSize.left = left;
    contentAreaSize.top = top;
  }

  return contentAreaSize;
};
export const getDefaultBounds = (
  containerBoundaries: Boundaries,
  defaultWidth = 400,
  defaultHeight = 300,
) => {
  if (isHorizontalLayout()) {
    containerBoundaries.height = containerBoundaries.height - 58;
  }

  const width = defaultWidth;
  const height = defaultHeight;
  const x = (containerBoundaries.width - width) / 2 + containerBoundaries.left;

  const y = (containerBoundaries.height - height) / 2 + containerBoundaries.top;

  return { x, y, width, height };
};
export const getFittedBounds = (containerBoundaries: Boundaries) => {
  if (isHorizontalLayout()) {
    containerBoundaries.height = containerBoundaries.height - 58;
  }

  const maxSize = getMaxSizeInContainer(containerBoundaries);
  const width = maxSize.width;
  const height = maxSize.height;
  const x = (containerBoundaries.width - width) / 2 + containerBoundaries.left;

  const y = (containerBoundaries.height - height) / 2 + containerBoundaries.top;

  return { x, y, width, height };
};
