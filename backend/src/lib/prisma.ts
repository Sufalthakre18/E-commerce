
import { PrismaClient } from '@prisma/client';


export const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log("Database connected ")
  })
  .catch((error:any) => {
    console.error("Database connection fail", error)
  })