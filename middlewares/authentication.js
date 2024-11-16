export const requireLogin = (req, res, message, redirectTo) => {
    console.log('entered requireLogin')
    if (!req.session.isLoggedIn) {
        setModalMessage(req, 'Login Required', message)
        req.session.redirectTo = redirectTo
        console.log("req.session.redirectTo ensureAuth:", req.session.redirectTo)
        return res.redirect('/login')
    }
    return true
}

export const setModalMessage = (req, title, content) => {
    if (!Array.isArray(content)) {
        console.log('is not an array')
        content = [content]
    }
    
    req.session.message = {
        title,
        content
    }
}