"use client";

import { Card, CardHeader, CardBody } from "@nextui-org/react";
import Navbar from "../components/navigation";

export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return (
    <div className="w-full flex flex-col">
      <Navbar user={undefined} />
      <Card>
        <CardHeader>
          <h1>NextUI Hero Image</h1>
        </CardHeader>
        <CardBody>
          <p>Beautiful, fast and modern React UI library.</p>
        </CardBody>
      </Card>
    </div>
  );
}
