import type { Metadata } from "next";
import { BriefDetail } from "./brief-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Market brief · ${id.slice(0, 8)}`,
    description: "Saved market framing brief",
  };
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BriefDetail id={id} />;
}
