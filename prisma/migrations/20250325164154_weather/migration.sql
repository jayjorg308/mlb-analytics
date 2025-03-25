-- CreateTable
CREATE TABLE "Weather" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "lowTemperature" INTEGER,
    "highTemperature" INTEGER,
    "condition" VARCHAR(100),
    "windSpeed" INTEGER,

    CONSTRAINT "Weather_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Weather_gameId_key" ON "Weather"("gameId");

-- AddForeignKey
ALTER TABLE "Weather" ADD CONSTRAINT "Weather_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
