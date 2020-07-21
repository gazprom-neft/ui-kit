import './ExampleWithButtons.css';

import React, { useReducer } from 'react';

import { IconProps } from '../../../../../icons/Icon/Icon';
import { IconAdd } from '../../../../../icons/IconAdd/IconAdd';
import { IconAlert } from '../../../../../icons/IconAlert/IconAlert';
import { IconProcessing } from '../../../../../icons/IconProcessing/IconProcessing';
import { IconRing } from '../../../../../icons/IconRing/IconRing';
import { IconThumbUp } from '../../../../../icons/IconThumbUp/IconThumbUp';
import { cnDocsDecorator } from '../../../../../uiKit/components/DocsDecorator/DocsDecorator';
import { Button } from '../../../../Button/Button';
import { Item, SnackBar, SnackBarItemStatus } from '../../../SnackBar';
import { cn } from '../../cn';

const cnExampleWithButtons = cn('ExampleWithButtons');

const getItemIconByStatus = (status: SnackBarItemStatus): React.FC<IconProps> | undefined => {
  const mapIconByStatus: Record<SnackBarItemStatus, React.FC<IconProps>> = {
    success: IconThumbUp,
    warning: IconAlert,
    alert: IconAlert,
    system: IconProcessing,
    normal: IconRing,
  };
  return mapIconByStatus[status];
};

function reducer(
  state: Item[],
  action: { type: 'add' | 'remove'; item: Item; key?: number | string },
) {
  switch (action.type) {
    case 'add':
      return [...state, action.item];
    case 'remove':
      return state.filter((item) => item.key !== action.key);
  }
}

export function ExampleWithButtons() {
  const [items, dispatchItems] = useReducer<
    React.Reducer<Item[], { type: 'add' | 'remove'; item: Item; key?: number | string }>
  >(reducer, []);
  const generateHandleAdd = (status: SnackBarItemStatus) => () => {
    const key = items.length + 1;
    const item: Item = {
      key,
      message: `Сообщение о каком-то событии - ${key}`,
      status,
      icon: getItemIconByStatus(status),
      onClose: () => dispatchItems({ type: 'remove', item, key }),
    };
    dispatchItems({ type: 'add', item });
  };

  const handleSuccessAdd = generateHandleAdd('success');
  const handleWarningAdd = generateHandleAdd('warning');
  const handleAlertAdd = generateHandleAdd('alert');
  const handleSystemAdd = generateHandleAdd('system');
  const handleNormalAdd = generateHandleAdd('normal');

  React.useEffect(() => handleNormalAdd(), []);

  return (
    <div className={cnExampleWithButtons('', [cnDocsDecorator('Section')])}>
      <div className={cnExampleWithButtons('Buttons')}>
        <Button
          className={cnExampleWithButtons('ButtonAdd')}
          iconLeft={IconAdd}
          label="Выполненно"
          onClick={handleSuccessAdd}
        />
        <Button
          className={cnExampleWithButtons('ButtonAdd')}
          iconLeft={IconAdd}
          label="Ошибка"
          onClick={handleAlertAdd}
        />
        <Button
          className={cnExampleWithButtons('ButtonAdd')}
          iconLeft={IconAdd}
          label="Предупреждение"
          onClick={handleWarningAdd}
        />
        <Button
          className={cnExampleWithButtons('ButtonAdd')}
          iconLeft={IconAdd}
          label="Системное"
          onClick={handleSystemAdd}
        />
        <Button
          className={cnExampleWithButtons('ButtonAdd')}
          iconLeft={IconAdd}
          label="Нормальное"
          onClick={handleNormalAdd}
        />
      </div>
      <SnackBar className={cnExampleWithButtons('SnackBar')} items={items} />
    </div>
  );
}
