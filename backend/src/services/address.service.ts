import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type AddressData = {
  fullName: string;
  phone: string;
  altPhone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

export const addressService = {
  async create(userId: string, data: AddressData) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: {
        userId,
        ...data,
      },
    });
  },

  async getAll(userId: string) {
    return prisma.address.findMany({
      where: { userId },
    });
  },

  async update(userId: string, addressId: string, data: AddressData) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id: addressId, userId },
      data,
    });
  },

  async delete(userId: string, addressId: string) {
    await prisma.address.delete({
      where: { id: addressId, userId },
    });
  },
};