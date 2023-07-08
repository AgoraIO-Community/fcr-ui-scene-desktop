export type Size = { width: number; height: number };

export type Boundaries = Size & { top: number; left: number };

export const clampBounds = (selfBoundaries: Boundaries, containerBoundaries: Boundaries) => {
  const newBounds = {
    width: selfBoundaries.width,
    height: selfBoundaries.height,
    x: selfBoundaries.left,
    y: selfBoundaries.top,
  };
  if (selfBoundaries.left < containerBoundaries.left) {
    newBounds.x = containerBoundaries.left;
  }

  if (selfBoundaries.top < containerBoundaries.top) {
    newBounds.y = containerBoundaries.top;
  }

  if (
    selfBoundaries.width + selfBoundaries.left >
    containerBoundaries.width + containerBoundaries.left
  ) {
    newBounds.width = containerBoundaries.width + containerBoundaries.left - selfBoundaries.left;
  }

  if (
    selfBoundaries.height + selfBoundaries.top >
    containerBoundaries.height + containerBoundaries.top
  ) {
    newBounds.height = containerBoundaries.height + containerBoundaries.top - selfBoundaries.top;
  }

  return newBounds;
};
