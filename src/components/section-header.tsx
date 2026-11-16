import { spacing } from "@/theme";

import { Text } from "./text";

export type SectionHeaderProps = {
  title: string;
  count?: number;
};

/** Heading for a block such as "Ingredients" or "Steps". */
export function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <Text variant="heading" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
      {count === undefined ? title : `${title} (${count})`}
    </Text>
  );
}
