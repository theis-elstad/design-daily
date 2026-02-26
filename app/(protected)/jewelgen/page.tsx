export const runtime = 'edge'

import { redirect } from 'next/navigation'

export default function JewelGenPage() {
  redirect('/jewelgen/new')
}
