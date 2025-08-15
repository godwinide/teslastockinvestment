const {Resend} = require("resend");

async function sendPasswordResetEmail(receipient, linkId){
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
        headers: {
            "X-My-Header": "Musk Space"
        },
        from: "Space Musk Investment <noreply@spacemuskinvestment.pro>",
        subject: "Reset Password",
        to: [receipient],
        html: `
            <p>Click the link below to reset your password:</p>
            <p><a href="https://spacemuskinvestment.pro/reset-password?code=${linkId}">Reset Password</a></p>
            <p>Thank you for using Space Musk Investment!</p>
            `
      });
}

module.exports = sendPasswordResetEmail