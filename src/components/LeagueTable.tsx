// src/components/LeagueTable.tsx
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/src/theme/colors";
import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { typography } from "../theme/typography";

export type LeagueTableRow = {
  idTeam: string;
  rank: number;
  name: string;
  badgeUri?: string;
  played: number;
  win: number;
  points: number;
};

export type LeagueTableProps = {
  data: LeagueTableRow[];
  /** Highlight the row for this team */
  currentTeamId?: string;
};

const LeagueTable: React.FC<LeagueTableProps> = ({ data, currentTeamId }) => {
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 5,
      alignItems: "center",
    },
    cell: {
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.medium,
    },
    headerCell: {
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.medium,
    },
    badge: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
  });
  const renderItem = ({ item }: { item: LeagueTableRow }) => {
    const isCurrent = item.idTeam === currentTeamId;
    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: isCurrent
              ? // if this is the “current” team row, use borderLight in light mode, otherwise backgroundSecondary
                colorScheme === "light"
                ? theme.borderLight
                : theme.backgroundSecondary
              : // if not current, just use the normal background
                theme.background,
          },
        ]}
      >
        <Text
          style={[
            styles.cell,
            {
              color: theme.onBackground,
              flex: 0.5,
              textAlign: "center",
              marginLeft: 5,
            },
          ]}
        >
          {item.rank}
        </Text>
        <View
          style={{
            flex: 5,
            flexDirection: "row",
            alignItems: "center",
            marginLeft: 10,
          }}
        >
          {item.badgeUri && (
            <Image source={{ uri: item.badgeUri }} style={styles.badge} />
          )}
          <Text
            style={[
              styles.cell,
              {
                color: theme.onBackground,
                marginLeft: item.badgeUri ? 8 : 0,
              },
            ]}
          >
            {item.name}
          </Text>
        </View>
        <Text style={[styles.cell, { color: theme.onBackground, flex: 1 }]}>
          {item.played}
        </Text>
        <Text style={[styles.cell, { color: theme.onBackground, flex: 1 }]}>
          {item.win}
        </Text>
        <Text
          style={[
            styles.cell,
            {
              color: theme.onBackground,
              flex: 1,
            },
          ]}
        >
          {item.points}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.idTeam}
      ListHeaderComponent={() => (
        <View
          style={[
            styles.row,
            {
              backgroundColor:
                colorScheme === "light"
                  ? theme.borderLight
                  : theme.backgroundSecondary,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
            },
          ]}
        >
          <Text
            style={[
              styles.headerCell,
              { color: theme.onBackground, flex: 1, marginLeft: 5 },
            ]}
          >
            Poz
          </Text>
          <Text
            style={[
              styles.headerCell,
              { color: theme.onBackground, flex: 5, marginLeft: -5 },
            ]}
          >
            Echipa
          </Text>
          <Text
            style={[styles.headerCell, { color: theme.onBackground, flex: 1 }]}
          >
            Mj
          </Text>
          <Text
            style={[styles.headerCell, { color: theme.onBackground, flex: 1 }]}
          >
            W
          </Text>
          <Text
            style={[styles.headerCell, { color: theme.onBackground, flex: 1 }]}
          >
            Pct
          </Text>
        </View>
      )}
      renderItem={renderItem}
      stickyHeaderIndices={[0]}
    />
  );
};

export default LeagueTable;
