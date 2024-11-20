// resets menu items based on login status
export const resetMenuItems = (req) => {
    // always visible to all users
    const baseMenuItems = [
        { label: 'Home', icon: 'bi-house', link: '/', active: false },
        { label: 'Books', icon: 'bi-book', link: '/books', active: false },
        { label: 'Donate a Book', icon: 'bi-journal-plus', link: '/books/donate', active: false },
        { label: 'Transactions', icon: 'bi-receipt', link: '/transactions', active: false },
        { label: 'About', icon: 'bi-info-circle', link: '/about', active: false }
    ]

    const isLoggedIn = req?.session?.isLoggedIn || false
    
    // auth-related menu items (change based on login status)
    const authMenuItems = isLoggedIn ? [
            { label: 'Logout', icon: 'bi-box-arrow-right', link: '/logout', active: false },
        ] : [
            { label: 'Register', icon: 'bi-person-plus', link: '/register', active: false },
            { label: 'Login', icon: 'bi-box-arrow-in-right', link: '/login', active: false }
        ]

    return [...baseMenuItems, ...authMenuItems]
}

// middleware to set menu items in the response locals and mark the acitve item
export const menuMiddleware = (req, res, next) => {
    req.session = req.session || {}
    res.locals.isRegistered = req.session.isRegistered || false
    res.locals.isLoggedIn = req.session.isLoggedIn || false
    res.locals.isAuthPage = req.session.isAuthPage || false

    const menuItems = resetMenuItems(req)

    // determines the current active menu item
    const currentPath = req.path
    menuItems.forEach(item => {
        item.active = currentPath === item.link
    })
    
    res.locals.menuItems = menuItems
    next()
}

// set the flag for auth-pages (login / register)
export const setAuthPageFlag = (req, res, next) => {
    res.locals.isAuthPage = (req.path === '/login' || req.path === '/register') ? true : false
    next()
}

// helper function to require the user to be logged in for certain routes
export const requireLogin = (req, res, message, redirectTo) => {
    if (!req.session.isLoggedIn) {
        req.session.message = {
            title: 'Login Required',
            content: [message]
        }
        // store the page they were trying to visit so they can be redirected after login
        req.session.redirectTo = redirectTo
        req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err)
            }
            res.redirect('/login')
        })
        return false // user is not logged in
    }
    return true // allow access if the user is logged in
}

// helper function to clear the sesion message (if any)
export const clearSessionMessage = (req) => {
    if (req?.session?.message) {
        delete req.session.message
        req.session.save()
    }
}