"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BrokerConnectionForm from "@/app/(user)/broker-connections/BrokerConnectionForm";

export default function Page() {
  const router = useRouter();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Add Broker Connection</h1>
      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BrokerConnectionForm
            isEdit={false}
            onSuccess={() => router.push("/broker-connections")}
          />
        </CardContent>
      </Card>
    </>
  );
}
