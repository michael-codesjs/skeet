import { Receiver } from '@upstash/qstash';
import { NextFunction, Request, Response } from 'express';

// Initialize QStash signature verifier
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

/**
 * Middleware to verify QStash webhook signatures.
 * Only allows requests that come from QStash.
 */
export async function verifyQStashSignature(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // In development, skip verification if no signing keys are configured
  if (process.env.NODE_ENV === 'development' && !process.env.QSTASH_CURRENT_SIGNING_KEY) {
    console.warn('[QStash] Skipping signature verification in development mode');
    next();
    return;
  }

  const signature = req.headers['upstash-signature'] as string;

  if (!signature) {
    res.status(401).json({ error: 'Missing QStash signature' });
    return;
  }

  try {
    // Get the raw body for signature verification
    const body = JSON.stringify(req.body);

    const isValid = await receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      res.status(401).json({ error: 'Invalid QStash signature' });
      return;
    }

    next();
  } catch (error) {
    console.error('[QStash] Signature verification failed:', error);
    res.status(401).json({ error: 'Signature verification failed' });
  }
}
