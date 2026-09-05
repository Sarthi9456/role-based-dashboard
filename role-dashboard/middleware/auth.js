'use strict';

/**
 * Blocks access to any route unless the request has a valid, logged-in session.
 * This is the backend gate that prevents access purely by knowing/typing a URL:
 * even if a user bookmarks or guesses a route, the server always re-checks the
 * session before running the route handler.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to continue.');
  return res.redirect('/login');
}

/**
 * Redirects an already-authenticated user away from the login page.
 */
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return next();
}

module.exports = { requireAuth, redirectIfAuthenticated };
