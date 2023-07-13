import { Rnd } from 'react-rnd';
import { useStore } from './use-store';
import { useEffect } from 'react';
import { Logger } from 'agora-rte-sdk';
import { Boundaries } from '../clamp-bounds';

export const useRndPosition = (rndInstance?: Rnd | null) => {
  const {
    layoutUIStore: { viewportBoundaries },
  } = useStore();
  const onViewportBoundariesChanged = () => {
    const position = getPosition();
    const size = getSize();

    if (position && size) {
      const parentBounds = (rndInstance?.getParent() as HTMLElement)?.getBoundingClientRect();
      const newPosition = reposition(
        {
          width: size.width,
          height: size.height,
          left: position.x,
          top: position.y,
        },
        {
          width: parentBounds?.width || 0,
          height: parentBounds?.height || 0,
          left: parentBounds?.left || 0,
          top: parentBounds?.top || 0,
        },
      );

      updatePosition({ x: newPosition.x, y: newPosition.y });
    }
  };
  useEffect(onViewportBoundariesChanged, [viewportBoundaries]);
  const getPosition = () => {
    if (!rndInstance) {
      Logger.warn('rnd instance is not available');
      return;
    }
    return rndInstance.getDraggablePosition();
  };
  const getSize = () => {
    if (!rndInstance) {
      Logger.warn('rnd instance is not available');
      return;
    }

    const ele = rndInstance.getSelfElement();

    if (!ele) {
      Logger.warn('rnd ele is not available');
      return;
    }

    return { width: ele.clientWidth, height: ele.clientHeight };
  };
  const updatePosition = (position: { x: number; y: number }) => {
    if (!rndInstance) {
      Logger.warn('rnd instance is not available');
      return;
    }
    rndInstance.updatePosition(position);
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
