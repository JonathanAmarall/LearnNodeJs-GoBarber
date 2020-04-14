export default {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user:  process.env.MAIL_USER,
        pass:  process.env.MAIL_PASS,
    },
    default: {
        from: 'Equipe GoBarber <noreply@gobarber.com>'
    }
};
/*
    Servidores de email:
    Amazon SES
    Sparkpost
    Mandril( só pode ser usado com Mailchip)
    Mailtrap ( para ambiente de desenvolvimento)
*/
