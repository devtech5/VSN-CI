-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER');

-- CreateEnum
CREATE TYPE "StatutUser" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutAgence" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDUE');

-- CreateEnum
CREATE TYPE "StatutAgent" AS ENUM ('ACTIF', 'INACTIF', 'EN_CONGE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "TypeTransaction" AS ENUM ('DEPOT', 'RETRAIT', 'TRANSFERT', 'PAIEMENT', 'RECHARGEMENT', 'REMBOURSEMENT');

-- CreateEnum
CREATE TYPE "StatutTransaction" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'ECHOUEE', 'ANNULEE', 'REMBOURSEE');

-- CreateEnum
CREATE TYPE "TypeReseau" AS ENUM ('WAVE', 'MTN', 'ORANGE', 'MOOV', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeDepense" AS ENUM ('LOYER', 'SALAIRE', 'FOURNITURES', 'TRANSPORT', 'COMMUNICATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutDepense" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'REJETEE', 'PAYEE');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('CDI', 'CDD', 'STAGE', 'FREELANCE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "statut" "StatutUser" NOT NULL DEFAULT 'ACTIF',
    "avatar" TEXT,
    "dernierLogin" TIMESTAMP(3),
    "otpSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agenceId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agences" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "statut" "StatutAgence" NOT NULL DEFAULT 'ACTIVE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "statut" "StatutAgent" NOT NULL DEFAULT 'ACTIF',
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "soldeFlottant" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "typeContrat" "TypeContrat" NOT NULL DEFAULT 'CDI',
    "dateEmbauche" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "salaire" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "agenceId" TEXT NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseaux" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeReseau" NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#000000',
    "logo" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "tauxCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reseaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comptes_reseau" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reseauId" TEXT NOT NULL,
    "agenceId" TEXT NOT NULL,

    CONSTRAINT "comptes_reseau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "TypeTransaction" NOT NULL,
    "statut" "StatutTransaction" NOT NULL DEFAULT 'EN_ATTENTE',
    "montant" DOUBLE PRECISION NOT NULL,
    "frais" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantNet" DOUBLE PRECISION NOT NULL,
    "numeroClient" TEXT NOT NULL,
    "nomClient" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "valideeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reseauId" TEXT,
    "agenceId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "operateurId" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvisionnements" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "valide" BOOLEAN NOT NULL DEFAULT false,
    "valideAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agenceId" TEXT NOT NULL,

    CONSTRAINT "approvisionnements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depenses" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "TypeDepense" NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" "StatutDepense" NOT NULL DEFAULT 'EN_ATTENTE',
    "description" TEXT,
    "pieceJointe" TEXT,
    "dateDepense" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agenceId" TEXT NOT NULL,
    "createurId" TEXT NOT NULL,

    CONSTRAINT "depenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres_securite" (
    "id" TEXT NOT NULL,
    "otpActif" BOOLEAN NOT NULL DEFAULT true,
    "dureeOtpMinutes" INTEGER NOT NULL DEFAULT 5,
    "tentativesMaxLogin" INTEGER NOT NULL DEFAULT 5,
    "dureeSessionHeures" INTEGER NOT NULL DEFAULT 8,
    "ipWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "alerteSmsActif" BOOLEAN NOT NULL DEFAULT true,
    "alerteEmailActif" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametres_securite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telephone_key" ON "users"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "agences_code_key" ON "agences"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agents_matricule_key" ON "agents"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "agents_userId_key" ON "agents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_reseau_reseauId_agenceId_key" ON "comptes_reseau"("reseauId", "agenceId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "agences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "agences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comptes_reseau" ADD CONSTRAINT "comptes_reseau_reseauId_fkey" FOREIGN KEY ("reseauId") REFERENCES "reseaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comptes_reseau" ADD CONSTRAINT "comptes_reseau_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "agences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reseauId_fkey" FOREIGN KEY ("reseauId") REFERENCES "reseaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "agences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvisionnements" ADD CONSTRAINT "approvisionnements_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "agences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depenses" ADD CONSTRAINT "depenses_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "agences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depenses" ADD CONSTRAINT "depenses_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
