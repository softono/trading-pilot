"use client";

import { useEffect, useRef, useId } from "react";

interface ReCaptchaInstance {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  ready: (callback: () => void) => void;
}

declare global {
  interface Window {
    grecaptcha?: ReCaptchaInstance;
    onRecaptchaLoad?: () => void;
  }
}

export default function RecaptchaWidget({
  onVerify,
  googleRecaptchaPublicKey,
}: {
  onVerify: (token: string) => void;
  googleRecaptchaPublicKey: string;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const uniqueId = useId();

  useEffect(() => {
    if (!googleRecaptchaPublicKey) return;

    const renderCaptcha = () => {
      if (window.grecaptcha && containerRef.current) {
        if (widgetIdRef.current !== null) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
            return;
          } catch {}
        }

        containerRef.current.innerHTML = "";
        const child = document.createElement("div");
        containerRef.current.appendChild(child);

        const widgetId = window.grecaptcha.render(child, {
          sitekey: googleRecaptchaPublicKey,
          callback: (token: string) => {
            onVerify(token);
          },
          "expired-callback": () => {
            onVerify("");
          },
        });
        widgetIdRef.current = widgetId;
      }
    };

    const scriptSrc = "https://www.google.com/recaptcha/api.js";
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => renderCaptcha());
        }
      };
      document.body.appendChild(script);
    } else {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => renderCaptcha());
      } else {
        setTimeout(() => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            window.grecaptcha.ready(() => renderCaptcha());
          }
        }, 100);
      }
    }

    window.onRecaptchaLoad = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => renderCaptcha());
      }
    };

    return () => {
      if (widgetIdRef.current && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {}
      }
      widgetIdRef.current = null;
    };
  }, [googleRecaptchaPublicKey, onVerify, uniqueId]);

  if (!googleRecaptchaPublicKey) {
    return <></>;
  }
  return <div ref={containerRef} className="mt-4"></div>;
}
