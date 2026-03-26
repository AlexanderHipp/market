import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market framing",
  description: "Turn a vague idea into a clear market view, then save a brief",
};

export default function FramingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
