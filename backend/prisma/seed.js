const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/**
 * Seed database with sample users and financial records.
 * Idempotent: uses upsert for users, deletes and recreates records.
 */
async function main() {
  console.log('🌱 Seeding database...\n');

  // --- Seed Users ---
  const passwordHash = await bcrypt.hash('Password123!', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@financeflow.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@financeflow.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Admin:   ${admin.email} (role: ${admin.role})`);

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@financeflow.com' },
    update: {},
    create: {
      name: 'Analyst User',
      email: 'analyst@financeflow.com',
      passwordHash,
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Analyst: ${analyst.email} (role: ${analyst.role})`);

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@financeflow.com' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'viewer@financeflow.com',
      passwordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Viewer:  ${viewer.email} (role: ${viewer.role})`);

  console.log('\n  All passwords: Password123!\n');

  // --- Seed Financial Records ---
  // Clear existing records for clean re-seed
  await prisma.auditLog.deleteMany({});
  await prisma.financialRecord.deleteMany({});

  const categories = {
    income: ['Salary', 'Freelance', 'Investments', 'Rental Income', 'Consulting'],
    expense: ['Rent', 'Utilities', 'Groceries', 'Transportation', 'Insurance', 'Entertainment', 'Software Subscriptions', 'Office Supplies', 'Marketing', 'Travel'],
  };

  const records = [];
  const now = new Date();

  // Generate 50 records spread over the last 6 months
  for (let i = 0; i < 50; i++) {
    const isIncome = Math.random() > 0.45; // Slight bias toward income
    const type = isIncome ? 'INCOME' : 'EXPENSE';
    const cats = isIncome ? categories.income : categories.expense;
    const category = cats[Math.floor(Math.random() * cats.length)];

    // Random date within the last 180 days
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    // Amount ranges
    let amount;
    if (isIncome) {
      if (category === 'Salary') amount = 3000 + Math.random() * 5000;
      else if (category === 'Investments') amount = 500 + Math.random() * 3000;
      else amount = 200 + Math.random() * 2000;
    } else {
      if (category === 'Rent') amount = 1000 + Math.random() * 2000;
      else if (category === 'Insurance') amount = 200 + Math.random() * 500;
      else amount = 20 + Math.random() * 500;
    }

    const descriptions = {
      Salary: 'Monthly salary payment',
      Freelance: 'Freelance project payment',
      Investments: 'Investment dividend',
      'Rental Income': 'Monthly rental income',
      Consulting: 'Consulting engagement',
      Rent: 'Monthly rent payment',
      Utilities: 'Electricity and water bill',
      Groceries: 'Weekly grocery shopping',
      Transportation: 'Fuel and transport costs',
      Insurance: 'Insurance premium payment',
      Entertainment: 'Entertainment and leisure',
      'Software Subscriptions': 'Monthly SaaS subscriptions',
      'Office Supplies': 'Office supplies purchase',
      Marketing: 'Digital marketing campaign',
      Travel: 'Business travel expenses',
    };

    // Distribute records across users (mostly admin, some analyst)
    const creator = i % 5 === 0 ? analyst.id : admin.id;

    records.push({
      amount: Math.round(amount * 100) / 100,
      type,
      category,
      date,
      description: descriptions[category] || `${type.toLowerCase()} record`,
      createdBy: creator,
    });
  }

  await prisma.financialRecord.createMany({ data: records });
  console.log(`  ✅ Created ${records.length} financial records\n`);

  // --- Summary ---
  const incomeCount = records.filter((r) => r.type === 'INCOME').length;
  const expenseCount = records.filter((r) => r.type === 'EXPENSE').length;
  const totalIncome = records.filter((r) => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
  const totalExpenses = records.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);

  console.log('  📊 Seed Summary:');
  console.log(`     Income records:  ${incomeCount} (total: $${totalIncome.toFixed(2)})`);
  console.log(`     Expense records: ${expenseCount} (total: $${totalExpenses.toFixed(2)})`);
  console.log(`     Net balance:     $${(totalIncome - totalExpenses).toFixed(2)}`);
  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
