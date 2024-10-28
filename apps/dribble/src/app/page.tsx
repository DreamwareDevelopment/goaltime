"use client";

import * as nextui from "@nextui-org/react";
export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return (
    <nextui.NextUIProvider>
      <nextui.Card>
        <nextui.CardHeader>
          <h1>NextUI Hero Image</h1>
        </nextui.CardHeader>
        <nextui.CardBody>
          <p>Beautiful, fast and modern React UI library.</p>
        </nextui.CardBody>
      </nextui.Card>
    </nextui.NextUIProvider>
  );
}
