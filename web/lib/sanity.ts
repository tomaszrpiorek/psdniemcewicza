import {createClient} from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
export const client = createClient({
  projectId: '7cwqf31k',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}
