"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (posthog.__loaded) {
      posthog.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en-GB">
      <body>
        <main
          style={{
            alignItems: "center",
            background: "#f4f7f5",
            color: "#0c2b26",
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <section style={{ maxWidth: "520px", textAlign: "center" }}>
            <p style={{ color: "#087f73", fontWeight: 800, letterSpacing: "0.12em" }}>
              QUOTE-CHASER
            </p>
            <h1 style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", margin: "16px 0" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "1.125rem", lineHeight: 1.6 }}>
              Your information is safe. Please try that again.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#087f73",
                border: 0,
                borderRadius: "14px",
                color: "white",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 800,
                marginTop: "24px",
                minHeight: "52px",
                padding: "0 28px",
              }}
              type="button"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

