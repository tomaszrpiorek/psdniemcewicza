import {defineField, defineType} from 'sanity'

export const galleryAlbum = defineType({
  name: 'galleryAlbum',
  title: 'Gallery Album',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "Christmas Party", "First Day of School", "Field Trip"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
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
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Shown on the gallery overview. If left empty, the first photo below is used instead.',
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  orderings: [
    {
      title: 'Date, Newest First',
      name: 'dateDesc',
      by: [{field: 'date', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', media: 'coverImage', photo0: 'photos.0', subtitle: 'category'},
    prepare({title, media, photo0, subtitle}) {
      return {
        title: title || 'Untitled album',
        media: media || photo0,
        subtitle,
      }
    },
  },
})
