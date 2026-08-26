-- CreateTable
CREATE TABLE "SiteBanner" (
    "id" TEXT NOT NULL,
    "adminTitle" TEXT NOT NULL DEFAULT 'Новый баннер',
    "label" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "buttonText" TEXT NOT NULL DEFAULT '',
    "buttonHref" TEXT NOT NULL DEFAULT '',
    "imageLight" TEXT NOT NULL DEFAULT '',
    "imageDark" TEXT NOT NULL DEFAULT '',
    "imageMobile" TEXT NOT NULL DEFAULT '',
    "placement" TEXT NOT NULL DEFAULT 'manual',
    "tone" TEXT NOT NULL DEFAULT 'blue',
    "layout" TEXT NOT NULL DEFAULT 'split',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteBenefit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '✓',
    "image" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteBanner_enabled_sortOrder_idx" ON "SiteBanner"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "SiteBanner_placement_idx" ON "SiteBanner"("placement");

-- CreateIndex
CREATE INDEX "SiteBenefit_enabled_sortOrder_idx" ON "SiteBenefit"("enabled", "sortOrder");
