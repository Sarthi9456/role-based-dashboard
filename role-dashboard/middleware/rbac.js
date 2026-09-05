'use strict';

/**
 * Role-based access control.
 *
 * Usage: router.get('/users', requireAuth, authorize('Admin'), controller);
 *        router.get('/projects', requireAuth, authorize('Admin', 'Manager'), controller);
 *
 * This is deliberately checked on the server for every matching route -
 * a user cannot bypass it by navigating directly to a URL, editing the
 * client-side HTML, or hiding/showing menu links, because the check runs
 * again on the backend regardless of how the request arrived.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    const user = req.session && req.session.user;

    if (!user) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      return res.redirect('/login');
    }

    if (!allowedRoles.includes(user.role)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: 'You do not have permission to perform this action.' });
      }
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        layout: false,
      });
    }

    return next();
  };
}

module.exports = { authorize };
