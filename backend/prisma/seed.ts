import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données VSN-CI Mobile Money...\n');

  // ─── 1. Paramètres de sécurité par défaut ────────────────────────────────────
  console.log('⚙️  Création des paramètres de sécurité...');
  await prisma.parametreSecurite.upsert({
    where: { id: 'default-security-params' },
    update: {},
    create: {
      id: 'default-security-params',
      otpActif: true,
      dureeOtpMinutes: 5,
      tentativesMaxLogin: 5,
      dureeSessionHeures: 8,
      ipWhitelist: [],
      alerteSmsActif: true,
      alerteEmailActif: true,
    },
  });
  console.log('   ✅ Paramètres de sécurité créés\n');

  // ─── 2. Réseaux ───────────────────────────────────────────────────────────────
  console.log('📡 Création des réseaux mobiles...');

  const wave = await prisma.reseau.upsert({
    where: { id: 'reseau-wave' },
    update: {},
    create: {
      id: 'reseau-wave',
      nom: 'Wave',
      type: 'WAVE',
      couleur: '#1BA8E0',
      tauxCommission: 1.5,
      actif: true,
    },
  });
  console.log(`   ✅ Réseau Wave créé (id: ${wave.id})`);

  const mtn = await prisma.reseau.upsert({
    where: { id: 'reseau-mtn' },
    update: {},
    create: {
      id: 'reseau-mtn',
      nom: 'MTN Mobile Money',
      type: 'MTN',
      couleur: '#FFCC00',
      tauxCommission: 1.75,
      actif: true,
    },
  });
  console.log(`   ✅ Réseau MTN créé (id: ${mtn.id})`);

  const orange = await prisma.reseau.upsert({
    where: { id: 'reseau-orange' },
    update: {},
    create: {
      id: 'reseau-orange',
      nom: 'Orange Money',
      type: 'ORANGE',
      couleur: '#F16E00',
      tauxCommission: 2.0,
      actif: true,
    },
  });
  console.log(`   ✅ Réseau Orange créé (id: ${orange.id})\n`);

  // ─── 3. Agences ───────────────────────────────────────────────────────────────
  console.log('🏢 Création des agences...');

  const agencePlateau = await prisma.agence.upsert({
    where: { code: 'AGC-001' },
    update: {},
    create: {
      nom: 'Agence Plateau',
      code: 'AGC-001',
      ville: 'Abidjan',
      adresse: 'Avenue Chardy, Plateau, Abidjan',
      telephone: '+22520000001',
      email: 'plateau@vsn-ci.com',
      statut: 'ACTIVE',
      solde: 5000000,
    },
  });
  console.log(`   ✅ Agence Plateau créée (id: ${agencePlateau.id})`);

  const agenceCocody = await prisma.agence.upsert({
    where: { code: 'AGC-002' },
    update: {},
    create: {
      nom: 'Agence Cocody',
      code: 'AGC-002',
      ville: 'Abidjan',
      adresse: 'Boulevard de France, Cocody, Abidjan',
      telephone: '+22520000002',
      email: 'cocody@vsn-ci.com',
      statut: 'ACTIVE',
      solde: 3000000,
    },
  });
  console.log(`   ✅ Agence Cocody créée (id: ${agenceCocody.id})\n`);

  // ─── 4. Super Admin ───────────────────────────────────────────────────────────
  console.log('👑 Création du Super Administrateur...');
  const superAdminPassword = await bcrypt.hash('Admin@2024', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@vsn-ci.com' },
    update: {},
    create: {
      nom: 'Admin VSN',
      prenom: 'Super',
      email: 'superadmin@vsn-ci.com',
      telephone: '+22500000001',
      motDePasse: superAdminPassword,
      role: 'SUPER_ADMIN',
      statut: 'ACTIF',
    },
  });
  console.log(`   ✅ Super Admin créé (id: ${superAdmin.id}, email: superadmin@vsn-ci.com)\n`);

  // ─── 5. Admin Agence Plateau ──────────────────────────────────────────────────
  console.log('🔑 Création de l\'Administrateur d\'agence (Plateau)...');
  const adminAgencePassword = await bcrypt.hash('Admin@2024', 12);

  const adminPlateau = await prisma.user.upsert({
    where: { email: 'admin.plateau@vsn-ci.com' },
    update: {},
    create: {
      nom: 'Konaté',
      prenom: 'Ibrahim',
      email: 'admin.plateau@vsn-ci.com',
      telephone: '+22500000002',
      motDePasse: adminAgencePassword,
      role: 'ADMIN_AGENCE',
      statut: 'ACTIF',
      agenceId: agencePlateau.id,
    },
  });
  console.log(`   ✅ Admin Agence Plateau créé (id: ${adminPlateau.id}, email: admin.plateau@vsn-ci.com)\n`);

  // ─── 6. Agent avec profil ─────────────────────────────────────────────────────
  console.log('👤 Création de l\'Agent...');
  const agentPassword = await bcrypt.hash('Agent@2024', 12);

  const agent1User = await prisma.user.upsert({
    where: { email: 'agent1@vsn-ci.com' },
    update: {},
    create: {
      nom: 'Ouattara',
      prenom: 'Fatima',
      email: 'agent1@vsn-ci.com',
      telephone: '+22500000003',
      motDePasse: agentPassword,
      role: 'AGENT',
      statut: 'ACTIF',
      agenceId: agencePlateau.id,
    },
  });
  console.log(`   ✅ Utilisateur agent créé (id: ${agent1User.id})`);

  await prisma.agent.upsert({
    where: { userId: agent1User.id },
    update: {},
    create: {
      userId: agent1User.id,
      agenceId: agencePlateau.id,
      matricule: 'AGT-2024-0001',
      statut: 'ACTIF',
      solde: 0,
      soldeFlottant: 0,
      typeContrat: 'CDI',
      dateEmbauche: new Date(),
      commission: 0,
    },
  });
  console.log(`   ✅ Profil Agent créé (matricule: AGT-2024-0001, email: agent1@vsn-ci.com)\n`);

  // ─── 7. Comptes réseau pour les agences ───────────────────────────────────────
  console.log('💳 Création des comptes réseau...');

  await prisma.compteReseau.upsert({
    where: { reseauId_agenceId: { reseauId: wave.id, agenceId: agencePlateau.id } },
    update: {},
    create: {
      reseauId: wave.id,
      agenceId: agencePlateau.id,
      numero: '+22501000001',
      solde: 1000000,
      actif: true,
    },
  });
  console.log('   ✅ Compte Wave — Agence Plateau');

  await prisma.compteReseau.upsert({
    where: { reseauId_agenceId: { reseauId: mtn.id, agenceId: agencePlateau.id } },
    update: {},
    create: {
      reseauId: mtn.id,
      agenceId: agencePlateau.id,
      numero: '+22502000001',
      solde: 750000,
      actif: true,
    },
  });
  console.log('   ✅ Compte MTN — Agence Plateau');

  await prisma.compteReseau.upsert({
    where: { reseauId_agenceId: { reseauId: orange.id, agenceId: agencePlateau.id } },
    update: {},
    create: {
      reseauId: orange.id,
      agenceId: agencePlateau.id,
      numero: '+22503000001',
      solde: 500000,
      actif: true,
    },
  });
  console.log('   ✅ Compte Orange — Agence Plateau');

  await prisma.compteReseau.upsert({
    where: { reseauId_agenceId: { reseauId: wave.id, agenceId: agenceCocody.id } },
    update: {},
    create: {
      reseauId: wave.id,
      agenceId: agenceCocody.id,
      numero: '+22501000002',
      solde: 600000,
      actif: true,
    },
  });
  console.log('   ✅ Compte Wave — Agence Cocody\n');

  // ─── Récapitulatif ────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅  SEEDING TERMINÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 Comptes créés :');
  console.log('   Super Admin  → superadmin@vsn-ci.com    / Admin@2024');
  console.log('   Admin Agence → admin.plateau@vsn-ci.com / Admin@2024');
  console.log('   Agent        → agent1@vsn-ci.com        / Agent@2024');
  console.log('\n🏢 Agences : Agence Plateau (AGC-001), Agence Cocody (AGC-002)');
  console.log('📡 Réseaux  : Wave, MTN Mobile Money, Orange Money');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
