// src/app/details/[teamId].tsx
import HorizontalTabBar from "@/src/components/horizontalTabBar";
import TeamCard from "@/src/components/TeamCard";
import { useCachedTeams } from "@/src/hooks/useCachedTeams";
import { useTheme } from "@/src/hooks/useTheme";
import { Colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PremierLeagueLogo = require("../../../assets/images/logoLeague.png");

export default function DetailsScreen() {
  const { colorScheme } = useTheme();
  console.log(colorScheme);
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();

  const { teams, loading } = useCachedTeams();
  const detail = teams.find((t) => t.idTeam === teamId);

  const [activeTab, setActiveTab] = React.useState<"Descriere" | "Rezultate">(
    "Descriere",
  );
  const [expanded, setExpanded] = React.useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      height: "30%",
      backgroundColor: theme.primary,
      width: "100%",
      paddingTop: 15,
      paddingHorizontal: 40,
      borderBottomLeftRadius: 50,
      borderBottomRightRadius: 50,
    },
    backButton: { position: "absolute", left: 30, top: 50, zIndex: 2 },
    title: {
      fontSize: typography.fontSizes.title,
      fontFamily: typography.fonts.medium,
      textAlign: "center",
      marginTop: 40,
      color: theme.onSurface,
    },
    tabContainer: {
      top: "10%",
      width: "80%",
      alignSelf: "center",
      justifyContent: "flex-start",
    },
    section: { padding: 16, width: "85%", alignSelf: "center", marginTop: 100 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: {
      color: theme.onBackground,
      textAlign: "center",
      marginTop: 20,
      paddingHorizontal: 16,
    },
    description: {
      fontSize: typography.fontSizes.body,
      lineHeight: 20,
      color: theme.onBackground,
    },
    toggleText: {
      marginTop: 8,
      fontSize: typography.fontSizes.caption,
      color: theme.primary,
      fontFamily: typography.fonts.medium,
    },
    fieldLabel: {
      marginTop: 12,
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.medium,
      color: theme.onBackground,
    },
    fieldValue: {
      fontSize: typography.fontSizes.body,
      color: theme.onBackground,
      marginTop: 2,
    },
    fieldLink: {
      fontSize: typography.fontSizes.body,
      color: theme.primary,
      marginTop: 2,
    },
  });

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          Detaliile echipei nu au fost găsite.
        </Text>
      </SafeAreaView>
    );
  }

  // derive fields
  const location = detail.strStadiumLocation ?? detail.strCountry;
  // const nicknames = detail.strKeywords?.split(",").map((s) => s.trim()) || [];
  const leagues = [detail.strLeague].filter(Boolean) as string[];
  const mascots = detail.strMascots?.split(",").map((s) => s.trim()) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalii echipă</Text>
        <TeamCard
          logoUri={detail.strBadge}
          name={detail.strTeam}
          subtitle={detail.strStadium ?? ""}
          watermark={PremierLeagueLogo}
        />
      </View>

      <View style={styles.tabContainer}>
        <HorizontalTabBar
          tabs={["Descriere", "Rezultate"]}
          activeTab={activeTab}
          onTabPress={(tab) => setActiveTab(tab as "Descriere" | "Rezultate")}
        />
      </View>

      {activeTab === "Descriere" && (
        <ScrollView style={styles.section}>
          {/* Preview / full description */}
          <Text
            style={styles.description}
            numberOfLines={expanded ? undefined : 3}
          >
            {detail.strDescriptionEN ?? "Nicio descriere disponibilă."}
          </Text>
          <Text
            style={styles.toggleText}
            onPress={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Vezi mai puțin" : "Vezi mai mult"}
          </Text>

          {/* Static fields */}
          <Text style={styles.fieldLabel}>Arena/Stadium:</Text>
          <Text style={styles.fieldValue}>{detail.strStadium}</Text>

          <Text style={styles.fieldLabel}>Manager:</Text>
          <Text style={styles.fieldValue}>{detail.strManager}</Text>

          <Text style={styles.fieldLabel}>Founded:</Text>
          <Text style={styles.fieldValue}>{detail.intFormedYear}</Text>

          <Text style={styles.fieldLabel}>Location:</Text>
          <Text style={styles.fieldLink}>{location}</Text>

          {/* {nicknames.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Nicknames:</Text>
              <Text style={styles.fieldValue}>{nicknames.join(", ")}</Text>
            </>
          )} */}

          {leagues.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Leagues:</Text>
              <Text style={styles.fieldValue}>{leagues.join(", ")}</Text>
            </>
          )}

          {mascots.length > 0 && (
            <>
              <Text style={styles.fieldLabel}>Mascots:</Text>
              <Text style={styles.fieldValue}>{mascots.join(", ")}</Text>
            </>
          )}
        </ScrollView>
      )}

      {activeTab === "Rezultate" && (
        <View style={styles.section}>
          <Text style={styles.errorText}>
            Rezultatele nu sunt încă implementate.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
