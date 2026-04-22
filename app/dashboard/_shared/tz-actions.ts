"use server";

import { revalidatePath } from "next/cache";
import {
  clearTimezoneCookie,
  writeTimezoneCookie,
} from "../../lib/cookies";
import { isValidTimezone } from "../../lib/tz";

export async function setTimezoneAction(formData: FormData): Promise<void> {
  const tz = String(formData.get("tz") ?? "").trim();
  if (!tz) {
    await clearTimezoneCookie();
  } else if (isValidTimezone(tz)) {
    await writeTimezoneCookie(tz);
  }
  revalidatePath("/dashboard", "layout");
}
