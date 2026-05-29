"use client";

import dynamic from "next/dynamic";

const Live2DWidget = dynamic(() => import("@/app/_components/Live2DWidget"), {
  ssr: false,
});

export default function Live2DWidgetWrapper() {
  return <Live2DWidget />;
}
