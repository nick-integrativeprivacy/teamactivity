export const cleanSpotifyTrackId = (trackIdOrUrl: string) => {
  const value = trackIdOrUrl.trim();

  if (!value) {
    return "";
  }

  if (!value.includes("spotify.com")) {
    return value;
  }

  return value.split("/track/")[1]?.split("?")[0]?.split("/")[0] ?? value;
};
