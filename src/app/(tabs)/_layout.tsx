import { NativeTabs } from "expo-router/native-tabs";

/** The two main sections: the recipe list and the grocery list. Recipe pages open above this. */
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "book", selected: "book.fill" }} md="menu_book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grocery">
        <NativeTabs.Trigger.Label>Grocery list</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "cart", selected: "cart.fill" }} md="shopping_cart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
