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
export const reposition = (
  selfBoundaries: Boundaries,
  oldContainerBoundaries: Boundaries,
  newContainerBoundaries: Boundaries,
) => {
  const percentPosition = {
    x: selfBoundaries.left / oldContainerBoundaries.width,
    y: selfBoundaries.top / oldContainerBoundaries.height,
  };
  const newPosition = {
    x: newContainerBoundaries.width * percentPosition.x,
    y: newContainerBoundaries.height * percentPosition.y,
  };

  if (newPosition.x < newContainerBoundaries.left) {
    newPosition.x = newContainerBoundaries.left;
  }
  if (
    selfBoundaries.width < newContainerBoundaries.width &&
    selfBoundaries.width + newPosition.x >
      newContainerBoundaries.width + newContainerBoundaries.left
  ) {
    newPosition.x =
      newContainerBoundaries.width + newContainerBoundaries.left - selfBoundaries.width;
  }
  if (newPosition.y < newContainerBoundaries.top) {
    newPosition.y = newContainerBoundaries.top;
  }
  if (
    selfBoundaries.height < newContainerBoundaries.height &&
    selfBoundaries.height + newPosition.y >
      newContainerBoundaries.height + newContainerBoundaries.top
  ) {
    newPosition.y =
      newContainerBoundaries.height + newContainerBoundaries.top - selfBoundaries.height;
  }

  return newPosition;
};
