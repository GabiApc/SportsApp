// src/theme/colors.ts

export interface ThemeColors {
  primary: string; // culoarea principală
  secondary: string; // accent secundar
  background: string; // fundal principal
  backgroundSecondary: string; // fundal secundar (ex. carduri, conţinut)
  backgroundThird?: string; // fundal terciar (ex. carduri, conţinut)
  onBackground: string; // text pe background
  textSecondary: string; // text secundar / subtitluri
  textPrimary: string; // text pe butoane/background primar
  onSurface: string; // elemente UI albe pe teme
  disabled: string; // stări disabled
  borderLight: string; // linii subţiri
  border: string; // linii medii
  borderDark: string; // linii mai închise
}

export const Colors: Record<"light" | "dark", ThemeColors> = {
  light: {
    primary: "#FF5050", // primaryBrand
    secondary: "#FFDADA", // secondaryBrand
    background: "#FFFFFF", // lightBackground
    backgroundSecondary: "#FFFFFF", // grayBackground
    onBackground: "#111111", // title
    textSecondary: "#9CA4AB", // subtitle
    textPrimary: "#FFFFFF", // textWhite
    onSurface: "#FFFFFF", // elemWhite
    disabled: "#D6D6D6", // disabledElem
    borderLight: "#F2F2F2", // stroke1
    border: "#E3E7EC", // stroke2
    borderDark: "#D6D6D6", // stroke3
  },
  dark: {
    primary: "#FF5050", // primaryBrand
    secondary: "#4C2836", // secondaryBrand
    background: "#181826", // backgroundDark
    backgroundSecondary: "#1D1D2F", // secondaryBackground
    onBackground: "#FFFFFF", // title
    textSecondary: "#8D8D8D", // subtitle
    textPrimary: "#FFFFFF", // textWhite
    onSurface: "#FFFFFF", // elemWhite
    disabled: "#D6D6D6", // elemDisabled
    borderLight: "#2B2C39", // stroke
    border: "#272735", // stroke2
    borderDark: "#000000", // stroke3 (placeholder)
  },
};
