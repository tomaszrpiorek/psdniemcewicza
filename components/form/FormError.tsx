export default function FormError({message}: {message?: string}) {
  if (!message) return null
  return <p className="mt-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded px-4 py-3">{message}</p>
}
