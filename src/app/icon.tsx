import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4CF36",
          borderRadius: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M3.5 17.5 6 8.5l4 4.5L12 5.5l2 7.5 4-4.5 2.5 9H3.5Z"
            fill="#141E68"
          />
          <path d="M4 19.5h16v1.5H4z" fill="#141E68" />
          <circle cx="6" cy="7.5" r="1.4" fill="#141E68" />
          <circle cx="12" cy="4.5" r="1.4" fill="#141E68" />
          <circle cx="18" cy="7.5" r="1.4" fill="#141E68" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
