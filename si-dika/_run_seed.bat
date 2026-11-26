@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"

set DATABASE_URL=postgresql://neondb_owner:npg_ak0stiA6yOgZ@ep-shy-hall-bexj95t3-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
set DIRECT_URL=postgresql://neondb_owner:npg_ak0stiA6yOgZ@ep-shy-hall-bexj95t3.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require
set AUTH_SECRET=si-dika-secret-2025-xK9mPqR3nLvW8dYt
set NEXTAUTH_SECRET=si-dika-secret-2025-xK9mPqR3nLvW8dYt

echo [START SEED] > C:\KIRO\_seed2.txt
"C:\Program Files\nodejs\node.exe" node_modules\ts-node\dist\bin.js --compiler-options "{\"module\":\"CommonJS\"}" prisma\seed.ts >> C:\KIRO\_seed2.txt 2>&1
echo [EXIT %ERRORLEVEL%] >> C:\KIRO\_seed2.txt
