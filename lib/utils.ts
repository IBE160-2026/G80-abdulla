import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Fontstørrelsene fra tailwind.config.ts. Uten dem tror tailwind-merge at
// text-badge er en farge og fjerner den eller tekstfargen i cn().
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["title", "card-title", "meta", "badge"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
