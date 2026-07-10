import AdminNotification from '../../models/AdminNotification';

export async function notifyAdminNewProvider(
  displayName: string,
  email: string
) {
  return AdminNotification.create({
    message: `New service provider registration: ${displayName} (${email})`,
    read: false,
    createdAt: new Date(),
  });
}

export async function getMarketplaceAdminMetrics() {
  const ServiceProvider = (await import('../../models/ServiceProvider')).default;
  const ServiceCategory = (await import('../../models/ServiceCategory')).default;
  const Service = (await import('../../models/Service')).default;

  const [pending, underReview, approved, rejected, suspended, categories, services] =
    await Promise.all([
      ServiceProvider.countDocuments({ status: 'PENDING' }),
      ServiceProvider.countDocuments({ status: 'UNDER_REVIEW' }),
      ServiceProvider.countDocuments({ status: 'APPROVED' }),
      ServiceProvider.countDocuments({ status: 'REJECTED' }),
      ServiceProvider.countDocuments({ status: 'SUSPENDED' }),
      ServiceCategory.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
    ]);

  return {
    providers: { pending, underReview, approved, rejected, suspended },
    categories,
    services,
  };
}
