import { View } from "react-native";

import { spacing } from "@/theme";

import { IconButton } from "./icon-button";
import { Text } from "./text";

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** What is counted, shown after the number: "servings". */
  label: string;
  min?: number;
  max?: number;
};

/** A − / + control with the current value and what it counts: "− 4 servings +". */
export function Stepper({ value, onChange, label, min = 1, max = 99 }: StepperProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
      <IconButton
        symbol="remove"
        label={`Fewer ${label}`}
        onPress={() => onChange(Math.max(min, value - 1))}
      />
      <Text variant="heading" style={{ minWidth: 96, textAlign: "center" }}>
        {value} {label}
      </Text>
      <IconButton symbol="add" label={`More ${label}`} onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}
