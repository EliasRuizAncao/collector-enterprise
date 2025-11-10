import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear usuario admin por defecto
  const admin = await prisma.user.upsert({
    where: { email: 'admin@amaranto.cl' },
    update: {},
    create: {
      email: 'admin@amaranto.cl',
      firebaseUid: 'admin-seed-uid',
      name: 'Administrador Amaranto',
      role: Role.ADMIN,
    },
  })

  console.log('✅ Admin creado:', admin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })