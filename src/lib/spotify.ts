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

const spotifyTrackLabels: Record<string, string> = {
  "5QHytyVuaHhIVKwyBdobl1": "Genesis - Jinsang",
  "12sb7bV0vxOhzZ11nQPORa": "the day LA ran out of Adderall - James Droll",
  "6kx7mvzmJKJmYyNGA8wehA": "Medicine - Dabin, Keenan Te",
  "3IvTwPCCjfZczCN2k4qPiH": "Dirty Work - Steely Dan",
};

export const getSpotifyTrackLabel = (trackIdOrUrl: string, fallbackLabel: string) =>
  spotifyTrackLabels[cleanSpotifyTrackId(trackIdOrUrl)] ?? fallbackLabel;
