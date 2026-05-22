import bcrypt from 'bcryptjs';
import prisma from '../core/database/prisma.js';

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
}

interface CreateDoctorData {
  specialty: string;
  consultationFee: number;
  licenseNumber: string;
}

export const authService = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email, isDeleted: false },
    });
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, isDeleted: false },
    });

    if (!user) return null;

    if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: id },
      });
      return { ...user, doctor };
    }

    if (['RECEPTIONIST', 'PHARMACIST', 'CASHIER'].includes(user.role)) {
      const staff = await prisma.staff.findUnique({
        where: { userId: id },
      });
      return { ...user, staff };
    }

    return user;
  },

  async create(data: CreateUserData) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as any,
        phone: data.phone,
      },
    });
  },

  async createDoctorProfile(userId: string, data: CreateDoctorData) {
    return prisma.doctor.create({
      data: {
        userId,
        specialty: data.specialty,
        consultationFee: data.consultationFee,
        licenseNumber: data.licenseNumber,
      },
    });
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  },
};