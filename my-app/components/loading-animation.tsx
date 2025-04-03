"use client"

import React from 'react'

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-black">
      <div className="text-red-500 font-mono text-xs mb-4 opacity-70">
        {/* Texas A&M logo as colored plus signs */}
        <div className="text-center">
          <pre>
{`.++++++.
|       |.
|       ++++++++++++++.
|       +++++++++++++ |
|  +++  ++|  +++ |
.+++++++  +++   ++| ++  +++
\\.       +++   ++| ++.+++ |
 \\.      ++++  ++| +++++ |
  \\.     +||  ++ ++| ++  ++.|
   \\.  .+.    +++|+    ./
       |       |
       |       |
       \\.     ./
        \\.   ./
         |   |
         |   |
         \\.  |
          \\. |
           \\+`}
          </pre>
        </div>
      </div>
      <div className="text-5xl font-bold text-white mb-8">AGGIE NEXUS</div>
      <div className="w-[300px] h-1 bg-gray-800 relative overflow-hidden rounded-full">
        <div className="absolute left-0 top-0 h-full w-1/3 bg-red-500 animate-loading-bar"></div>
      </div>
      <div className="mt-4 text-white/80">Loading...</div>
    </div>
  )
} 