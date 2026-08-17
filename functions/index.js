const {onCall, HttpsError} = require('firebase-functions/v2/https')
const {onDocumentCreated} = require('firebase-functions/v2/firestore')
const {defineSecret} = require('firebase-functions/params')
const {initializeApp} = require('firebase-admin/app')
const {getFirestore} = require('firebase-admin/firestore')
const nodemailer = require('nodemailer')

initializeApp()
const db = getFirestore()

const SCHOOL_EMAIL = 'psdniemcewicza@gmail.com'
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD')

function gmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SCHOOL_EMAIL,
      pass: gmailAppPassword.value(),
    },
  })
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

    const childrenSnap = await db.collection('children').where('gradeId', '==', hw.gradeId).get()
    const parentIds = [...new Set(childrenSnap.docs.map(d => d.data().parentId).filter(Boolean))]
    if (parentIds.length === 0) return

    const dueDate = hw.weekOf
      ? new Date(hw.weekOf).toLocaleDateString('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})
      : null

    const transporter = gmailTransporter()

    await Promise.all(parentIds.map(async (parentId) => {
      // Only registered parent accounts have a matching users/{uid} doc with role 'parent'.
      const userSnap = await db.collection('users').doc(parentId).get()
      if (!userSnap.exists || userSnap.data().role !== 'parent') return

      const parentSnap = await db.collection('parents').doc(parentId).get()
      const email = parentSnap.exists ? parentSnap.data().email : null
      if (!email) return

      const lines = [
        `Nauczyciel dodał nowe zadanie domowe dla klasy: ${gradeName}`,
        '',
        `Tytuł: ${hw.title}`,
      ]
      if (dueDate) lines.push(`Termin oddania: ${dueDate}`)
      if (hw.description) lines.push('', hw.description)

      await transporter.sendMail({
        from: `Strona PSD Niemcewicza <${SCHOOL_EMAIL}>`,
        to: email,
        subject: `Nowe zadanie domowe — ${gradeName}`,
        text: lines.join('\n'),
      })
    }))
  }
)
