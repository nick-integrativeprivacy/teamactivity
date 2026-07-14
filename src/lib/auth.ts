export interface AuthPlayer {
  id: string;
  email: string;
  displayName: string;
}

export const deriveDisplayNameFromEmail = (email: string) => {
  const username = email.split("@")[0]?.trim() || "Player";
  const words = username
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "Player";
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
