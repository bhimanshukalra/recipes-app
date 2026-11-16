/** Icons by meaning. Add new ones here, never at the call site. */
export const icons = {
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  trash: { ios: "trash", android: "delete", web: "delete" },
  share: { ios: "square.and.arrow.up", android: "share", web: "share" },
  checked: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  unchecked: { ios: "circle", android: "radio_button_unchecked", web: "radio_button_unchecked" },
} as const;

export type IconName = keyof typeof icons;
