const {onCall, HttpsError, onRequest} = require('firebase-functions/v2/https')
const {onDocumentCreated} = require('firebase-functions/v2/firestore')
const {defineSecret} = require('firebase-functions/params')
const {initializeApp} = require('firebase-admin/app')
const {getFirestore} = require('firebase-admin/firestore')
const {isValidSignature, SIGNATURE_HEADER_NAME} = require('@sanity/webhook')
const nodemailer = require('nodemailer')

initializeApp()
const db = getFirestore()

const SCHOOL_EMAIL = 'psdniemcewicza@gmail.com'
const SITE_URL = 'https://psdniemcewicza--polska-szkola-7ae70.us-central1.hosted.app'
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD')
const sanityWebhookSecret = defineSecret('SANITY_WEBHOOK_SECRET')

function gmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SCHOOL_EMAIL,
      pass: gmailAppPassword.value(),
    },
  })
}

// Returns the email addresses of parents with a registered account, either
// for one grade (gradeId) or for the whole school (gradeId === 'all').
async function getRegisteredParentEmails(gradeId) {
  let parentIds
  if (gradeId === 'all') {
    const usersSnap = await db.collection('users').where('role', '==', 'parent').get()
    parentIds = usersSnap.docs.map(d => d.id)
  } else {
    const childrenSnap = await db.collection('children').where('gradeId', '==', gradeId).get()
    const candidateIds = [...new Set(childrenSnap.docs.map(d => d.data().parentId).filter(Boolean))]
    const checks = await Promise.all(candidateIds.map(async (id) => {
      const userSnap = await db.collection('users').doc(id).get()
      return userSnap.exists && userSnap.data().role === 'parent' ? id : null
    }))
    parentIds = checks.filter(Boolean)
  }

  const emails = await Promise.all(parentIds.map(async (id) => {
    const parentSnap = await db.collection('parents').doc(id).get()
    return parentSnap.exists ? parentSnap.data().email : null
  }))
  return emails.filter(Boolean)
}

exports.sendContactEmail = onCall({secrets: [gmailAppPassword], region: 'us-central1'}, async (request) => {
  const name    = (request.data?.name || '').trim()
  const email   = (request.data?.email || '').trim()
  const message = (request.data?.message || '').trim()

  if (!name || !email || !message) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }

  await gmailTransporter().sendMail({
    from: `Strona PSD Niemcewicza <${SCHOOL_EMAIL}>`,
    to: SCHOOL_EMAIL,
    replyTo: `${name} <${email}>`,
    subject: `Wiadomość ze strony od ${name}`,
    text: `Od: ${name} <${email}>\n\n${message}`,
  })

  return {ok: true}
})

exports.notifyParentsOfHomework = onDocumentCreated(
  {document: 'homework/{homeworkId}', secrets: [gmailAppPassword], region: 'us-central1'},
  async (event) => {
    const hw = event.data?.data()
    if (!hw?.gradeId || !hw?.title) return

    const gradeSnap = await db.collection('grades').doc(hw.gradeId).get()
    const gradeName = gradeSnap.exists ? gradeSnap.data().name : 'Twojej klasy'

    const emails = await getRegisteredParentEmails(hw.gradeId)
    if (emails.length === 0) return

    const dueDate = hw.weekOf
      ? new Date(hw.weekOf).toLocaleDateString('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})
      : null

    const transporter = gmailTransporter()
    const lines = [
      `Nauczyciel dodał nowe zadanie domowe dla klasy: ${gradeName}`,
      '',
      `Tytuł: ${hw.title}`,
    ]
    if (dueDate) lines.push(`Termin oddania: ${dueDate}`)
    if (hw.description) lines.push('', hw.description)

    await Promise.all(emails.map((email) => transporter.sendMail({
      from: `Strona PSD Niemcewicza <${SCHOOL_EMAIL}>`,
      to: email,
      subject: `Nowe zadanie domowe — ${gradeName}`,
      text: lines.join('\n'),
    })))
  }
)

exports.notifyParentsOfClassMessage = onDocumentCreated(
  {document: 'classMessages/{messageId}', secrets: [gmailAppPassword], region: 'us-central1'},
  async (event) => {
    const msg = event.data?.data()
    if (!msg?.gradeId || !msg?.subject || !msg?.message) return

    let gradeName = 'wszystkich klas'
    if (msg.gradeId !== 'all') {
      const gradeSnap = await db.collection('grades').doc(msg.gradeId).get()
      gradeName = gradeSnap.exists ? gradeSnap.data().name : 'Twojej klasy'
    }

    const emails = await getRegisteredParentEmails(msg.gradeId)
    if (emails.length === 0) return

    const transporter = gmailTransporter()
    await Promise.all(emails.map((email) => transporter.sendMail({
      from: `Strona PSD Niemcewicza <${SCHOOL_EMAIL}>`,
      to: email,
      subject: msg.subject,
      text: msg.message,
    })))
  }
)

// Triggered by a Sanity webhook when an announcement is published.
// Configure the webhook in Sanity's dashboard with filter:
//   _type == "announcement" && pinned == true
// on the "Create" event only, and set the same secret as SANITY_WEBHOOK_SECRET.
exports.notifyParentsOfAnnouncement = onRequest(
  {secrets: [gmailAppPassword, sanityWebhookSecret], region: 'us-central1'},
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed')
      return
    }

    const signature = req.get(SIGNATURE_HEADER_NAME)
    const valid = signature && isValidSignature(req.rawBody, signature, sanityWebhookSecret.value())
    if (!valid) {
      res.status(401).send('Invalid signature')
      return
    }

    const doc = req.body
    if (doc?._type !== 'announcement' || doc?.pinned !== true || !doc?.title) {
      res.status(200).send('Ignored')
      return
    }

    const emails = await getRegisteredParentEmails('all')
    if (emails.length > 0) {
      const transporter = gmailTransporter()
      await Promise.all(emails.map((email) => transporter.sendMail({
        from: `Strona PSD Niemcewicza <${SCHOOL_EMAIL}>`,
        to: email,
        subject: `Nowe ważne ogłoszenie: ${doc.title}`,
        text: `Szkoła opublikowała nowe ważne ogłoszenie: ${doc.title}\n\nSzczegóły: ${SITE_URL}/pl/announcements`,
      })))
    }

    res.status(200).send('OK')
  }
)
