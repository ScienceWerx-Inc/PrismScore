-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "sharedWithTeam" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "courseId" TEXT;

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("courseId","userId")
);

-- CreateIndex
CREATE INDEX "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
