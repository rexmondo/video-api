import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as os from 'node:os'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
	throw new Error(
		'Missing SUPABASE_URL or SUPABASE_ANON_KEY. Cannot start application.'
	)
}

const VIDEO_BUCKET = 'videos'

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_ANON_KEY
)

export async function checkVideoExists(folder: string, id: string) {
	const { publicUrl } = supabase.storage
		.from(VIDEO_BUCKET)
		.getPublicUrl(`${folder}/${id}.mp4`).data
	return Boolean((await fetch(publicUrl, { method: 'HEAD' })).ok)
}

export async function uploadVideo(uploadPath: string, filePath: string) {
	return supabase.storage
		.from(VIDEO_BUCKET)
		.upload(uploadPath, fs.createReadStream(filePath), {
			contentType: 'video/mp4',
			duplex: 'half'
		})
}

export async function getVideoStream(folder: string, id: string) {
	const { publicUrl } = supabase.storage
		.from(VIDEO_BUCKET)
		.getPublicUrl(`${folder}/${id}.mp4`).data
	return fetch(publicUrl, { method: 'GET' })
}

export async function saveVideoLocally(folder: string, id: string) {
	const path = `${os.tmpdir()}/${id}.mp4`
	const response = await getVideoStream(folder, id)
	const buffer = Buffer.from(await response.arrayBuffer())
	console.log(path, buffer)
	// await fs.promises.writeFile(path, Buffer.from(await response.arrayBuffer()))
	return path
}

export default supabase
