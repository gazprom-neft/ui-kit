import * as React from 'react';

function M(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M22 2H2v2.24a2 2 0 00.505 1.328l6.99 7.864A2 2 0 0110 14.76V23l4-2v-6.24a2 2 0 01.505-1.328l6.99-7.864A2 2 0 0022 4.24V2z" />
    </svg>
  );
}

export default M;