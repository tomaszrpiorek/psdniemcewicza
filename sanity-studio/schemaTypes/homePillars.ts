import {defineField, defineType} from 'sanity'

const pillarImage = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    description: 'Karta jest pionowa — kliknij ikonę ołówka na zdjęciu, aby wybrać, która część ma być widoczna.',
  })

export const homePillars = defineType({
  name: 'homePillars',
  title: 'Strona główna — zdjęcia Nasza Misja',
  type: 'document',
  fields: [
    pillarImage('jezykPolski', 'Język Polski'),
    pillarImage('historia', 'Historia i Kultura'),
    pillarImage('tradycje', 'Tradycje i Wydarzenia'),
  ],
  preview: {
    prepare: () => ({title: 'Strona główna — zdjęcia Nasza Misja'}),
  },
})
