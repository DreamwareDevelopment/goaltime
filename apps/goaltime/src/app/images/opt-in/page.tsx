'use client'

import * as React from 'react';
import Image from 'next/image';

export default function OptInPage() {
  return (
    <div>
      <Image src="/proof.png" alt="Proof of concept" width={window.innerWidth} height={window.innerHeight} />
    </div>
  )
}
