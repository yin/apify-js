/* eslint-disable */
window.addEventListener('load', function () {
    window.cookieconsent.initialise({
        palette: {
            popup: {
                background: '#13a7cd',
            },
            button: {
                background: '#00225a',
            },
        },
        position: 'bottom-left',
        content: {
            message: 'By using this website you agree to our',
            link: 'cookie policy',
            href: 'https://www.apify.com/privacy-policy#cookies',
        },
        onPopupOpen: function () { $('html').addClass('cookie-consent'); },
        onPopupClose: function () { $('html').removeClass('cookie-consent'); },
    });
});
