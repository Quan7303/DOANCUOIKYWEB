"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";

export default function ThemeInitializer() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return <Toaster position="top-right" />;
}
