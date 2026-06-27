export const migrateApplicationStatuses = async () => {
  try {
    const Application = (await import('../models/Application')).default;

    const statusMigrations: Array<{ from: string; to: string }> = [
      { from: 'PENDING', to: 'APPLIED' },
      { from: 'pending', to: 'APPLIED' },
      { from: 'REVIEWED', to: 'UNDER_REVIEW' },
      { from: 'reviewed', to: 'UNDER_REVIEW' },
      { from: 'interview', to: 'UNDER_REVIEW' },
    ];

    for (const { from, to } of statusMigrations) {
      await Application.updateMany({ status: from }, { $set: { status: to } });
    }

    await Application.updateMany(
      { status: 'HIRED', hiredAt: { $exists: false } },
      [{ $set: { hiredAt: '$updatedAt' } }]
    );

    console.log('Application status migration completed');
  } catch (error) {
    console.error('Error during application status migration:', error);
  }
};
