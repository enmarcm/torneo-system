import type { Response } from 'express';

export const ok = (res: Response, data: unknown, message = 'OK', meta?: unknown) =>
  res.json({ success: true, message, data, meta });

export const created = (res: Response, data: unknown, message = 'Creado') =>
  res.status(201).json({ success: true, message, data });

export const noContent = (res: Response, message = 'OK') =>
  res.json({ success: true, message, data: null });

export const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ success: false, message });
