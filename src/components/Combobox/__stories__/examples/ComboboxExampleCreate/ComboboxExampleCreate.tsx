import React, { useState } from 'react';

import { cnDocsDecorator } from '../../../../../uiKit/components/DocsDecorator/DocsDecorator';
import { Combobox } from '../../../Combobox';

type Item = {
  label: string;
  id: number | string;
};

const items: Item[] = [
  {
    label: 'Первый',
    id: 1,
  },
  {
    label: 'Второй',
    id: 2,
  },
  {
    label: 'Третий',
    id: 3,
  },
];

export function ComboboxExampleCreate() {
  const [value, setValue] = useState<Item | null>();
  const [list, setList] = useState<Item[]>(items);
  return (
    <div className={cnDocsDecorator('Section')}>
      <Combobox
        placeholder="Выберите значение"
        items={list}
        value={value}
        onChange={({ value }) => setValue(value)}
        onCreate={({ label }) => setList([{ label, id: `${label}_${list.length + 1}` }, ...list])}
      />
    </div>
  );
}
