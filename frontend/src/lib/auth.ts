import jwt from 'jsonwebtoken';

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', {
      algorithms: ['HS256'],
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function generateToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-jwt-secret', {
    expiresIn: '1d',
  });
}