import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function updateUserRole() {
  try {
    const email = process.argv[2] || 'admin@amaranto.cl'
    const newRole = (process.argv[3] || 'ADMIN') as 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'

    console.log(`Actualizando rol de ${email} a ${newRole}...`)

    const user = await prisma.user.update({
      where: { email },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    console.log('✅ Usuario actualizado:', user)
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRole()

