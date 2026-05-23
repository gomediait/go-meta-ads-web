export async function getServerSideProps() {
  return { redirect: { destination: '/register', permanent: true } }
}
export default function TaiXuong() { return null }
