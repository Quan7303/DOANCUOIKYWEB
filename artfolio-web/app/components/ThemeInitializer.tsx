"use client";

import { useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";

export default function ThemeInitializer() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return null;
}
