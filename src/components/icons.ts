/** Icons by meaning. Add new ones here, never at the call site. */
export const icons = {
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  trash: { ios: "trash", android: "delete", web: "delete" },
  share: { ios: "square.and.arrow.up", android: "share", web: "share" },
} as const;

export type IconName = keyof typeof icons;
