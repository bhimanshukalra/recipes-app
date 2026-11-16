import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AppBar, Button, ContentColumn, Screen, SectionHeader, Text } from "@/components";
import { parseBackup } from "@/backup";
import { buildBackup, restoreBackup, type RestoreResult } from "@/storage";
import { spacing, useTheme } from "@/theme";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function describeRestore(result: RestoreResult): string {
  const parts = [
    `${plural(result.recipesAdded, "recipe")} added`,
    result.recipesSkipped > 0 ? `${result.recipesSkipped} already here` : undefined,
    result.mealsAdded > 0 ? `${plural(result.mealsAdded, "planned meal")} added` : undefined,
    result.groceryItemsAdded > 0 ? `${plural(result.groceryItemsAdded, "grocery item")} added` : undefined,
  ];
  return parts.filter(Boolean).join(", ") + ".";
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | undefined>(undefined);

  const exportBackup = async () => {
    setBusy(true);
    setMessage(undefined);
    try {
      const backup = await buildBackup(db);
      const file = new File(Paths.cache, `recipes-backup-${new Date().toISOString().slice(0, 10)}.json`);
      file.create({ overwrite: true });
      file.write(JSON.stringify(backup, null, 2));
      if (!(await Sharing.isAvailableAsync())) {
        setMessage({ text: "Sharing is not available on this device.", error: true });
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json" });
      setMessage({ text: `Exported ${plural(backup.recipes.length, "recipe")}.` });
    } catch (error) {
      setMessage({ text: `Export failed: ${error instanceof Error ? error.message : "unknown error"}`, error: true });
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async () => {
    setBusy(true);
    setMessage(undefined);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
      if (picked.canceled) return;
      const backup = parseBackup(new File(picked.assets[0].uri).textSync());
      setMessage({ text: `Imported: ${describeRestore(await restoreBackup(db, backup))}` });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Import failed.", error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppBar title="Settings" />
      <ContentColumn>
        <ScrollView contentContainerStyle={{ padding: spacing.xxl, gap: spacing.md }}>
          <SectionHeader title="Backup" />
          <Text variant="muted">
            Your recipes, tags, favourites, grocery list and meal plan live only on this phone. Export a
            backup file to keep it somewhere safe (Files, iCloud Drive, AirDrop), and import it to restore
            on this or another phone. Importing only adds: nothing already here is changed or removed.
          </Text>
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <Button label="Export backup" disabled={busy} onPress={exportBackup} />
            <Button label="Import backup" variant="secondary" disabled={busy} onPress={importBackup} />
          </View>
          {message ? (
            <Text variant={message.error ? undefined : "muted"} style={message.error ? { color: colors.danger } : undefined}>
              {message.text}
            </Text>
          ) : null}
        </ScrollView>
      </ContentColumn>
    </Screen>
  );
}
