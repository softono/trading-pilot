import axios from "axios";

interface CaptchaRequest {
  body: Record<string, unknown>;
}

export async function recaptchaFails(
  req: CaptchaRequest,
  secretKey: string,
): Promise<boolean> {
  if (!secretKey) {
    return false;
  }

  const token =
    req.body["g-recaptcha-response"] ||
    req.body.recaptcha ||
    req.body.captcha ||
    req.body.recaptcha_token;

  if (!token) {
    return true;
  }

  const response = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    null,
    {
      params: {
        secret: secretKey,
        response: token,
      },
      timeout: 5000,
    },
  );

  return response.data?.success !== true;
}
