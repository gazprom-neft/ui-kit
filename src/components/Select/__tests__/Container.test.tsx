import * as React from 'react';
import { render, RenderResult } from '@testing-library/react';

import { Container } from '../components/Container/Container';

const renderComponent = (props): RenderResult => {
  const { ...restProps } = props;
  return render(
    <Container {...restProps}>
      <div data-testid="content" />
    </Container>,
  );
};

describe('Компонент Container', () => {
  it('должен рендерится без ошибок', () => {
    expect(renderComponent).not.toThrow();
  });

  it('добавляется фокус', () => {
    const component = renderComponent({ focused: true });

    expect(component.container.querySelector('.Select')).toHaveClass('Select_focused');
  });

  it('добавляется класс disabled', () => {
    const component = renderComponent({ disabled: true });

    expect(component.container.querySelector('.Select')).toHaveClass('Select_disabled');
  });
});
