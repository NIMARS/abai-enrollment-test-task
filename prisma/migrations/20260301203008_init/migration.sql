-- CreateTable
CREATE TABLE "Appeal" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppealChild" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "childIin" TEXT NOT NULL,
    "childName" TEXT NOT NULL,

    CONSTRAINT "AppealChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "sportsCenterId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "parent" TEXT NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsCenterProgram" (
    "id" TEXT NOT NULL,
    "sportsCenterId" TEXT NOT NULL,
    "sportType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "SportsCenterProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "iin" TEXT NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppealChild_appealId_idx" ON "AppealChild"("appealId");

-- CreateIndex
CREATE INDEX "AppealChild_childIin_idx" ON "AppealChild"("childIin");

-- CreateIndex
CREATE INDEX "Enrollment_athleteProfileId_idx" ON "Enrollment"("athleteProfileId");

-- CreateIndex
CREATE INDEX "Enrollment_sportsCenterId_idx" ON "Enrollment"("sportsCenterId");

-- CreateIndex
CREATE INDEX "Enrollment_programId_idx" ON "Enrollment"("programId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_iin_key" ON "AthleteProfile"("iin");

-- AddForeignKey
ALTER TABLE "AppealChild" ADD CONSTRAINT "AppealChild_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "Appeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "SportsCenterProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
