export default function HoTro() { return null }

export async function getServerSideProps() {
  return { redirect: { destination: '/dashboard/support', permanent: true } }
}
