import { NativeTabs } from "expo-router/native-tabs";

/** The main sections: the recipe list, the meal plan, the grocery list and settings. Recipe pages open above this. */
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "book", selected: "book.fill" }} md="menu_book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="planner">
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "calendar", selected: "calendar" }} md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grocery">
        <NativeTabs.Trigger.Label>Grocery list</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "cart", selected: "cart.fill" }} md="shopping_cart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
