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