/** Icons by meaning. Add new ones here, never at the call site. */
export const icons = {
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  trash: { ios: "trash", android: "delete", web: "delete" },
  share: { ios: "square.and.arrow.up", android: "share", web: "share" },
  favourite: { ios: "heart", android: "favorite", web: "favorite" },
  favourited: { ios: "heart.fill", android: "favorite", web: "favorite" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  close: { ios: "xmark", android: "close", web: "close" },
  add: { ios: "plus", android: "add", web: "add" },
  cart: { ios: "cart", android: "shopping_cart", web: "shopping_cart" },
  link: { ios: "link", android: "link", web: "link" },
  checked: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  unchecked: { ios: "circle", android: "radio_button_unchecked", web: "radio_button_unchecked" },
} as const;

export type IconName = keyof typeof icons;
