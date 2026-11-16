import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { opacity, radius, sizes, spacing, useTheme } from "@/theme";

import { IconButton } from "./icon-button";
import { Text } from "./text";

export type RecipeRowProps = {
  name: string;
  image?: string;
  /** Yield and time text. */
  meta?: string;
  /** Shows a heart that fills when true. Leave `onToggleFavourite` out to hide it. */
  favourite?: boolean;
  onToggleFavourite?: () => void;
  onPress: () => void;
};

/** One row in the recipe list. */
export function RecipeRow({ name, image, meta, favourite = false, onToggleFavourite, onPress }: RecipeRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <Image
        source={image ? { uri: image } : undefined}
        style={{
          width: sizes.thumbnail,
          height: sizes.thumbnail,
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
        }}
        contentFit="cover"
      />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text variant="heading" numberOfLines={2}>
          {name}
        </Text>
        {meta ? <Text variant="muted">{meta}</Text> : null}
      </View>
      {onToggleFavourite ? (
        <IconButton
          symbol={favourite ? "favourited" : "favourite"}
          label={favourite ? "Remove from favourites" : "Add to favourites"}
          tintColor={favourite ? colors.danger : colors.muted}
          onPress={onToggleFavourite}
        />
      ) : null}
    </Pressable>
  );
}
