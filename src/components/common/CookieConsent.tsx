"use client";
import React, { useEffect } from "react";
import { useTheme } from "@/components/switchcn";

interface CookieConsentLib {
  run: (config: Record<string, unknown>) => void;
  getUserPreferences: () => { rejectedCategories: string[] };
}

declare global {
  interface Window {
    CookieConsent: CookieConsentLib;
  }
}

const CookieConsentComponent: React.FC<{ enabled: boolean }> = ({
  enabled,
}) => {
  const { colorMode } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-cc-theme",
      colorMode === "dark" ? "dark" : "",
    );
  }, [colorMode]);

  useEffect(() => {
    if (enabled && !document.cookie.includes("cookie_consent")) {
      if (!window.CookieConsent) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css";
        document.head.appendChild(link);

        const style = document.createElement("style");
        style.textContent = `
          [data-cc-theme="dark"] #cc-main {
            --cc-bg: var(--popover);
            --cc-primary-color: var(--popover-foreground);
            --cc-secondary-color: var(--muted-foreground);
            --cc-btn-primary-bg: var(--primary);
            --cc-btn-primary-color: var(--primary-foreground);
            --cc-btn-primary-hover-bg: color-mix(in oklch, var(--primary) 90%, transparent);
            --cc-btn-primary-hover-color: var(--primary-foreground);
            --cc-btn-secondary-bg: var(--secondary);
            --cc-btn-secondary-color: var(--secondary-foreground);
            --cc-btn-secondary-hover-bg: color-mix(in oklch, var(--secondary) 80%, transparent);
            --cc-btn-secondary-hover-color: var(--secondary-foreground);
            --cc-separator-border-color: var(--border);
            --cc-cookie-category-block-bg: var(--muted);
            --cc-cookie-category-block-hover-bg: color-mix(in oklch, var(--muted) 80%, transparent);
            --cc-section-border: var(--border);
            --cc-overlay-bg: rgba(0, 0, 0, 0.65);
            --cc-toggle-on-bg: var(--primary);
            --cc-toggle-off-bg: var(--muted);
            --cc-toggle-readonly-bg: var(--muted);
          }
          #cc-main {
            --cc-bg: var(--popover);
            --cc-primary-color: var(--popover-foreground);
            --cc-secondary-color: var(--muted-foreground);
            --cc-btn-primary-bg: var(--primary);
            --cc-btn-primary-color: var(--primary-foreground);
            --cc-btn-primary-hover-bg: color-mix(in oklch, var(--primary) 90%, transparent);
            --cc-btn-primary-hover-color: var(--primary-foreground);
            --cc-btn-secondary-bg: var(--secondary);
            --cc-btn-secondary-color: var(--secondary-foreground);
            --cc-btn-secondary-hover-bg: color-mix(in oklch, var(--secondary) 80%, transparent);
            --cc-btn-secondary-hover-color: var(--secondary-foreground);
            --cc-separator-border-color: var(--border);
            --cc-cookie-category-block-bg: var(--muted);
            --cc-cookie-category-block-hover-bg: color-mix(in oklch, var(--muted) 80%, transparent);
            --cc-section-border: var(--border);
            --cc-overlay-bg: rgba(0, 0, 0, 0.35);
            --cc-toggle-on-bg: var(--primary);
            --cc-toggle-off-bg: var(--muted);
            --cc-toggle-readonly-bg: var(--muted);
          }
        `;
        document.head.appendChild(style);

        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.umd.js";
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          window.CookieConsent.run({
            cookie: {
              name: "cc_cookie",
              expiresAfterDays: 365,
            },
            guiOptions: {
              consentModal: {
                layout: "cloud inline",
                position: "bottom right",
                equalWeightButtons: true,
                flipButtons: false,
              },
              preferencesModal: {
                layout: "box",
                equalWeightButtons: true,
                flipButtons: false,
              },
            },
            onChange: () => {
              if (
                window.CookieConsent.getUserPreferences().rejectedCategories.indexOf(
                  "necessary",
                ) < 0
              ) {
                document.cookie =
                  "cookie_consent=1; path=/; max-age=" + 365 * 24 * 60 * 60;
              }
            },
            onModalHide: () => {
              if (
                window.CookieConsent.getUserPreferences().rejectedCategories.indexOf(
                  "necessary",
                ) < 0
              ) {
                document.cookie =
                  "cookie_consent=1; path=/; max-age=" + 365 * 24 * 60 * 60;
              }
            },
            categories: {
              necessary: {
                enabled: true,
                readOnly: true,
              },
              analytics: {
                autoClear: {
                  cookies: [{ name: /^_ga/ }, { name: "_gid" }],
                },
                services: {
                  ga: {
                    label: "Google Analytics",
                    onAccept: () => {},
                    onReject: () => {},
                  },
                  youtube: {
                    label: "Youtube Embed",
                    onAccept: () => {},
                    onReject: () => {},
                  },
                },
              },
            },
            language: {
              default: "en",
              translations: {
                en: {
                  consentModal: {
                    title: "We use cookies",
                    description:
                      'We use cookies to provide our services and for analytics and marketing. To find out more about our use of cookies, please see our Privacy Policy. By continuing to browse our website, you agree to our use of cookies. <a href="page/cookie-policy">Cookie policy</a>',
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Accept Necessary",
                    showPreferencesBtn: "Manage Individual preferences",
                    footer: ``,
                  },
                  preferencesModal: {
                    title: "Manage cookie preferences",
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Accept Necessary",
                    savePreferencesBtn: "Accept current selection",
                    closeIconLabel: "Close modal",
                    serviceCounterLabel: "Service|Services",
                    sections: [
                      {
                        title: "Your Privacy Choices",
                        description: `In this panel you can express some preferences related to the processing of your personal information. You may review and change expressed choices at any time by resurfacing this panel via the provided link. To deny your consent to the specific processing activities described below, switch the toggles to off or use the "Reject all" button and confirm you want to save your choices.`,
                      },
                      {
                        title: "Strictly Necessary",
                        description:
                          "These cookies are essential for the proper functioning of the website and cannot be disabled.",
                        linkedCategory: "necessary",
                      },
                      {
                        title: "Performance and Analytics",
                        description:
                          "These cookies collect information about how you use our website. All of the data is anonymized and cannot be used to identify you.",
                        linkedCategory: "analytics",
                      },
                      {
                        title: "More information",
                        description:
                          'For any queries in relation to my policy on cookies and your choices, please <a href="contact">contact us</a>',
                      },
                    ],
                  },
                },
              },
            },
          });
        };
      }
    }
  }, [enabled]);

  return null;
};

export default CookieConsentComponent;
