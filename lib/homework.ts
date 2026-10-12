export type HomeworkAttachment = {url: string; name: string}

type AttachmentFields = {
  attachments?: HomeworkAttachment[]
  // Older homework documents hold a single file in these two fields.
  attachmentUrl?: string
  attachmentName?: string
}

export function homeworkAttachments(hw: AttachmentFields): HomeworkAttachment[] {
  if (hw.attachments) return hw.attachments
  return hw.attachmentUrl ? [{url: hw.attachmentUrl, name: hw.attachmentName ?? ''}] : []
}
