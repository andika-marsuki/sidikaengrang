// =============================================================================
// SI-DIKA — Database Seed
// TASK-1.5
//
// Akun seed untuk login:
//   ADMIN   : admin@si-dika.sch.id      / Admin@12345
//   TEACHER : guru.pjok@si-dika.sch.id  / Guru@12345
//   STUDENT : (via profil siswa, login pakai NISN sebagai username)
//             NISN 1234567890           / Siswa@12345
//
// Jalankan: npm run db:seed
// =============================================================================

import { PrismaClient, Role, Gender, TestType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { calcFinalScore } from "../src/lib/scoring-engine";
import { calcBMI } from "../src/lib/bmi";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seed database SI-DIKA...\n");

  // ── 1. Bersihkan data lama (urutan: child → parent) ──────────────────────
  await prisma.studentBadge.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.egrangSpec.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Data lama dihapus.");

  // ── 2. Users ──────────────────────────────────────────────────────────────

  const adminPassword   = await bcrypt.hash("Admin@12345", 12);
  const teacherPassword = await bcrypt.hash("Guru@12345", 12);
  const studentPassword = await bcrypt.hash("Siswa@12345", 12);

  const admin = await prisma.user.create({
    data: {
      id:       createId(),
      email:    "admin@si-dika.sch.id",
      name:     "Administrator Sekolah",
      password: adminPassword,
      role:     Role.ADMIN,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      id:       createId(),
      email:    "guru.pjok@si-dika.sch.id",
      name:     "Bapak Ahmad Fauzi, S.Pd",
      password: teacherPassword,
      role:     Role.TEACHER,
    },
  });

  // User STUDENT — akun viewer yang terhubung ke profil siswa via NISN
  const studentUser = await prisma.user.create({
    data: {
      id:       createId(),
      // Konvensi email untuk siswa: nisn@siswa.si-dika.sch.id
      email:    "1234567890@siswa.si-dika.sch.id",
      name:     "Budi Santoso",
      password: studentPassword,
      role:     Role.STUDENT,
    },
  });

  console.log(`✓ 3 user dibuat: Admin, Teacher, Student`);

  // ── 3. EgrangSpec ─────────────────────────────────────────────────────────

  const specSD = await prisma.egrangSpec.create({
    data: {
      id:           createId(),
      name:         "Engrang SD Standar 20cm Bambu",
      stepHeightCm: 20,
      poleLengthCm: 120,
      material:     "Bambu",
    },
  });

  const specSMP = await prisma.egrangSpec.create({
    data: {
      id:           createId(),
      name:         "Engrang SMP Standar 30cm Bambu",
      stepHeightCm: 30,
      poleLengthCm: 150,
      material:     "Bambu",
    },
  });

  const specSMPKayu = await prisma.egrangSpec.create({
    data: {
      id:           createId(),
      name:         "Engrang SMP Kompetisi 40cm Kayu",
      stepHeightCm: 40,
      poleLengthCm: 160,
      material:     "Kayu",
    },
  });

  console.log(`✓ 3 EgrangSpec dibuat.`);

  // ── 4. Students ───────────────────────────────────────────────────────────

  const studentsData = [
    {
      nisn:         "1234567890",
      name:         "Budi Santoso",
      className:    "VII-A",
      academicYear: "2024/2025",
      gender:       Gender.L,
      birthDate:    new Date("2012-03-15"),
    },
    {
      nisn:         "0987654321",
      name:         "Siti Rahayu",
      className:    "VII-A",
      academicYear: "2024/2025",
      gender:       Gender.P,
      birthDate:    new Date("2012-07-22"),
    },
    {
      nisn:         "1122334455",
      name:         "Dimas Prayoga",
      className:    "VII-B",
      academicYear: "2024/2025",
      gender:       Gender.L,
      birthDate:    new Date("2011-11-08"),
    },
    {
      nisn:         "5544332211",
      name:         "Aulia Putri Handayani",
      className:    "VII-B",
      academicYear: "2024/2025",
      gender:       Gender.P,
      birthDate:    new Date("2012-01-30"),
    },
    {
      nisn:         "6677889900",
      name:         "Rizky Firmansyah",
      className:    "VIII-A",
      academicYear: "2024/2025",
      gender:       Gender.L,
      birthDate:    new Date("2010-09-05"),
    },
  ];

  const students = await Promise.all(
    studentsData.map((s) =>
      prisma.student.create({ data: { id: createId(), ...s } })
    )
  );

  console.log(`✓ ${students.length} siswa dibuat.`);

  // ── 5. Assessments (Pre-Test + Post-Test untuk 2 siswa) ───────────────────
  //
  // Helper: hitung usia dalam tahun dari tanggal lahir
  function ageYears(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  // ── Budi Santoso — Pre-Test ────────────────────────────────────────────────
  const budiHeight = 148, budiWeight = 42;
  const budiAge    = ageYears(students[0].birthDate);
  const budiPre    = calcFinalScore({
    scoreStatic:    2,
    scoreDynamic:   2,
    scoreCoord:     1,
    scorePosture:   2,
    fallCount:      4,
    durationSeconds: 38,
    trackDistanceM: 10,
    ageYears:       budiAge,
    gender:         "L",
  });

  await prisma.assessment.create({
    data: {
      id:             createId(),
      studentId:      students[0].id,
      teacherId:      teacher.id,
      egrangSpecId:   specSMP.id,
      testType:       TestType.PRE_TEST,
      heightCm:       budiHeight,
      weightKg:       budiWeight,
      bmi:            calcBMI(budiHeight, budiWeight),
      trackDistanceM: 10,
      durationSeconds: 38,
      fallCount:      4,
      stepCount:      18,
      scoreStatic:    2,
      scoreDynamic:   2,
      scoreCoord:     1,
      scorePosture:   2,
      finalScore:     budiPre.finalScore,
      predicate:      budiPre.predicate,
      recommendation: budiPre.recommendation,
      localId:        createId(),
      assessedAt:     new Date("2025-01-10T08:30:00.000Z"),
    },
  });

  // ── Budi Santoso — Post-Test (ada peningkatan signifikan ≥15%) ────────────
  const budiPost = calcFinalScore({
    scoreStatic:    3,
    scoreDynamic:   3,
    scoreCoord:     3,
    scorePosture:   3,
    fallCount:      1,
    durationSeconds: 25,
    trackDistanceM: 10,
    ageYears:       budiAge,
    gender:         "L",
  });

  await prisma.assessment.create({
    data: {
      id:             createId(),
      studentId:      students[0].id,
      teacherId:      teacher.id,
      egrangSpecId:   specSMP.id,
      testType:       TestType.POST_TEST,
      heightCm:       budiHeight,
      weightKg:       budiWeight,
      bmi:            calcBMI(budiHeight, budiWeight),
      trackDistanceM: 10,
      durationSeconds: 25,
      fallCount:      1,
      stepCount:      22,
      scoreStatic:    3,
      scoreDynamic:   3,
      scoreCoord:     3,
      scorePosture:   3,
      finalScore:     budiPost.finalScore,
      predicate:      budiPost.predicate,
      recommendation: budiPost.recommendation,
      localId:        createId(),
      assessedAt:     new Date("2025-02-07T08:30:00.000Z"),
    },
  });

  // ── Siti Rahayu — Pre-Test (skor bagus, siap dapat badge ZERO_FALL) ───────
  const sitiHeight = 152, sitiWeight = 44;
  const sitiAge    = ageYears(students[1].birthDate);
  const sitiPre    = calcFinalScore({
    scoreStatic:    4,
    scoreDynamic:   4,
    scoreCoord:     3,
    scorePosture:   3,
    fallCount:      0,
    durationSeconds: 20,
    trackDistanceM: 15,
    ageYears:       sitiAge,
    gender:         "P",
  });

  await prisma.assessment.create({
    data: {
      id:             createId(),
      studentId:      students[1].id,
      teacherId:      teacher.id,
      egrangSpecId:   specSMPKayu.id,
      testType:       TestType.PRE_TEST,
      heightCm:       sitiHeight,
      weightKg:       sitiWeight,
      bmi:            calcBMI(sitiHeight, sitiWeight),
      trackDistanceM: 15,
      durationSeconds: 20,
      fallCount:      0,
      stepCount:      30,
      scoreStatic:    4,
      scoreDynamic:   4,
      scoreCoord:     3,
      scorePosture:   3,
      finalScore:     sitiPre.finalScore,
      predicate:      sitiPre.predicate,
      recommendation: sitiPre.recommendation,
      localId:        createId(),
      assessedAt:     new Date("2025-01-10T09:00:00.000Z"),
    },
  });

  // ── Dimas Prayoga — Pre-Test saja ─────────────────────────────────────────
  const dimasHeight = 155, dimasWeight = 50;
  const dimasAge    = ageYears(students[2].birthDate);
  const dimasPre    = calcFinalScore({
    scoreStatic:    3,
    scoreDynamic:   2,
    scoreCoord:     2,
    scorePosture:   3,
    fallCount:      2,
    durationSeconds: 30,
    trackDistanceM: 10,
    ageYears:       dimasAge,
    gender:         "L",
  });

  await prisma.assessment.create({
    data: {
      id:             createId(),
      studentId:      students[2].id,
      teacherId:      teacher.id,
      egrangSpecId:   specSMP.id,
      testType:       TestType.PRE_TEST,
      heightCm:       dimasHeight,
      weightKg:       dimasWeight,
      bmi:            calcBMI(dimasHeight, dimasWeight),
      trackDistanceM: 10,
      durationSeconds: 30,
      fallCount:      2,
      stepCount:      20,
      scoreStatic:    3,
      scoreDynamic:   2,
      scoreCoord:     2,
      scorePosture:   3,
      finalScore:     dimasPre.finalScore,
      predicate:      dimasPre.predicate,
      recommendation: dimasPre.recommendation,
      localId:        createId(),
      assessedAt:     new Date("2025-01-10T09:30:00.000Z"),
    },
  });

  console.log(`✓ 4 assessment dibuat (Pre & Post Budi, Pre Siti, Pre Dimas).`);

  // ── 6. Badges ─────────────────────────────────────────────────────────────

  // Siti: ZERO_FALL (lintasan 15m tanpa jatuh) + IRON_BALANCE (statis & dinamis = 4)
  await prisma.studentBadge.createMany({
    data: [
      {
        id:         createId(),
        studentId:  students[1].id,
        badgeCode:  "ZERO_FALL",
        badgeTitle: "Kaki Baja",
      },
      {
        id:         createId(),
        studentId:  students[1].id,
        badgeCode:  "IRON_BALANCE",
        badgeTitle: "Keseimbangan Besi",
      },
    ],
  });

  // Budi: MOST_IMPROVED (skor post > pre ≥ 15%)
  await prisma.studentBadge.create({
    data: {
      id:         createId(),
      studentId:  students[0].id,
      badgeCode:  "MOST_IMPROVED",
      badgeTitle: "Paling Pesat",
    },
  });

  console.log(`✓ 3 badge diberikan (Siti: ZERO_FALL + IRON_BALANCE, Budi: MOST_IMPROVED).`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════╗
║           SEED SELESAI — Akun Login                 ║
╠══════════════════════════════════════════════════════╣
║  ADMIN   : admin@si-dika.sch.id   / Admin@12345     ║
║  TEACHER : guru.pjok@si-dika.sch.id / Guru@12345    ║
║  STUDENT : 1234567890@siswa.si-dika.sch.id          ║
║            (NISN Budi Santoso) / Siswa@12345        ║
╚══════════════════════════════════════════════════════╝

Budi Pre-Test  → ${budiPre.finalScore} (${budiPre.predicate})
Budi Post-Test → ${budiPost.finalScore} (${budiPost.predicate})
Siti Pre-Test  → ${sitiPre.finalScore} (${sitiPre.predicate})
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
