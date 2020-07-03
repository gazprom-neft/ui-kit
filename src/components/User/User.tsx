import './User.css';

import React from 'react';

import { IconPropSize } from '../../icons/Icon/Icon';
import { IconSelect } from '../../icons/IconSelect/IconSelect';
import { cn } from '../../utils/bem';
import { getSizeByMap } from '../../utils/getSizeByMap';
import { ComponentWithAs, forwardRefWithAs } from '../../utils/types/PropsWithAsAttributes';
import { Avatar } from '../Avatar/Avatar';
import { Text, TextPropSize } from '../Text/Text';

export type UserPropSize = 's' | 'm';
export type UserPropView = 'clear' | 'ghost';
export type UserPropWidth = 'default' | 'full';
export type UserPropStatus = 'available' | 'remote' | 'out';

type Props = {
  avatarUrl?: string;
  name?: string;
  size?: UserPropSize;
  view?: UserPropView;
  width?: UserPropWidth;
  status?: UserPropStatus;
  onlyAvatar?: boolean;
  withArrow?: boolean;
  info?: string;
};

const cnUser = cn('User');

const infoSizeMap: Record<UserPropSize, TextPropSize> = {
  s: '2xs',
  m: 'xs',
};

const arrowSizeMap: Record<UserPropSize, IconPropSize> = {
  s: 'xs',
  m: 's',
};

export const User: ComponentWithAs<Props> = forwardRefWithAs<Props>((props, ref) => {
  const {
    as = 'div',
    className,
    size = 'm',
    avatarUrl,
    name,
    view = 'clear',
    width,
    onlyAvatar: propOnlyAvatar,
    withArrow,
    info,
    status,
    ...otherProps
  } = props;
  const Tag = as as string;
  const onlyAvatar = propOnlyAvatar || (!name && !info);
  const infoSize = getSizeByMap(infoSizeMap, size);
  const arrowSize = getSizeByMap(arrowSizeMap, size);

  return (
    <Tag
      {...otherProps}
      className={cnUser({ size, view, width, withArrow, minified: onlyAvatar }, [className])}
      ref={ref}
    >
      <div className={cnUser('AvatarWrapper', { status })}>
        <Avatar className={cnUser('Avatar', { status })} size={size} url={avatarUrl} name={name} />
      </div>
      {!onlyAvatar && (name || info) && (
        <div className={cnUser('Block')}>
          {name && (
            <Text className={cnUser('Name')} size={size} view="primary" lineHeight="2xs">
              {name}
            </Text>
          )}
          {info && (
            <Text className={cnUser('Info')} size={infoSize} view="secondary" lineHeight="2xs">
              {info}
            </Text>
          )}
        </div>
      )}
      {withArrow && <IconSelect className={cnUser('Arrow')} size={arrowSize} view="secondary" />}
    </Tag>
  );
});
