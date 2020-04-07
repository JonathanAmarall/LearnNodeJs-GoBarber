import nodemailer from 'nodemailer';
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';
import mailConfig from '../config/mail';


class Mail{
    constructor(){
        const { host, port, secure, auth } = mailConfig;

        this.transport = nodemailer.createTransport({
            host, port, secure,
            auth: auth.user ? auth : null

        });
    }

    async sendMail(message){
        return this.transport.sendMail({
            ...mailConfig.default,
            ...message
        });


    }
};

export default new Mail();
