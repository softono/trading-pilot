"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BrokerConnectionForm from "@/app/(user)/broker-connections/BrokerConnectionForm";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Edit Broker Connection</h1>
      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BrokerConnectionForm
            isEdit
            id={params.id}
            onSuccess={() => router.push("/broker-connections")}
          />
        </CardContent>
      </Card>
    </>
  );
}
