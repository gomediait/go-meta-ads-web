// Upload ảnh qua backend proxy → upanhnhanh.com
// Input: File object
// Output: Promise<{url, thumbnail}> hoặc throws error

export async function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result // data:image/jpeg;base64,...
        // Gọi action upload_image trong ticket.js (gộp chung để giảm function count)
        const res = await fetch('https://go-meta-ads-backend.vercel.app/api/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload_image', image_base64: base64 }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error || 'Upload thất bại')
        resolve({ url: data.url, thumbnail: data.thumbnail || data.url })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Không đọc được file'))
    reader.readAsDataURL(file)
  })
}
