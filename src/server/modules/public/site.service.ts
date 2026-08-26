import { errorLog } from "@/server/lib/logger";
import { sendEmail } from "@/server/lib/mailer";
import { getSetting } from "@/server/modules/setting/settings.service";
import { ApiResult } from "@/types";
import { NextRequest } from "next/server";
import { validateSession } from "@/server/modules/auth/session.service";
import { getSessionToken } from "@/server/utils/authCookie";
import { recaptchaFails } from "@/server/utils/recaptcha";
import {
  findDuplicateContactMessage,
  createContactMessage,
} from "@/server/models/contact-message.repository";
import { findActivePageBySlug } from "@/server/models/page.repository";

export async function getUserIdFromRequest(
  req: NextRequest,
): Promise<string | null> {
  const token = getSessionToken(req);
  if (!token) return null;
  const result = await validateSession(token);
  return result?.user.id ?? null;
}

export async function contactProcess(
  req: NextRequest,
  body: Record<string, string>,
): Promise<ApiResult> {
  const { name, email, subject, message, captcha_token } = body;

  const secretKey = await getSetting("google_recaptcha_secret_key");
  if (await recaptchaFails({ body: { captcha: captcha_token } }, secretKey)) {
    return {
      status: 0,
      message: "reCAPTCHA verification failed",
      http_status: 400,
    };
  }

  const existing = await findDuplicateContactMessage(email, subject, message);
  if (existing) {
    return {
      status: 0,
      message: "You have already submitted this message",
      http_status: 409,
    };
  }

  const finalUserId = await getUserIdFromRequest(req);

  await createContactMessage({
    user_id: finalUserId,
    to_user: email,
    subject,
    message,
  });

  const adminEmail = (await getSetting("admin_email")) || "";
  sendEmail(adminEmail, "send_mail", {
    name,
    email,
    subject,
    message,
  }).catch((mailErr) => {
    errorLog("[Contact] sendEmail error", { mailErr });
  });

  return {
    status: 1,
    message: "Thank you for contacting us. We will get back to you soon.",
    http_status: 200,
  };
}

export async function getBySlug(slug: string): Promise<ApiResult> {
  if (!slug) {
    return { http_status: 400, status: 0, message: "Missing slug" };
  }

  const page = await findActivePageBySlug(slug);
  if (!page) {
    return { http_status: 404, status: 0, message: "Page not found" };
  }

  return {
    http_status: 200,
    status: 1,
    message: "Page retrieved",
    data: { title: page.title, slug: page.slug, body: page.body },
  };
}
