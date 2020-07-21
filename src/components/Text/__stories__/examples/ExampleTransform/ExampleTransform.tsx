import React from 'react';

import { cnDocsDecorator } from '../../../../../uiKit/components/DocsDecorator/DocsDecorator';
import * as wp from '../../../../../utils/whitepaper/whitepaper';
import { Text } from '../../../Text';

export const ExampleTransform = () => {
  return (
    <div className={cnDocsDecorator('Section')}>
      <Text size="s" view="ghost" className={wp.decorator({ 'indent-b': 'm' })}>
        text_transform_uppercase
      </Text>
      <Text transform="uppercase">Газпром Нефть</Text>
    </div>
  );
};
