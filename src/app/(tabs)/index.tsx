import Header from "@/src/components/Header";
import { Team, TeamsSection } from "@/src/components/TeamSection";
import { useTheme } from "@/src/hooks/useTheme";
import { Colors } from "@/src/theme/colors";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
const initialTeams: Team[] = [
  {
    id: "1",
    name: "Arsenal",
    leagueInfo: "ENG | Premiere League",
    logoUri: "https://crests.football-data.org/57.svg",
    favorited: false,
  },
  {
    id: "2",
    name: "Manchester City",
    leagueInfo: "ENG | Premiere League",
    logoUri: "https://crests.football-data.org/65.svg",
    favorited: false,
  },
  {
    id: "3",
    name: "Chelsea F.C.",
    leagueInfo: "ENG | Premiere League",
    logoUri: "https://crests.football-data.org/61.svg",
    favorited: false,
  },
  {
    id: "4",
    name: "Manchester United",
    leagueInfo: "ENG | Premiere League",
    logoUri: "https://crests.football-data.org/66.svg",
    favorited: false,
  },
  {
    id: "5",
    name: "Chelsea F.C.",
    leagueInfo: "ENG | Premiere League",
    logoUri: "https://crests.football-data.org/61.svg",
    favorited: false,
  },
  {
    id: "6",
    name: "Manchester United",
    leagueInfo: "ENG | Premiere League",
    logoUri: "https://crests.football-data.org/66.svg",
    favorited: false,
  },
  {
    id: "7",
    name: "Manchester United",
    leagueInfo: "ENG | Premiere League",
    logoUri: "https://crests.football-data.org/66.svg",
    favorited: false,
  },
];

export default function Index() {
  const { colorScheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
    },
    section: {
      width: "100%",
      paddingHorizontal: 16,
      height: "66%",
    },
  });
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  const toggleFav = (team: Team) => {
    setTeams((ts) =>
      ts.map((t) => (t.id === team.id ? { ...t, favorited: !t.favorited } : t)),
    );
  };

  const onTeamPress = (team: Team) => {
    console.log("Ai apăsat pe", team.name);
    // navighează la detaliile echipei…
  };

  return (
    <View style={styles.container}>
      <Header
        onProfilePress={() => {}}
        onSearchChange={(q) => console.log("Căutare:", q)}
        iconName={"user"}
      />
      <View style={styles.section}>
        <TeamsSection
          title="Echipe populare"
          teams={teams}
          onPressTeam={onTeamPress}
          onToggleFavorite={toggleFav}
        />
      </View>
    </View>
  );
}
