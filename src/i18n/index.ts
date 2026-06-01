import { en } from "@/i18n/en";

export const defaultLocale = "en";
export const dictionaries = {
  en
};

export type Locale = keyof typeof dictionaries;
