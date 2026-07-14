import {
  ChefHat,
  Computer,
  CookingPot,
  Headphones,
  KeyRound,
  Laptop,
  LockKeyhole,
  Music2,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type WallpaperIcon =
  | { type: "lucide"; Icon: LucideIcon }
  | { type: "image"; src: string; alt: string; scale?: number };

const imageIcon = (src: string, scale?: number): WallpaperIcon => ({
  type: "image",
  src,
  alt: "",
  scale,
});

const forestIcon = imageIcon("/icons/05_ICON_FOREST.png");
const seattleIcon = imageIcon("/icons/wallpaper-seattle.jpg", 1.5);
const saltLakeIcon = imageIcon("/icons/wallpaper-saltlake.png");
const dcIcon = imageIcon("/icons/wallpaper-dc.png", 1.5);
const torontoIcon = imageIcon("/icons/wallpaper-toronto.png", 1.3);

const icon = (Icon: LucideIcon): WallpaperIcon => ({ type: "lucide", Icon });

const iconColumns: WallpaperIcon[][] = [
  [icon(Computer), icon(LockKeyhole), forestIcon, icon(ChefHat), seattleIcon, icon(Music2), icon(ShieldCheck), icon(CookingPot)],
  [icon(Headphones), saltLakeIcon, icon(KeyRound), icon(Laptop), icon(Utensils), forestIcon, icon(Music2), icon(LockKeyhole)],
  [icon(ShieldCheck), icon(CookingPot), dcIcon, icon(Computer), icon(Headphones), icon(ChefHat), forestIcon, icon(KeyRound)],
  [icon(Music2), icon(Laptop), icon(LockKeyhole), icon(Computer), forestIcon, icon(Utensils), icon(ShieldCheck), icon(Computer)],
  [icon(ChefHat), forestIcon, icon(Headphones), icon(KeyRound), torontoIcon, icon(CookingPot), icon(Laptop), icon(Music2)],
  [icon(Computer), icon(ShieldCheck), icon(Utensils), saltLakeIcon, icon(LockKeyhole), forestIcon, icon(Headphones), icon(ChefHat)],
  [icon(Laptop), icon(Music2), forestIcon, icon(CookingPot), seattleIcon, icon(KeyRound), icon(Computer), icon(ShieldCheck)],
  [icon(LockKeyhole), dcIcon, icon(ChefHat), icon(Headphones), icon(Laptop), icon(Utensils), forestIcon, icon(Music2)],
  [icon(ShieldCheck), icon(Computer), icon(Music2), forestIcon, icon(CookingPot), torontoIcon, icon(KeyRound), icon(Headphones)],
];

const columnYOffsets = [-18, 34, -6, 58, 12, -30, 44, 4, 72, -14, 26];
const iconXOffsets = [-16, 8, -4, 18, -12, 4, 14, -8, 2, -18, 10];
const iconRotations = [-8, 4, -2, 7, -5, 2, 9, -3, 5];
const columnOpacities = [0.11, 0.085, 0.13, 0.075, 0.105, 0.09, 0.12, 0.08];
const wallpaperColumns = Array.from({ length: 24 }, (_, index) => iconColumns[index % iconColumns.length]);

export function IconWallpaper() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden text-leaf"
    >
      <div
        className="absolute inset-x-[-3rem] top-[-5rem] grid min-h-[145vh] gap-x-2 sm:gap-x-3 lg:gap-x-4"
        style={{ gridTemplateColumns: "repeat(24, minmax(34px, 1fr))" }}
      >
        {wallpaperColumns.map((icons, columnIndex) => (
          <div
            key={columnIndex}
            className="flex flex-col items-center gap-5 sm:gap-6 lg:gap-7"
            style={{
              opacity: columnOpacities[columnIndex % columnOpacities.length],
              transform: `translateY(${columnYOffsets[columnIndex % columnYOffsets.length]}px)`,
            }}
          >
            {Array.from({ length: 5 }).map((_, repeatIndex) =>
              icons.map((wallpaperIcon, iconIndex) => {
                const transform = `translateX(${
                  iconXOffsets[(columnIndex + iconIndex + repeatIndex) % iconXOffsets.length]
                }px) rotate(${
                  iconRotations[(columnIndex + iconIndex * 2 + repeatIndex) % iconRotations.length]
                }deg)`;

                if (wallpaperIcon.type === "image") {
                  return (
                    <img
                      key={`${repeatIndex}-${iconIndex}`}
                      src={wallpaperIcon.src}
                      alt={wallpaperIcon.alt}
                      className="h-6 w-6 object-contain opacity-80 sm:h-7 sm:w-7 lg:h-8 lg:w-8"
                      style={{
                        transform: `${transform} scale(${wallpaperIcon.scale ?? 1})`,
                      }}
                    />
                  );
                }

                const { Icon } = wallpaperIcon;

                return (
                  <Icon
                    key={`${repeatIndex}-${iconIndex}`}
                    className="h-6 w-6 stroke-[1.7] sm:h-7 sm:w-7 lg:h-8 lg:w-8"
                    style={{ transform }}
                  />
                );
              }),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
