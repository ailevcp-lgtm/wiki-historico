import { ImageResponse } from "next/og";

export const ogImageSize = {
  width: 1200,
  height: 630
};

export const ogImageContentType = "image/png";

interface OgImageOptions {
  eyebrow: string;
  title: string;
  description?: string;
  accentColor?: string;
  domainLabel?: string;
}

export function buildOgImage({
  eyebrow,
  title,
  description,
  accentColor = "#2563eb",
  domainLabel = "wiki.aile.com.ar"
}: OgImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, #08111f 0%, #102847 52%, #16335a 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "28px",
            background: "rgba(10, 15, 26, 0.58)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              padding: "44px 48px 20px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px"
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "999px",
                    background: accentColor
                  }}
                />
                <div
                  style={{
                    fontSize: "24px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#bfdbfe"
                  }}
                >
                  {eyebrow}
                </div>
              </div>
              <div
                style={{
                  fontSize: "24px",
                  color: "#e2e8f0"
                }}
              >
                AILE
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "66px",
                  fontWeight: 700,
                  lineHeight: 1.06,
                  maxWidth: "920px"
                }}
              >
                {title}
              </div>

              {description ? (
                <div
                  style={{
                    display: "flex",
                    maxWidth: "880px",
                    fontSize: "30px",
                    lineHeight: 1.45,
                    color: "#cbd5e1"
                  }}
                >
                  {description}
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              padding: "30px 48px 36px",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              background:
                "linear-gradient(90deg, rgba(37,99,235,0.24) 0%, rgba(15,23,42,0.18) 100%)"
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  color: "#93c5fd"
                }}
              >
                {domainLabel}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "#cbd5e1"
                }}
              >
                Con soporte para compartir en Google, WhatsApp y redes sociales
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px 22px",
                borderRadius: "999px",
                background: "rgba(8, 17, 31, 0.76)",
                fontSize: "22px",
                color: "#e2e8f0"
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "999px",
                  background: accentColor
                }}
              />
              aile.com.ar
            </div>
          </div>
        </div>
      </div>
    ),
    ogImageSize
  );
}
