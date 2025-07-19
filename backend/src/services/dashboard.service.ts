import { prisma } from '../lib/prisma';
import { OrderStatus } from '@prisma/client';

export const getDashboardOverview = async () => {
  const monthlyTarget = 100000;

  // Total Delivered Revenue
  const totalRevenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: OrderStatus.DELIVERED },
  });

  // Total Orders
  const totalOrders = await prisma.order.count();

  // Total Customers (role: CUSTOMER)
  const totalCustomers = await prisma.user.count({
    where: { role: { name: 'CUSTOMER' } },
  });

  // Monthly Sales grouped by createdAt
  const monthlySalesRaw = await prisma.order.groupBy({
    by: ['createdAt'],
    where: { status: OrderStatus.DELIVERED },
    _sum: { total: true },
  });

  const monthlySales = monthlySalesRaw.map((sale:any) => ({
    month: sale.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' }),
    total: sale._sum.total ?? 0,
  }));

  // Gender Demographics
  const customerDemographicsRaw = await prisma.user.groupBy({
    by: ['gender'],
    where: {
      role: { name: 'CUSTOMER' },
      gender: { not: null },
    },
    _count: true,
  });

  const customerDemographics = formatDemographics(customerDemographicsRaw);

  // Recent Orders
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  // Top Selling Products
const topProductsRaw = await prisma.orderItem.groupBy({
  by: ['productId'],
  _sum: { quantity: true },
  orderBy: { _sum: { quantity: 'desc' } },
  take: 5,
});

const productIds = topProductsRaw.map((p:any) => p.productId);

const products = await prisma.product.findMany({
  where: { id: { in: productIds } },
  select: { id: true, name: true },
});

const topProducts = topProductsRaw.map((item:any) => {
  const product = products.find((p:any) => p.id === item.productId);
  return {
    name: product?.name || 'Unknown',
    quantitySold: item._sum.quantity || 0,
  };
});


  return {
    monthlyTarget,
    totalRevenue: totalRevenue?._sum?.total || 0,
    totalOrders: totalOrders || 0,
    totalCustomers: totalCustomers || 0,
    monthlySales: monthlySales || [],
    customerDemographics: customerDemographics || { male: 0, female: 0, other: 0 },
    topProducts,
    recentOrders: recentOrders.length
      ? recentOrders.map((order:any) => ({
        id: order.id,
        user: order.user?.name || 'Unknown',
        total: order.total,
        status: order.status,
        date: order.createdAt.toISOString(),
      }))
      : [],
  };

};

// Accepts gender as string
function formatDemographics(data: { gender: string | null; _count: number }[]) {
  const result = { male: 0, female: 0, other: 0 };

  for (const row of data) {
    const gender = row.gender?.toLowerCase();
    if (gender === 'male') result.male += row._count;
    else if (gender === 'female') result.female += row._count;
    else result.other += row._count;
  }

  return result;
}
