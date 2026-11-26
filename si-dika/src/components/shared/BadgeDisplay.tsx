"use client";
// =============================================================================
// SI-DIKA — BadgeDisplay
// TASK-6.3 (REQ-5.2)
// Badge earned: berwarna. Badge belum diraih: grayscale + tooltip syarat.
// =============================================================================

import { BADGE_META, type BadgeCode } from "@/types";

interface BadgeInfo {
  code:      BadgeCode;
  earned:    boolean;
  awardedAt?: string;
}

interface BadgeDisplayProps {
  badges: BadgeInfo[];
}

const ALL_BADGES: BadgeCode[] = ["ZERO_FALL", "IRON_BALANCE", "MOST_IMPROVED"];

export default function BadgeDisplay({ badges }: BadgeDisplayProps) {
  const earnedCodes = new Set(badges.filter((b) => b.earned).map((b) => b.code));

  return (
    <div className="flex flex-wrap gap-3">
      {ALL_BADGES.map((code) => {
        const meta    = BADGE_META[code];
        const earned  = earnedCodes.has(code);
        const info    = badges.find((b) => b.code === code);

        return (
          <div
            key={code}
            title={earned ? `Diraih: ${meta.description}` : `Syarat: ${meta.description}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-default
                        ${earned
                          ? "bg-yellow-50 border-yellow-300 shadow-sm"
                          : "bg-gray-100 border-gray-200 opacity-50 grayscale"
                        }`}
          >
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <p className={`text-sm font-semibold leading-tight ${earned ? "text-gray-900" : "text-gray-500"}`}>
                {meta.title}
              </p>
              {earned && info?.awardedAt && (
                <p className="text-xs text-gray-500">
                  {new Date(info.awardedAt).toLocaleDateString("id-ID")}
                </p>
              )}
              {!earned && (
                <p className="text-xs text-gray-400">Belum diraih</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
