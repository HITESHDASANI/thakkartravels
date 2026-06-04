// middleware/auth.js

function requireLogin(req, res, next) {

    if (!req.session || !req.session.user) {

        return res.status(401).json({
            error: "Login required ❌"
        });

    }

    next();
}

function requireAdmin(req, res, next) {

    if (!req.session || !req.session.user) {

        return res.status(401).json({
            error: "Login required ❌"
        });

    }

    // Accept admin/Admin/ADMIN

    if (
        !req.session.user.role ||
        req.session.user.role.toLowerCase() !== 'admin'
    ) {

        return res.status(403).json({
            error: "Admin only ❌"
        });

    }

    next();
}

module.exports = {
    requireLogin,
    requireAdmin
};