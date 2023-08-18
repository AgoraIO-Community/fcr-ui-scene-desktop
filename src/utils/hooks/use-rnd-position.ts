import { Rnd } from 'react-rnd';

import { Boundaries } from '../clamp-bounds';
import { Logger } from 'agora-rte-sdk';

export const useRndPosition = (rndInstance: React.RefObject<Rnd | null>) => {
  const getPosition = () => {
    if (!rndInstance) {
      Logger.warn('rnd instance is not available');
      return { x: 0, y: 0 };
    }
    return rndInstance.current?.getDraggablePosition();
  };
  const getSize = () => {
    if (!rndInstance) {
      Logger.warn('rnd instance is not available');
      return { width: 0, height: 0 };
    }

    const ele = rndInstance.current?.getSelfElement();

    if (!ele) {
      Logger.warn('rnd ele is not available');
      return { width: 0, height: 0 };
    }

    return { width: ele.clientWidth, height: ele.clientHeight };
  };
  const updatePosition = (position: { x: number; y: number }) => {
    if (!rndInstance) {
      Logger.warn('rnd instance is not available');
      return;
    }
    rndInstance.current?.updatePosition(position);
  };
  const updateSize = (size: { width: string | number; height: string | number }) => {
    if (!rndInstance) {
      Logger.warn('rnd instance is not available');
      return;
    }

    rndInstance.current?.updateSize(size);
  };
  return {
    getPosition,
    getSize,
    updatePosition,
    updateSize,
  };
};
export const reposition = (selfBoundaries: Boundaries, containerBoundaries: Boundaries) => {
  const position = {
    x: selfBoundaries.left,
    y: selfBoundaries.top,
  };
  if (selfBoundaries.left < containerBoundaries.left) {
    position.x = containerBoundaries.left;
  }
  if (
    selfBoundaries.width < containerBoundaries.width &&
    selfBoundaries.width + selfBoundaries.left >
      containerBoundaries.width + containerBoundaries.left
  ) {
    position.x = containerBoundaries.width + containerBoundaries.left - selfBoundaries.width;
  }
  if (selfBoundaries.top < containerBoundaries.top) {
    position.y = containerBoundaries.top;
  }
  if (
    selfBoundaries.height < containerBoundaries.height &&
    selfBoundaries.height + selfBoundaries.top >
      containerBoundaries.height + containerBoundaries.top
  ) {
    position.y = containerBoundaries.height + containerBoundaries.top - selfBoundaries.height;
  }

  return position;
};
