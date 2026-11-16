import { View } from "react-native";

import { spacing } from "@/theme";

import { Text } from "./text";

export type EmptyStateProps = {
  title: string;
  message?: string;
  /** Usually a `Button`. */
  action?: React.ReactNode;
};

/** Centred message for an empty list. */
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xxl,
        gap: spacing.md,
      }}>
      <Text variant="title" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {message ? (
        <Text variant="muted" style={{ textAlign: "center" }}>
          {message}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
