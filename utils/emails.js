const nodemailer = require('nodemailer');
const pug =require('pug');
const htmlToText = require('html-to-text');
// Email(user,url)
module.exports = class Email {
  constructor(user,url){
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.from = `Yousef Aref <${process.env.EMAIL_FROM}>`
    this.url = url;
  }
  newTransporter(){
    if(process.env.NODE_ENV === 'production'){
      
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      // logger: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

  }

  async send(template,subject){
    //1) Render HTML based on a pug template
    try{
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
      firstName:this.firstName,
      url:this.url,
      subject
    })
    console.log(html)
    //2) Defining the mail options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    //3) Creating a transporter and sending the email
    await this.newTransporter().sendMail(emailOptions);
  }catch(err){
    console.log(err)
  }
  }

  async sendWelcome(){
    await this.send('welcome','Welcome to the Natours family!')
  }
  async sendResetPassword(){
    await this.send('resetPassword','Your password reset token (valid for 10 only mins)')
  }
}
