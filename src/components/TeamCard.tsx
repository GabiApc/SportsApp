// src/components/TeamCard.tsx
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { useTheme } from "../hooks/useTheme";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

export type TeamCardProps = {
  logoUri: string;
  name: string;
  subtitle?: string;
  /** optional watermark image (e.g. league logo) */
  watermark?: ImageSourcePropType;
};

const TeamCard: React.FC<TeamCardProps> = ({
  logoUri,
  name,
  subtitle,
  watermark,
}) => {
  const { colorScheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
      {watermark && (
        <Image
          source={watermark}
          style={[styles.watermark, { tintColor: theme.textSecondary }]}
          resizeMode="contain"
        />
      )}
      <View style={styles.content}>
        {logoUri.endsWith(".svg") ? (
          <SvgUri width={95} height={95} uri={logoUri} style={styles.logo} />
        ) : (
          <Image source={{ uri: logoUri }} style={styles.logo} />
        )}
        <Text
          style={[
            styles.name,
            {
              color: theme.onBackground,
              marginTop: 10,
            },
          ]}
        >
          {name}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.textSecondary,
                fontFamily: typography.fonts.regular,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default TeamCard;

const CARD_BORDER_RADIUS = 10;

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_BORDER_RADIUS,
    overflow: "hidden",
    width: "100%",
    height: 200,

    position: "absolute",
    alignSelf: "center",
    top: "45%",
    elevation: 10,
  },
  watermark: {
    position: "absolute",
    right: -50,
    bottom: -85,
    width: 290,
    height: 290,
    opacity: 0.15,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  logo: {
    width: 70,
    height: 70,
    marginTop: 15,
  },
  name: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.fontSizes.title,
    lineHeight: typography.lineHeights.caption,
  },
  subtitle: {
    fontSize: typography.fontSizes.caption,
    lineHeight: typography.lineHeights.caption,
    marginTop: 4,
  },
});
