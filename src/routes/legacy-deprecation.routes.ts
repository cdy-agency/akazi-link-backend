import { Router, Request, Response } from 'express';

const LEGACY_GONE_MESSAGE =
  'This feature has been removed. The platform now uses admin-managed recruitment for Super Admin and Candidate workflows only.';

export const legacyGoneHandler = (_req: Request, res: Response) => {
  res.status(410).json({
    message: LEGACY_GONE_MESSAGE,
    code: 'LEGACY_FEATURE_REMOVED',
  });
};

const legacyDeprecationRouter = Router();
legacyDeprecationRouter.all('*', legacyGoneHandler);

export default legacyDeprecationRouter;
