import React from 'react';
import { IIcon, cnIcon } from '../Icon/Icon';

export type SizeComponent = React.FC<React.SVGProps<SVGSVGElement>>;
export type BaseIconHocArguments = {
  m: SizeComponent;
  s: SizeComponent;
  xs: SizeComponent;
  name: string;
};

export function BaseIconHoc({ m, s, xs, name }: BaseIconHocArguments) {
  return function(IconComponent: React.FC<IIcon>) {
    return function(props: IIcon) {
      function getSvgBySize(size) {
        switch (size) {
          case 'xs':
            return xs;
          case 's':
            return s;
          case 'm':
            return m;
          default:
            return m;
        }
      }

      const Svg: SizeComponent = getSvgBySize(props.size);

      return (
        <IconComponent className={name} {...props}>
          <Svg className={cnIcon('Svg')} />
        </IconComponent>
      );
    };
  };
}