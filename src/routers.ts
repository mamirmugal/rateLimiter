import express, { Request, Response, Router } from 'express';
import { CustomRequest } from './types';

const router: Router = express.Router();

router.get('/', (req: Request, res: Response): void => {
  const isAuthenticated: boolean = req.headers.authorization !== undefined;
  const returnString: string = isAuthenticated ? 'Public for Auth' : 'Public for unauth';
  res.send(returnString);
});

router.get('/sale', (req: Request, res: Response): void => {
  const customReq = req as CustomRequest;
  const returnString: string = customReq.overrider ? 'Sale!!!' : 'Sale over :(';
  res.send(returnString);
});

export default router;
