import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    // Deny access to course routes for guests
    if (req.url.includes('/api/courses')) {
      return res.status(401).json({ error: 'Unauthorized - Login required' });
    }
    return next(); // Allow other routes if needed
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
