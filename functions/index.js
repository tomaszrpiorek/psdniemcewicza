const {onCall, HttpsError} = require('firebase-functions/v2/https')
const {defineSecret} = require('firebase-functions/params')
const nodemailer = require('nodemailer')

const SCHOOL_EMAIL = 'psdniemcewicza@gmail.com'
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD')

exports.sendContactEmail = onCall({secrets: [gmailAppPassword], region: 'us-central1'}, async (request) => {
  const name    = (request.data?.name || '').trim()
  const email   = (request.data?.email || '').trim()
  const message = (request.data?.message || '').trim()

  if (!name || !email || !message) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SCHOOL_EMAIL,
      pass: gmailAppPassword.value(),
    },
  })

  await transporter.sendMail({
    from: `Strona PSD Niemcewicza <${SCHOOL_EMAIL}>`,
    to: SCHOOL_EMAIL,
    replyTo: `${name} <${email}>`,
    subject: `Wiadomość ze strony od ${name}`,
    text: `Od: ${name} <${email}>\n\n${message}`,
  })

  return {ok: true}
})
