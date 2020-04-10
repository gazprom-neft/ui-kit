import * as React from 'react';

function S(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M15 3H1v2h14V3zM1 7h14v2H1V7zM1 11h14v2H1v-2z" />
    </svg>
  );
}

export default S;