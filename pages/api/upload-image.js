const UPANH_API = 'https://www.upanhnhanh.com/api/v1/upload'
const UPANH_KEY = process.env.UPANH_API_KEY || 'upanh_HPtVBkCkQ5y0oONYfppleh33kaVWIdvbqBm5Rjuv5A0zZNw8'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const { image_base64 } = req.body || {}
  if (!image_base64) return res.status(400).json({ ok: false, error: 'Thiếu image_base64' })

  try {
    const match = image_base64.match(/^data:(.+);base64,(.+)$/)
    if (!match) return res.status(400).json({ ok: false, error: 'Sai định dạng base64' })
    const [, mimeType, b64Data] = match
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'

    const buffer = Buffer.from(b64Data, 'base64')
    const blob = new Blob([buffer], { type: mimeType })

    const formData = new FormData()
    formData.append('images[]', blob, `upload.${ext}`)

    const uRes = await fetch(UPANH_API, {
      method: 'POST',
      headers: { 'X-API-Key': UPANH_KEY },
      body: formData,
    })

    const data = await uRes.json()
    if (!uRes.ok || !data.success) {
      return res.status(500).json({ ok: false, error: data.message || 'Upload thất bại' })
    }

    const url = data.urls?.[0] || data.data?.[0]?.proxy_url
    if (!url) return res.status(500).json({ ok: false, error: 'Không nhận được URL ảnh' })

    return res.json({ ok: true, url, thumbnail: data.data?.[0]?.thumbnail_url || url })
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Lỗi upload: ' + e.message })
  }
}
