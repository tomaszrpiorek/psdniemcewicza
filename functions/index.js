const {onCall, HttpsError, onRequest} = require('firebase-functions/v2/https')
const {onDocumentCreated} = require('firebase-functions/v2/firestore')
const {defineSecret} = require('firebase-functions/params')
const {initializeApp} = require('firebase-admin/app')
const {getFirestore} = require('firebase-admin/firestore')
const {getAuth} = require('firebase-admin/auth')
const {isValidSignature, SIGNATURE_HEADER_NAME} = require('@sanity/webhook')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

initializeApp()
const db = getFirestore()

const SCHOOL_EMAIL = 'psdniemcewicza@gmail.com'
const SITE_URL = 'https://psdniemcewicza.org'
// Gmail rejects messages over 25 MB, and attachments grow by a third when encoded,
// so this caps the combined size of the files attached to one email.
const MAX_EMAIL_ATTACHMENT_BYTES = 15 * 1024 * 1024
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

// Sends one email per address and logs what Gmail answered for each, so a
// "the parent did not get it" report can be checked against the function log.
// Addresses are masked in the log (jan.kowalski@gmail.com -> ja***@gmail.com).
async function sendToEach(label, emails, buildMail) {
  const transporter = gmailTransporter()
  const mask = (email) => email.replace(/^(.{0,2}).*(@.*)$/, '$1***$2')
  const results = await Promise.allSettled(emails.map((email) => transporter.sendMail({...buildMail(), to: email})))
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.accepted?.length) {
      console.log(`${label}: Gmail accepted the message for ${mask(emails[i])}`)
    } else {
      const reason = result.status === 'rejected' ? result.reason?.message : result.value.response
      console.error(`${label}: Gmail did NOT accept the message for ${mask(emails[i])}: ${reason}`)
    }
  })
  const failed = results.filter((r) => r.status === 'rejected').length
  if (failed === emails.length && emails.length > 0) throw new Error(`${label}: every email failed to send.`)
}

// Returns the email addresses of parents with a registered account, either
// for one grade (gradeId) or for the whole school (gradeId === 'all').
// A teacher counts as a parent when they have a child registered.
// Includes a second parent/guardian when the account holder opted them in.
async function getRegisteredParentEmails(gradeId) {
  let parentIds
  if (gradeId === 'all') {
    const [usersSnap, childrenSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('children').get(),
    ])
    const withChildren = new Set(childrenSnap.docs.map(d => d.data().parentId).filter(Boolean))
    parentIds = usersSnap.docs
      .filter(d => d.data().role === 'parent' || withChildren.has(d.id))
      .map(d => d.id)
  } else {
    const childrenSnap = await db.collection('children').where('gradeId', '==', gradeId).get()
    const candidateIds = [...new Set(childrenSnap.docs.map(d => d.data().parentId).filter(Boolean))]
    const checks = await Promise.all(candidateIds.map(async (id) => {
      const userSnap = await db.collection('users').doc(id).get()
      return userSnap.exists ? id : null
    }))
    parentIds = checks.filter(Boolean)
  }
  return getParentEmails(parentIds)
}

// Email addresses for the given parent ids, plus each one's second
// parent/guardian when the account holder opted them in.
async function getParentEmails(parentIds) {
  const emails = await Promise.all(parentIds.map(async (id) => {
    const parentSnap = await db.collection('parents').doc(id).get()
    if (!parentSnap.exists) {
      // Teacher accounts created in the console have no parents document.
      const authUser = await getAuth().getUser(id).catch(() => null)
      return [authUser?.email]
    }
    const {email, secondGuardian} = parentSnap.data()
    return [email, secondGuardian?.notify ? secondGuardian.email : null]
  }))
  return [...new Set(emails.flat().filter(Boolean))]
}

// Contact form limits. The form sends through the school's Gmail account, whose
// daily sending quota is shared with homework and class emails, so the caps
// below keep a flood of spam from blocking those.
const CONTACT_MAX_PER_SENDER_PER_HOUR = 3
const CONTACT_MAX_PER_DAY = 50
const CONTACT_MIN_FILL_MS = 3000
const CONTACT_EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

// Counts one use of `key` in the current window and reports whether it is
// still within `max`. Documents live in `rateLimits`, which no client can read.
async function withinRateLimit(key, max, windowMs) {
  const ref = db.collection('rateLimits').doc(key)
  const now = Date.now()
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.exists ? snap.data() : null
    const fresh = !data || now - data.windowStart >= windowMs
    const count = fresh ? 1 : data.count + 1
    if (count > max) return false
    const windowStart = fresh ? now : data.windowStart
    tx.set(ref, {count, windowStart, expiresAt: new Date(windowStart + windowMs)})
    return true
  })
}

function rateLimitKey(prefix, value) {
  return prefix + '_' + crypto.createHash('sha256').update(value).digest('hex').slice(0, 32)
}

// enforceAppCheck rejects any call without a valid App Check token, which only
// the real website in a real browser can obtain (invisible reCAPTCHA).
exports.sendContactEmail = onCall({secrets: [gmailAppPassword], region: 'us-central1', enforceAppCheck: true}, async (request) => {
  const text = (value) => (typeof value === 'string' ? value.trim() : '')
  // Line breaks are removed from the name because it goes into email headers.
  const name    = text(request.data?.name).replace(/[\r\n]+/g, ' ')
  const email   = text(request.data?.email)
  const message = text(request.data?.message)

  if (!name || !email || !message) {
    throw new HttpsError('invalid-argument', 'Missing required fields.')
  }
  if (name.length > 100 || email.length > 200 || message.length > 5000 || !CONTACT_EMAIL_REGEX.test(email)) {
    throw new HttpsError('invalid-argument', 'Invalid fields.')
  }

  // Bots fill the hidden "website" field and submit instantly. Answer as if
  // the message was sent, so they get no hint about what to change.
  const elapsedMs = request.data?.elapsedMs
  if (text(request.data?.website) || (typeof elapsedMs === 'number' && elapsedMs < CONTACT_MIN_FILL_MS)) {
    console.log('Contact form: dropped a submission that looks automated.')
    return {ok: true}
  }

  const hour = 60 * 60 * 1000
  const ip = request.rawRequest?.ip || 'unknown'
  const day = new Date().toISOString().slice(0, 10)
  const allowed =
    (await withinRateLimit(rateLimitKey('contact_ip', ip), CONTACT_MAX_PER_SENDER_PER_HOUR, hour)) &&
    (await withinRateLimit(rateLimitKey('contact_email', email.toLowerCase()), CONTACT_MAX_PER_SENDER_PER_HOUR, hour)) &&
    (await withinRateLimit('contact_day_' + day, CONTACT_MAX_PER_DAY, 24 * hour))
  if (!allowed) {
    console.warn('Contact form: rate limit reached.')
    throw new HttpsError('resource-exhausted', 'Too many messages.')
  }

  await gmailTransporter().sendMail({
    from: `Strona PSD Niemcewicza <${SCHOOL_EMAIL}>`,
    to: SCHOOL_EMAIL,
    replyTo: {name, address: email},
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

    const lines = [
      `Nauczyciel dodał nowe zadanie domowe dla klasy: ${gradeName}`,
      '',
      `Tytuł: ${hw.title}`,
    ]
    if (dueDate) lines.push(`Termin oddania: ${dueDate}`)
    if (hw.description) lines.push('', hw.description)

    // Attach the teacher's files while they fit in one Gmail message; every
    // link is always included so larger files can still be downloaded.
    const files = hw.attachments
      || (hw.attachmentUrl ? [{url: hw.attachmentUrl, name: hw.attachmentName}] : [])
    const attachments = []
    let attachedBytes = 0
    if (files.length > 0) lines.push('', files.length === 1 ? 'Załącznik:' : 'Załączniki:')
    for (const file of files) {
      const fileName = file.name || 'zalacznik'
      lines.push(`${fileName} — ${file.url}`)
      try {
        const res = await fetch(file.url)
        const content = Buffer.from(await res.arrayBuffer())
        if (res.ok && attachedBytes + content.length <= MAX_EMAIL_ATTACHMENT_BYTES) {
          attachments.push({filename: fileName, content})
          attachedBytes += content.length
        }
      } catch (err) {
        console.error('Could not fetch homework attachment', err)
      }
    }

    await sendToEach('Homework email', emails, () => ({
      from: `PSD Niemcewicza <${SCHOOL_EMAIL}>`,
      subject: `Nowe zadanie domowe — ${gradeName}`,
      text: lines.join('\n'),
      attachments,
    }))
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

    // A message can target hand-picked parents (parentIds) instead of a class.
    const picked = Array.isArray(msg.parentIds) ? msg.parentIds.filter((id) => typeof id === 'string') : []
    const emails = picked.length > 0
      ? await getParentEmails([...new Set(picked)])
      : await getRegisteredParentEmails(msg.gradeId)
    if (emails.length === 0) return

    await sendToEach('Class message', emails, () => ({
      from: `PSD Niemcewicza <${SCHOOL_EMAIL}>`,
      subject: msg.subject,
      text: msg.message,
    }))
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
      await sendToEach('Announcement email', emails, () => ({
        from: `PSD Niemcewicza <${SCHOOL_EMAIL}>`,
        subject: `Nowe ważne ogłoszenie: ${doc.title}`,
        text: `Szkoła opublikowała nowe ważne ogłoszenie: ${doc.title}\n\nSzczegóły: ${SITE_URL}/pl/announcements`,
      }))
    }

    res.status(200).send('OK')
  }
)
