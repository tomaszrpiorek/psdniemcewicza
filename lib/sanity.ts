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

// Pulls a single photo from the newest gallery albums, for use as a page
// header background. `index` picks a different shot per page so pages
// linked from the same nav don't all show the identical photo.
export async function getFeaturedPhoto(index: number): Promise<string | null> {
  const albums: {photos: {asset?: unknown}[]}[] = await client.fetch(
    `*[_type == "galleryAlbum"] | order(coalesce(date, "1970-01-01") desc) { "photos": photos[defined(asset)] }`
  )
  const photo = albums.flatMap((a) => a.photos)[index]
  return photo ? urlFor(photo).width(1800).height(700).fit('crop').url() : null
}
