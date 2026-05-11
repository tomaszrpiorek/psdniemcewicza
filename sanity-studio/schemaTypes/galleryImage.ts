import {defineField, defineType} from 'sanity'

export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Events', value: 'events'},
          {title: 'Classes', value: 'classes'},
          {title: 'Sports', value: 'sports'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'takenAt',
      title: 'Date Taken',
      type: 'date',
    }),
  ],
  preview: {
    select: {title: 'caption', media: 'image', subtitle: 'category'},
    prepare({title, media, subtitle}) {
      return {
        title: title || 'Untitled',
        media,
        subtitle,
      }
    },
  },
})
