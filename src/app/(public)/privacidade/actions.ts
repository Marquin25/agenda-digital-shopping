"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { deleteDeviceData } from "@/application/metrics/record-metrics";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import {
  DEVICE_COOKIE,
  VISIT_COOKIE,
  hashDeviceId,
  isValidDeviceId,
} from "@/infrastructure/security/device-id";

export async function deleteMyDeviceData() {
  const jar = await cookies();
  const deviceId = jar.get(DEVICE_COOKIE)?.value;
  if (isValidDeviceId(deviceId)) {
    await deleteDeviceData(await getDb(), hashDeviceId(deviceId, getConfig().deviceIdPepper));
  }
  jar.delete(DEVICE_COOKIE);
  jar.delete(VISIT_COOKIE);
  redirect("/privacidade?apagado=1");
}
