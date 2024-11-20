export const resetMenuItems = (req) => {
    const baseMenuItems = [
        { label: 'Home', icon: 'bi-house', link: '/', active: false },
        { label: 'Books', icon: 'bi-book', link: '/books', active: false },
        { label: 'Donate a Book', icon: 'bi-journal-plus', link: '/books/donate', active: false },
        { label: 'Transactions', icon: 'bi-receipt', link: '/transactions', active: false },
        { label: 'About', icon: 'bi-info-circle', link: '/about', active: false }
    ]

    const isLoggedIn = req.session && req.session.isLoggedIn;
    
    const authMenuItems = isLoggedIn ? [
            { label: 'Logout', icon: 'bi-box-arrow-right', link: '/logout', active: false },
        ] : [
            { label: 'Register', icon: 'bi-person-plus', link: '/register', active: false },
            { label: 'Login', icon: 'bi-box-arrow-in-right', link: '/login', active: false }
        ]

    return [...baseMenuItems, ...authMenuItems]
}

export const menuMiddleware = (req, res, next) => {
    req.session = req.session || {}
    res.locals.isRegistered = req.session.isRegistered || false
    res.locals.isLoggedIn = req.session.isLoggedIn || false
    res.locals.isAuthPage = req.session.isAuthPage || false

    const menuItems = resetMenuItems(req)

    const currentPath = req.path
    menuItems.forEach(item => {
        item.active = currentPath === item.link
    })
    
    res.locals.menuItems = menuItems
    next()
}

export const setAuthPageFlag = (req, res, next) => {
    res.locals.isAuthPage = (req.path === '/login' || req.path === '/register') ? true : false
    next()
}

export const requireLogin = (req, res, message, redirectTo) => {
    console.log('Checking login status:', req.session);
    if (!req.session.isLoggedIn) {
        req.session.message = {
            title: 'Login Required',
            content: [message]
        }
        req.session.redirectTo = redirectTo
        req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err)
            }
            console.log("req.session.redirectTo ensureAuth:", req.session.redirectTo)
            res.redirect('/login')
        })
        return false
    }
    return true
}

export const clearSessionMessage = (req) => {
    if (req && req.session && req.session.message) {
        delete req.session.message
    }
}