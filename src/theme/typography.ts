// src/theme/typography.ts

export interface Typography {
  fonts: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSizes: {
    h1: number;
    h2: number;
    h3: number;
    title: number;
    body: number;
    caption: number;
    small: number;
  };
  lineHeights: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    caption: number;
  };
  fontWeights: {
    regular: string;
    medium: string;
    bold: string;
  };
}

export const typography: Typography = {
  fonts: {
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    bold: "Poppins-Bold",
  },
  fontSizes: {
    h1: 32,
    h2: 28,
    h3: 24,
    title: 20,
    body: 16,
    caption: 14,
    small: 12,
  },
  lineHeights: {
    h1: 40,
    h2: 36,
    h3: 32,
    body: 24,
    caption: 20,
  },
  fontWeights: {
    regular: "400",
    medium: "500",
    bold: "700",
  },
};
