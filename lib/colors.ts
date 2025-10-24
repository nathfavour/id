// Centralized color configuration from environment variables
export const colors = {
  primary: process.env.NEXT_PUBLIC_COLORS_PRIMARY || '#f9c806',
  secondary: process.env.NEXT_PUBLIC_COLORS_SECONDARY || '#231f0f',
  foreground: process.env.NEXT_PUBLIC_COLORS_FOREGROUND || '#bbb49b',
  background: process.env.NEXT_PUBLIC_COLORS_BACKGROUND || '#181711',
};
