import { Direction, directions, Position } from './Popover';

type Size = Pick<ClientRect, 'width' | 'height'>;

type PositionsByDirection = Record<Direction, NonNullable<Position>>;

const getPosition = (x: number, y: number): NonNullable<Position> => ({
  x: Math.round(x),
  y: Math.round(y),
});

export const getPositionsByDirection = ({
  contentSize,
  anchorSize,
  position: { x, y },
  offset,
  arrowOffset = 0,
}: {
  contentSize: Size;
  anchorSize: Size;
  position: NonNullable<Position>;
  offset: number;
  arrowOffset?: number;
}): PositionsByDirection => {
  const { width: contentWidth, height: contentHeight } = contentSize;
  const { width: anchorWidth, height: anchorHeight } = anchorSize;
  const anchorCenter = {
    x: x + anchorWidth / 2,
    y: y + anchorHeight / 2,
  };

  const xForRightDirections = x + anchorWidth + offset;
  const xForLeftDirections = x - contentWidth - offset;
  const xForVerticalDirections = {
    right: anchorCenter.x - arrowOffset,
    center: anchorCenter.x - contentWidth / 2,
    left: anchorCenter.x - contentWidth + arrowOffset,
  };

  const yForDownDirections = y + anchorHeight + offset;
  const yForUpDirections = y - contentHeight - offset;
  const yForHorizontalDirections = {
    up: anchorCenter.y - contentHeight + arrowOffset,
    center: anchorCenter.y - contentHeight / 2,
    down: anchorCenter.y - arrowOffset,
  };

  const xForStartLeftDirections = x;
  const xForStartRightDirections = x - contentWidth + anchorWidth;

  const yForStartUpDirections = y;
  const yForStartDownDirections = y - contentHeight + anchorHeight;

  return {
    upLeft: getPosition(xForVerticalDirections.left, yForUpDirections),
    upCenter: getPosition(xForVerticalDirections.center, yForUpDirections),
    upRight: getPosition(xForVerticalDirections.right, yForUpDirections),

    downLeft: getPosition(xForVerticalDirections.left, yForDownDirections),
    downCenter: getPosition(xForVerticalDirections.center, yForDownDirections),
    downRight: getPosition(xForVerticalDirections.right, yForDownDirections),

    rightUp: getPosition(xForRightDirections, yForHorizontalDirections.up),
    rightCenter: getPosition(xForRightDirections, yForHorizontalDirections.center),
    rightDown: getPosition(xForRightDirections, yForHorizontalDirections.down),

    leftUp: getPosition(xForLeftDirections, yForHorizontalDirections.up),
    leftCenter: getPosition(xForLeftDirections, yForHorizontalDirections.center),
    leftDown: getPosition(xForLeftDirections, yForHorizontalDirections.down),

    downStartLeft: getPosition(xForStartLeftDirections, yForDownDirections),
    downStartRight: getPosition(xForStartRightDirections, yForDownDirections),

    upStartLeft: getPosition(xForStartLeftDirections, yForUpDirections),
    upStartRight: getPosition(xForStartRightDirections, yForUpDirections),

    leftStartUp: getPosition(xForLeftDirections, yForStartUpDirections),
    leftStartDown: getPosition(xForLeftDirections, yForStartDownDirections),

    rightStartUp: getPosition(xForRightDirections, yForStartUpDirections),
    rightStartDown: getPosition(xForRightDirections, yForStartDownDirections),
  };
};

type ComputedPositionAndDirectionParams = {
  // Координата точки, к которой крепится поповер. Для якоря — координата левой верхней точки якоря
  position: Position;
  contentSize: Size;
  viewportSize: Size;
  anchorSize?: Size;
  offset: number;
  arrowOffset?: number;
  direction: Direction;
  possibleDirections: readonly Direction[];
  bannedDirections: readonly Direction[];
};

export const getComputedPositionAndDirection = ({
  position: initialPosition,
  contentSize,
  viewportSize,
  anchorSize = { width: 0, height: 0 },
  offset,
  arrowOffset,
  direction: initialDirection,
  possibleDirections,
  bannedDirections,
}: ComputedPositionAndDirectionParams): {
  direction: Direction;
  position: Position;
} => {
  if (!initialPosition) {
    return { position: initialPosition, direction: initialDirection };
  }

  const positionsByDirection = getPositionsByDirection({
    contentSize,
    anchorSize,
    position: initialPosition,
    offset,
    arrowOffset,
  });

  const direction =
    [...directions]
      .sort((dir) => (dir === initialDirection ? -1 : 0))
      .filter((dir) => possibleDirections.includes(dir) && !bannedDirections.includes(dir))
      .find((dir) => {
        const pos = positionsByDirection[dir];
        const { width, height } = contentSize;

        const isFittingDown = pos.y + height <= viewportSize.height;
        const isFittingUp = pos.y >= 0;

        const isFittingLeft = pos.x >= 0;
        const isFittingRight = pos.x + width <= viewportSize.width;

        return isFittingUp && isFittingDown && isFittingLeft && isFittingRight;
      }) || initialDirection;

  return {
    direction,
    position: positionsByDirection[direction],
  };
};
