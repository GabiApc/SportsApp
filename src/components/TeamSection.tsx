// src/components/TeamsSection.tsx
import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { SvgUri } from "react-native-svg";

import { useTheme } from "@/context/ThemeContext";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

export type Team = {
  id: string;
  name: string;
  leagueInfo: string;
  logoUri: string;
  favorited: boolean;
};

export type TeamsSectionProps = {
  /** Titlul secțiunii (opțional) */
  title?: string;
  /** Array-ul de echipe */
  teams: Team[];
  /** Callback când apeși pe cardul unei echipe */
  onPressTeam?: (team: Team) => void;
  /** Callback când apeși pe butonul de favorite */
  onToggleFavorite?: (team: Team) => void;
  /** Stil suplimentar pe FlatList, dacă ai nevoie (opțional) */
  listStyle?: StyleProp<ViewStyle>;
};

export const TeamsSection: React.FC<TeamsSectionProps> = ({
  title = "Echipe populare",
  teams,
  onPressTeam,
  onToggleFavorite,
  listStyle,
}) => {
  // Obținem tema (dark/light)
  const { colorScheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Cream stilurile în funcție de temă
  const styles = createStyles(theme);

  // Fiecare item din listă
  const renderItem = ({ item }: ListRenderItemInfo<Team>) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => onPressTeam?.(item)}
    >
      {item.logoUri.endsWith(".svg") ? (
        <SvgUri width={40} height={40} uri={item.logoUri} style={styles.logo} />
      ) : (
        <Image source={{ uri: item.logoUri }} style={styles.logo} />
      )}
      <View style={styles.texts}>
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.leagueInfo}>{item.leagueInfo}</Text>
      </View>
      <TouchableOpacity
        hitSlop={8}
        onPress={() => onToggleFavorite?.(item)}
        style={{
          borderWidth: 1.5,
          borderColor: theme.borderLight,
          borderRadius: 25,
          padding: 9,
          alignContent: "center",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: item.favorited
            ? theme.secondary
            : theme.backgroundSecondary,
        }}
      >
        <AntDesign
          name={item.favorited ? "heart" : "hearto"}
          size={21}
          color={item.favorited ? theme.primary : theme.disabled}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Titlul secțiunii */}
      <Text style={styles.header}>{title}</Text>

      {/* FlatList cu scroll intern pe Web */}
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        /**
         * Stiluri pentru comportamentul scroll:
         * 1) flex: 1    => lista ocupă tot spațiul rămas în container (sub header)
         * 2) pe Web: overflow: "auto" + display: "flex" pentru scroll intern
         * 3) listStyle => un stil suplimentar, dacă vrei
         */
        style={[
          { flex: 1 },
          Platform.OS === "web"
            ? { overflow: "auto" as const, display: "flex" }
            : {},
          listStyle as any,
        ]}
      />
    </View>
  );
};

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1, // containerul își ia înălțimea din părinte
      marginTop: 16,
      paddingHorizontal: 16,
    },
    header: {
      fontSize: typography.fontSizes.body,
      fontFamily: typography.fonts.bold,
      marginBottom: 12,
      color: theme.onBackground,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 12,
      paddingVertical: 17,
      paddingHorizontal: 16,
      backgroundColor: theme.backgroundSecondary,
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      resizeMode: "cover",
    },
    texts: {
      flex: 1,
      marginLeft: 12,
    },
    teamName: {
      fontSize: typography.fontSizes.body,
      fontFamily: typography.fonts.medium,
      color: theme.onBackground,
      marginBottom: -2,
      marginTop: 2,
    },
    leagueInfo: {
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.regular,
      color: theme.textSecondary,
    },
  });
