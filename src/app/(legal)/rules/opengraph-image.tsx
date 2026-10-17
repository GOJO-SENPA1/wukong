import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "How judging works on Wukong";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Task and judging rules",
    title: "How every task",
    accent: "is judged.",
    lede: "Public rubrics, integrity checks, caps the model can't override, a quality bar, and who gets paid.",
    facts: ["Public rubric", "Quality bar 25", "Top 3 paid"],
  });
}
