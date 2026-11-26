// =============================================================================
// SI-DIKA — PDF Template: ClassReportDocument
// File .tsx agar JSX dari @react-pdf/renderer dapat dikompilasi.
// Dipanggil dari src/app/api/export/pdf/[classId]/route.ts via renderToBuffer().
// =============================================================================

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssessmentRow {
  nisn: string;
  name: string;
  gender: string;
  testType: string;
  assessedAt: string;
  teacher: string;
  rubricComponent: number;
  balanceComponent: number;
  speedComponent: number;
  finalScore: number;
  predicate: string;
  scoreStatic: number;
  scoreDynamic: number;
  scoreCoord: number;
  scorePosture: number;
  fallCount: number;
  recommendation: string;
}

export interface ClassReportDocumentProps {
  className: string;
  academicYear: string;
  teacherName: string;
  rows: AssessmentRow[];
  generatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function predicateColor(predicate: string): string {
  if (predicate === "Prima") return "#16a34a";
  if (predicate === "Kompeten") return "#2563eb";
  if (predicate === "Berkembang") return "#d97706";
  return "#dc2626";
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
  },
  headerBox: {
    marginBottom: 16,
    borderBottom: "2px solid #FACC15",
    paddingBottom: 10,
  },
  schoolName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#374151",
  },
  meta: {
    fontSize: 8,
    textAlign: "center",
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 14,
    color: "#111827",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 3,
  },
  table: { width: "100%" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottom: "0.5px solid #e5e7eb",
  },
  tableRowAlt: { backgroundColor: "#f9fafb" },
  cell: { fontSize: 8 },
  cellBold: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  headerCell: {
    fontSize: 7.5,
    color: "#f9fafb",
    fontFamily: "Helvetica-Bold",
  },
  studentCard: {
    marginBottom: 10,
    padding: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 4,
  },
  studentName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  studentMeta: { fontSize: 8, color: "#6b7280", marginBottom: 6 },
  indicatorRow: { flexDirection: "row", marginBottom: 4, gap: 6 },
  indicatorBox: {
    flex: 1,
    padding: 5,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    alignItems: "center",
  },
  indicatorLabel: {
    fontSize: 6.5,
    color: "#6b7280",
    marginBottom: 2,
    textAlign: "center",
  },
  indicatorValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  recoBox: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#fef3c7",
    borderRadius: 3,
  },
  recoTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: "#92400e",
  },
  recoText: { fontSize: 7.5, color: "#451a03", lineHeight: 1.4 },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 7,
    color: "#9ca3af",
    borderTop: "0.5px solid #e5e7eb",
    paddingTop: 4,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClassReportDocument({
  className,
  academicYear,
  teacherName,
  rows,
  generatedAt,
}: ClassReportDocumentProps) {
  return (
    <Document
      title={`Rapor Kelas ${className}`}
      author="SI-DIKA"
      subject="Laporan Penilaian Egrang"
    >
      {/* Page 1: Ringkasan Kelas (landscape) */}
      <Page size="A4" style={s.page} orientation="landscape">
        <View style={s.headerBox}>
          <Text style={s.schoolName}>
            SI-DIKA - Sistem Informasi Digital Kebugaran Aktif
          </Text>
          <Text style={s.reportTitle}>
            RAPOR PENILAIAN EGRANG - KELAS {className.toUpperCase()}
          </Text>
          <Text style={s.meta}>
            Tahun Ajaran: {academicYear} | Guru PJOK: {teacherName} |
            Dicetak: {generatedAt}
          </Text>
        </View>

        <Text style={s.sectionTitle}>Rekap Nilai Seluruh Siswa</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.headerCell, { width: "3%" }]}>No</Text>
            <Text style={[s.headerCell, { width: "13%" }]}>NISN</Text>
            <Text style={[s.headerCell, { width: "22%" }]}>Nama Siswa</Text>
            <Text style={[s.headerCell, { width: "5%" }]}>JK</Text>
            <Text style={[s.headerCell, { width: "9%" }]}>Jenis Tes</Text>
            <Text style={[s.headerCell, { width: "8%" }]}>Rubrik (40)</Text>
            <Text style={[s.headerCell, { width: "9%" }]}>Keseimb. (35)</Text>
            <Text style={[s.headerCell, { width: "8%" }]}>Kecepatan (25)</Text>
            <Text style={[s.headerCell, { width: "9%" }]}>Skor Akhir</Text>
            <Text style={[s.headerCell, { width: "14%" }]}>Predikat</Text>
          </View>

          {rows.map((r, i) => (
            <View
              key={i}
              style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <Text style={[s.cell, { width: "3%" }]}>{i + 1}</Text>
              <Text style={[s.cell, { width: "13%" }]}>{r.nisn}</Text>
              <Text style={[s.cellBold, { width: "22%" }]}>{r.name}</Text>
              <Text style={[s.cell, { width: "5%" }]}>{r.gender}</Text>
              <Text style={[s.cell, { width: "9%" }]}>{r.testType}</Text>
              <Text style={[s.cell, { width: "8%", textAlign: "center" }]}>
                {r.rubricComponent.toFixed(1)}
              </Text>
              <Text style={[s.cell, { width: "9%", textAlign: "center" }]}>
                {r.balanceComponent.toFixed(1)}
              </Text>
              <Text style={[s.cell, { width: "8%", textAlign: "center" }]}>
                {r.speedComponent.toFixed(1)}
              </Text>
              <Text
                style={[
                  s.cellBold,
                  {
                    width: "9%",
                    textAlign: "center",
                    color: predicateColor(r.predicate),
                  },
                ]}
              >
                {r.finalScore.toFixed(1)}
              </Text>
              <Text
                style={[
                  s.cellBold,
                  { width: "14%", color: predicateColor(r.predicate) },
                ]}
              >
                {r.predicate}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={s.footer}
          render={({ pageNumber, totalPages }) =>
            `SI-DIKA | Halaman ${pageNumber} dari ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2+: Detail Per Siswa (4 kartu per halaman) */}
      {chunkArray(rows, 4).map((group, pageIdx) => (
        <Page key={pageIdx} size="A4" style={s.page}>
          <View style={s.headerBox}>
            <Text style={s.reportTitle}>
              Detail Penilaian - Kelas {className} | {academicYear}
            </Text>
          </View>

          {group.map((r, i) => (
            <View key={i} style={s.studentCard}>
              <View style={s.flexRow}>
                <View>
                  <Text style={s.studentName}>{r.name}</Text>
                  <Text style={s.studentMeta}>
                    NISN: {r.nisn} |{" "}
                    {r.gender === "L" ? "Laki-laki" : "Perempuan"} |{" "}
                    {r.testType} - {r.assessedAt}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={[
                      s.scoreCircle,
                      { backgroundColor: predicateColor(r.predicate) },
                    ]}
                  >
                    <Text style={s.scoreNum}>
                      {Math.round(r.finalScore)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 7.5,
                      fontFamily: "Helvetica-Bold",
                      color: predicateColor(r.predicate),
                      marginTop: 2,
                    }}
                  >
                    {r.predicate}
                  </Text>
                </View>
              </View>

              <View style={s.indicatorRow}>
                {[
                  { label: "Keseimbangan\nStatis", value: `${r.scoreStatic}/4` },
                  { label: "Keseimbangan\nDinamis", value: `${r.scoreDynamic}/4` },
                  { label: "Koordinasi", value: `${r.scoreCoord}/4` },
                  { label: "Postur &\nDaya Tahan", value: `${r.scorePosture}/4` },
                  {
                    label: "Jatuh",
                    value: `${r.fallCount}x`,
                    danger: r.fallCount >= 3,
                  },
                ].map((ind, idx) => (
                  <View key={idx} style={s.indicatorBox}>
                    <Text style={s.indicatorLabel}>{ind.label}</Text>
                    <Text
                      style={[
                        s.indicatorValue,
                        "danger" in ind && ind.danger
                          ? { color: "#dc2626" }
                          : {},
                      ]}
                    >
                      {ind.value}
                    </Text>
                  </View>
                ))}
              </View>

              {r.recommendation ? (
                <View style={s.recoBox}>
                  <Text style={s.recoTitle}>Rekomendasi Latihan</Text>
                  <Text style={s.recoText}>{r.recommendation}</Text>
                </View>
              ) : null}
            </View>
          ))}

          <Text
            style={s.footer}
            render={({ pageNumber, totalPages }) =>
              `SI-DIKA | Halaman ${pageNumber} dari ${totalPages}`
            }
            fixed
          />
        </Page>
      ))}
    </Document>
  );
}
