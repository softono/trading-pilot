export interface SeoMeta {
  id: string;
  url: string;
  title: string;
  keyword?: string;
  description?: string;
  last_modified?: string;
  change_frequency?: string;
  priority?: number;
  sitemap_enable?: number;
}

export interface GeneralSettings {
  admin_email: string;
  date_format: string;
  date_time_format: string;
  user_login_with_otp: string;
  cookie_consent: string;
  user_email_verify: string;
}

export interface SmtpSettings {
  smtp_host: string;
  smtp_encryption: "ssl" | "tls";
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  mail_from_name: string;
  mail_from_address: string;
}

export interface CaptchaSettings {
  google_recaptcha: string;
  google_recaptcha_secret_key: string;
  google_recaptcha_public_key: string;
}

export interface SocialSettings {
  google_login: string;
  google_client_id: string;
  google_client_secret: string;
}

export interface ContentSettings {
  header_content: string;
  footer_content: string;
}
