// Centralized color configuration from environment variables
export const colorsDark = {
  primary: process.env.NEXT_PUBLIC_COLORS_PRIMARY || '#f9c806',
  secondary: process.env.NEXT_PUBLIC_COLORS_SECONDARY || '#231f0f',
  foreground: process.env.NEXT_PUBLIC_COLORS_FOREGROUND || '#bbb49b',
  background: process.env.NEXT_PUBLIC_COLORS_BACKGROUND || '#181711',
};

export const colorsLight = {
  primary: process.env.NEXT_PUBLIC_COLORS_PRIMARY_LIGHT || '#f9c806',
  secondary: process.env.NEXT_PUBLIC_COLORS_SECONDARY_LIGHT || '#f5f5f5',
  foreground: process.env.NEXT_PUBLIC_COLORS_FOREGROUND_LIGHT || '#333333',
  background: process.env.NEXT_PUBLIC_COLORS_BACKGROUND_LIGHT || '#ffffff',
};

export const colors = colorsDark;
