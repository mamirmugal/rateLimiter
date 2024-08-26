import { Request } from 'express';

export type TTL_UNIT_TYPE = 'min' | 'hour';

export interface CustomRequest extends Request {
  overrider?: boolean;
}
