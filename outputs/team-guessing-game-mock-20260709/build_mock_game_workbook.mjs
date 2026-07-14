import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = new URL(".", import.meta.url).pathname;
const workbook = Workbook.create();

const people = [
  {
    name: "Avery Chen",
    fact: "Restores vintage bicycles on weekends.",
    songId: "4PTG3Z6ehGkBF3zIqYQGSy",
  },
  {
    name: "Blair Ortiz",
    fact: "Can identify every U.S. state by its highway sign shape.",
    songId: "2TpxZ7JUBn3uw46aR7qd6V",
  },
  {
    name: "Casey Novak",
    fact: "Baked sourdough every Sunday for three years.",
    songId: "7ouMYWpwJ422jRcDASZB7P",
  },
  {
    name: "Devon Patel",
    fact: "Completed a sunrise hike in four national parks.",
    songId: "5ChkMS8OtdzJeqyybCc9R5",
  },
  {
    name: "Ellis Wright",
    fact: "Keeps a spreadsheet of favorite movie soundtracks.",
    songId: "0VjIjW4GlUZAMYd2vXMi3b",
  },
  {
    name: "Finley Brooks",
    fact: "Once won a community trivia night by one point.",
    songId: "3AJwUDP919kvQ9QcozQPxg",
  },
  {
    name: "Harper Kim",
    fact: "Learned basic pottery from online videos.",
    songId: "6habFhsOp2NvshLv26DqMb",
  },
  {
    name: "Jordan Reed",
    fact: "Has a handwritten recipe book organized by season.",
    songId: "1mea3bSkSGXuIRvnydlB5b",
  },
  {
    name: "Morgan Stone",
    fact: "Can solve a Rubik's cube in under two minutes.",
    songId: "2takcwOaAZWiXQijPHIx7B",
  },
];

const factShuffle = [4, 7, 0, 5, 2, 8, 1, 6, 3];
const songShuffle = [2, 5, 8, 1, 4, 7, 0, 3, 6];

const palette = {
  black: "#121212",
  panel: "#1E1E1E",
  green: "#1DB954",
  darkGreen: "#0F5C2E",
  white: "#FFFFFF",
  text: "#222222",
  muted: "#666666",
  border: "#D9E2DD",
  paleGreen: "#EAF8EF",
  paleGray: "#F6F7F7",
  warning: "#FFF4D6",
  private: "#FDECEC",
};

function addSheet(name) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  return sheet;
}

function writeValues(sheet, address, values) {
  sheet.getRange(address).values = values;
}

function styleHeader(range, fill = palette.green, fontColor = palette.black) {
  range.format.fill = { color: fill };
  range.format.font = { bold: true, color: fontColor };
  range.format.borders = { preset: "outside", style: "thin", color: palette.border };
  range.format.wrapText = true;
}

function styleBody(range) {
  range.format.borders = {
    insideHorizontal: { style: "thin", color: palette.border },
    top: { style: "thin", color: palette.border },
    bottom: { style: "thin", color: palette.border },
    left: { style: "thin", color: palette.border },
    right: { style: "thin", color: palette.border },
  };
  range.format.wrapText = true;
}

function styleTitle(range) {
  range.format.fill = { color: palette.black };
  range.format.font = { bold: true, color: palette.text, size: 16 };
}

function applyWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
}

function scoreFormulaForRow(rowNumber) {
  const comparisons = people.flatMap((_, index) => {
    const sheetRow = index + 2;
    const factCol = String.fromCharCode("D".charCodeAt(0) + index * 2);
    const songCol = String.fromCharCode("E".charCodeAt(0) + index * 2);
    return [
      `IF(${factCol}${rowNumber}='AnswerKey'!$B$${sheetRow},1,0)`,
      `IF(${songCol}${rowNumber}='AnswerKey'!$C$${sheetRow},1,0)`,
    ];
  });

  return `=IF(LEN(B${rowNumber})=0,"",${comparisons.join("+")})`;
}

function formResponseRow(playerName, playerEmail, picks) {
  const row = [new Date("2026-07-09T14:00:00-04:00"), playerName, playerEmail];

  people.forEach((person, index) => {
    const factPick = picks.facts[index] ?? person.fact;
    const songPick = picks.songs[index] ?? person.songId;
    row.push(factPick, songPick);
  });

  row.push(null);
  return row;
}

const setupSheet = addSheet("Setup");
setupSheet.freezePanes.freezeRows(1);
writeValues(setupSheet, "A1:F1", [["Team Guessing Game setup workbook", "", "", "", "", ""]]);
styleTitle(setupSheet.getRange("A1:F1"));
setupSheet.getRange("A1:F1").format.rowHeight = 30;

writeValues(setupSheet, "A3:B8", [
  ["What this workbook contains", "Mock Google Sheets structure for the React Team Guessing Game."],
  ["Public tab to publish as CSV", "GameData"],
  ["Private scoring source", "AnswerKey"],
  ["Google Form response target", "Form Responses 1"],
  ["Public leaderboard tab", "Leaderboard"],
  ["Max score", 18],
]);
styleHeader(setupSheet.getRange("A3:B3"), palette.paleGreen, palette.text);
styleBody(setupSheet.getRange("A3:B8"));

writeValues(setupSheet, "D3:F9", [
  ["What I still need from you", "Why it matters", "Where it goes"],
  ["Final participant names", "The app renders these as coworker cards.", "GameData column A and AnswerKey column A"],
  ["Final fun facts", "Facts become draggable items and scoring keys.", "GameData column B and AnswerKey column B"],
  ["Final Spotify track IDs or URLs", "Songs become Spotify embeds and scoring keys.", "GameData column C and AnswerKey column C"],
  ["Google Form entry IDs", "The app uses these to silently POST guesses.", ".env.local"],
  ["Published CSV URLs", "The app reads game data and leaderboard from them.", ".env.local"],
  ["Netlify Basic Auth credentials", "Protects the app before JS loads.", "public/_headers"],
]);
styleHeader(setupSheet.getRange("D3:F3"), palette.paleGreen, palette.text);
styleBody(setupSheet.getRange("D3:F9"));

writeValues(setupSheet, "A11:F15", [
  ["Google Sheets formulas to paste after upload", "Target cell", "Formula", "", "", ""],
  [
    "Scoring formula",
    "Form Responses 1!V2",
    "'=ARRAYFORMULA(IF(LEN(B2:B),(D2:D=AnswerKey!B$2)+(E2:E=AnswerKey!C$2)+(F2:F=AnswerKey!B$3)+(G2:G=AnswerKey!C$3)+(H2:H=AnswerKey!B$4)+(I2:I=AnswerKey!C$4)+(J2:J=AnswerKey!B$5)+(K2:K=AnswerKey!C$5)+(L2:L=AnswerKey!B$6)+(M2:M=AnswerKey!C$6)+(N2:N=AnswerKey!B$7)+(O2:O=AnswerKey!C$7)+(P2:P=AnswerKey!B$8)+(Q2:Q=AnswerKey!C$8)+(R2:R=AnswerKey!B$9)+(S2:S=AnswerKey!C$9)+(T2:T=AnswerKey!B$10)+(U2:U=AnswerKey!C$10),\"\"))",
    "",
    "",
    "",
  ],
  [
    "Leaderboard formula",
    "Leaderboard!A1",
    "'=QUERY('Form Responses 1'!B1:V, \"SELECT B, V WHERE B IS NOT NULL ORDER BY V DESC\", 1)",
    "",
    "",
    "",
  ],
  ["Publish CSV", "File > Share > Publish to web", "Publish GameData and Leaderboard as CSV only.", "", "", ""],
  ["Form note", "Google Form settings", "Do not enable Collect email addresses; use a normal Player Email short answer.", "", "", ""],
]);
styleHeader(setupSheet.getRange("A11:F11"), palette.warning, palette.text);
styleBody(setupSheet.getRange("A11:F15"));
setupSheet.getRange("C12:C13").format.wrapText = true;
applyWidths(setupSheet, [30, 30, 78, 28, 46, 42]);

const gameDataSheet = addSheet("GameData");
gameDataSheet.freezePanes.freezeRows(1);
const gameDataRows = [
  ["Names", "Shuffled Facts", "Shuffled Spotify IDs"],
  ...people.map((person, index) => [
    person.name,
    people[factShuffle[index]].fact,
    people[songShuffle[index]].songId,
  ]),
];
writeValues(gameDataSheet, "A1:C10", gameDataRows);
styleHeader(gameDataSheet.getRange("A1:C1"));
styleBody(gameDataSheet.getRange("A1:C10"));
applyWidths(gameDataSheet, [24, 58, 34]);
gameDataSheet.tables.add("A1:C10", true, "GameDataTable");

const answerKeySheet = addSheet("AnswerKey");
answerKeySheet.freezePanes.freezeRows(1);
const answerRows = [
  ["Names", "True Fact ID/Text", "True Song Link/ID"],
  ...people.map((person) => [person.name, person.fact, person.songId]),
];
writeValues(answerKeySheet, "A1:C10", answerRows);
styleHeader(answerKeySheet.getRange("A1:C1"), palette.private, palette.text);
styleBody(answerKeySheet.getRange("A1:C10"));
answerKeySheet.getRange("E1:E3").values = [
  ["Private tab"],
  ["Do not publish this tab as CSV."],
  ["It is the scoring source for correct matches."],
];
styleHeader(answerKeySheet.getRange("E1:E1"), palette.private, palette.text);
styleBody(answerKeySheet.getRange("E1:E3"));
applyWidths(answerKeySheet, [24, 58, 34, 4, 34]);
answerKeySheet.tables.add("A1:C10", true, "AnswerKeyTable");

const formSheet = addSheet("Form Responses 1");
formSheet.freezePanes.freezeRows(1);
const responseHeaders = ["Timestamp", "Player Name", "Player Email"];
people.forEach((person, index) => {
  responseHeaders.push(`Guess Fact ${index + 1} (${person.name})`);
  responseHeaders.push(`Guess Song ${index + 1} (${person.name})`);
});
responseHeaders.push("Score");

const wrongFacts = people.map((_, index) => people[factShuffle[index]].fact);
const wrongSongs = people.map((_, index) => people[songShuffle[index]].songId);
const allCorrect = formResponseRow("Taylor Demo", "taylor.demo@example.com", {
  facts: people.map((person) => person.fact),
  songs: people.map((person) => person.songId),
});
const partial = formResponseRow("Riley Demo", "riley.demo@example.com", {
  facts: people.map((person, index) => (index < 5 ? person.fact : wrongFacts[index])),
  songs: people.map((person, index) => (index < 3 ? person.songId : wrongSongs[index])),
});
const light = formResponseRow("Sam Demo", "sam.demo@example.com", {
  facts: people.map((person, index) => (index === 0 || index === 7 ? person.fact : wrongFacts[index])),
  songs: people.map((person, index) => (index === 2 ? person.songId : wrongSongs[index])),
});
writeValues(formSheet, "A1:V4", [responseHeaders, allCorrect, partial, light]);
formSheet.getRange("V2:V20").formulas = Array.from({ length: 19 }, (_, index) => [
  scoreFormulaForRow(index + 2),
]);
styleHeader(formSheet.getRange("A1:V1"), palette.panel, palette.white);
styleBody(formSheet.getRange("A1:V20"));
formSheet.getRange("A2:A20").setNumberFormat("yyyy-mm-dd h:mm");
formSheet.getRange("V2:V20").setNumberFormat("0");
applyWidths(formSheet, [20, 20, 28, ...Array(18).fill(40), 10]);

const leaderboardSheet = addSheet("Leaderboard");
leaderboardSheet.freezePanes.freezeRows(1);
writeValues(leaderboardSheet, "A1:B1", [["Player Name", "Score"]]);
leaderboardSheet.getRange("A2:A13").formulas = Array.from({ length: 12 }, (_, index) => [
  `=IFERROR(INDEX('Form Responses 1'!$B$2:$B$20,MATCH(LARGE('Form Responses 1'!$V$2:$V$20,${index + 1}),'Form Responses 1'!$V$2:$V$20,0)),"")`,
]);
leaderboardSheet.getRange("B2:B13").formulas = Array.from({ length: 12 }, (_, index) => [
  `=IFERROR(LARGE('Form Responses 1'!$V$2:$V$20,${index + 1}),"")`,
]);
styleHeader(leaderboardSheet.getRange("A1:B1"));
styleBody(leaderboardSheet.getRange("A1:B13"));
leaderboardSheet.getRange("B2:B13").setNumberFormat("0");
leaderboardSheet.getRange("D1:F5").values = [
  ["Publish this tab as CSV", "", ""],
  ["The React app reads columns Player Name and Score.", "", ""],
  ["After uploading to Google Sheets, paste the QUERY formula from Setup into A1 if you want native Sheets sorting.", "", ""],
  ["The Excel formulas here keep the mock workbook auditable before upload.", "", ""],
  ["", "", ""],
];
styleHeader(leaderboardSheet.getRange("D1:F1"), palette.paleGreen, palette.text);
styleBody(leaderboardSheet.getRange("D1:F5"));
applyWidths(leaderboardSheet, [24, 10, 4, 52, 18, 18]);

const formMapSheet = addSheet("Google Form Map");
formMapSheet.freezePanes.freezeRows(1);
const formMapRows = [
  ["Frontend env var", "Google Form question", "Response column", "Accepted value", "Entry ID placeholder"],
  ["VITE_ENTRY_PLAYER_NAME", "Q1 Player Name", "B", "Short answer", "entry.PLAYER_NAME_ID"],
  ["VITE_ENTRY_PLAYER_EMAIL", "Q2 Player Email", "C", "Short answer", "entry.PLAYER_EMAIL_ID"],
];
people.forEach((person, index) => {
  formMapRows.push([
    `VITE_ENTRY_FACT_${index + 1}`,
    `Q${index + 3} Guess Fact ${index + 1} - ${person.name}`,
    String.fromCharCode("D".charCodeAt(0) + index * 2),
    "Dropdown using GameData!B2:B10",
    `entry.COWORKER_${index + 1}_FACT_ID`,
  ]);
});
people.forEach((person, index) => {
  formMapRows.push([
    `VITE_ENTRY_SONG_${index + 1}`,
    `Q${index + 12} Guess Song ${index + 1} - ${person.name}`,
    String.fromCharCode("E".charCodeAt(0) + index * 2),
    "Dropdown using GameData!C2:C10",
    `entry.COWORKER_${index + 1}_SONG_ID`,
  ]);
});
writeValues(formMapSheet, `A1:E${formMapRows.length}`, formMapRows);
styleHeader(formMapSheet.getRange("A1:E1"), palette.panel, palette.white);
styleBody(formMapSheet.getRange(`A1:E${formMapRows.length}`));
applyWidths(formMapSheet, [28, 46, 18, 34, 30]);
formMapSheet.tables.add(`A1:E${formMapRows.length}`, true, "GoogleFormMapTable");

const inspect = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 6000,
  tableMaxRows: 5,
  tableMaxCols: 5,
});
console.log(inspect.ndjson);

const scoreCheck = await workbook.inspect({
  kind: "table",
  range: "Form Responses 1!A1:V4",
  include: "values,formulas",
  tableMaxRows: 4,
  tableMaxCols: 22,
  maxChars: 6000,
});
console.log(scoreCheck.ndjson);

const leaderboardCheck = await workbook.inspect({
  kind: "table",
  range: "Leaderboard!A1:B5",
  include: "values,formulas",
  tableMaxRows: 5,
  tableMaxCols: 2,
  maxChars: 3000,
});
console.log(leaderboardCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
  maxChars: 3000,
});
console.log(errors.ndjson);

for (const sheetName of [
  "Setup",
  "GameData",
  "AnswerKey",
  "Form Responses 1",
  "Leaderboard",
  "Google Form Map",
]) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const previewBytes = new Uint8Array(await preview.arrayBuffer());
  await fs.writeFile(path.join(outputDir, `${sheetName.replaceAll(" ", "_")}.png`), previewBytes);
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, "team_guessing_game_mock_data.xlsx"));
console.log(`saved=${path.join(outputDir, "team_guessing_game_mock_data.xlsx")}`);
