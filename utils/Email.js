const nodemailer = require("nodemailer")

const sendEmail = async (email, subject, message) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.forwardemail.net",
            port: 465,
            secure: true,
            service: "gmail",
            auth: {
                user: process.env.SENDING_MAIL,
                pass: process.env.MAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.SENDING_MAIL,
            to: email,
            subject: subject,
            // text: link,
            html: message
        });

        console.log("Email sent sucessfully");
    } catch (error) {
        console.log("Email not sent");
        console.log(error);
    }
}

module.exports = sendEmail