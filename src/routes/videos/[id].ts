import { Handler } from 'express'
import { validate } from 'uuid'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import { checkVideoExists, saveVideoLocally } from '../../lib/supabase'
import { getMetadataJSON } from '../../lib/ffmpeg'

/**
 * @openapi
 * /videos/{id}:
 *   head:
 *     summary: Get video metadata
 *     description: Get the header metadata for a video
 *     parameters:
 *     - name: id
 *       description: The ID of the video to download
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     responses:
 *       400:
 *         description: Missing or malformed ID
 *       404:
 *         description: Video not found
 *       200:
 *         description: A video file
 */
const tmpDir = os.tmpdir()

const parseMetadata = (metadata: any) => {
	const videoStream =
		metadata.streams.find((stream: any) => stream.codec_type === 'video') ?? {}
	const videoStreamHeaders = {
		'Video-Codec': videoStream.codec_name,
		'Video-Resolution': `${videoStream.width}x${videoStream.height}`,
		'Video-Duration': videoStream.duration,
		'Video-Bit-Rate': videoStream.bit_rate,
		'Video-Frame-Rate': videoStream.r_frame_rate
	}
	const audioStream =
		metadata.streams.find((stream: any) => stream.codec_type === 'audio') ?? {}
	const audioStreamHeaders = {
		'Audio-Codec': audioStream.codec_name,
		'Audio-Channel-Count': audioStream.channels,
		'Audio-Sample-Rate': audioStream.sample_rate,
		'Audio-Bit-Rate': audioStream.bit_rate
	}
	const format = metadata.format ?? {}
	const formatHeaders = {
		'Video-Format': format.format_name,
		'Content-Length': format.size,
		'Bit-Rate': format.bit_rate
	}

	return {
		...videoStreamHeaders,
		...audioStreamHeaders,
		...formatHeaders
	}
}

const downloadAndGetMetadata = async (folder: string, id: string) => {
	const path = await saveVideoLocally(folder, id)
	const metadata = await getMetadataJSON(path)
	const headers = parseMetadata(metadata)
	return { headers, path }
}

export const head: Handler = async (request, response) => {
	const { id } = request.params
	if (!id) return response.status(400).json({ error: 'Missing video ID.' })
	if (!validate(id)) {
		return response.status(400).json({ error: 'Malformed ID.' })
	}

	// search for the video
	const [uploadedExists, mergedExists] = await Promise.all([
		checkVideoExists('uploaded', id),
		checkVideoExists('merged', id)
	])

	if (!uploadedExists && !mergedExists) {
		return response.status(404).send()
	}

	try {
		if (uploadedExists) {
			const { headers, path } = await downloadAndGetMetadata('uploaded', id)
			for (const [key, value] of Object.entries(headers)) {
				response.setHeader(key, value)
			}
			// non-awaited cleanup to keep the response snappy
			fs.rm(path)
			return response.send()
		}

		// doing merged as a separate branch in case we want to handle get/head
		// differently than uploaded in the future.
		if (mergedExists) {
			const { headers, path } = await downloadAndGetMetadata('uploaded', id)
			for (const [key, value] of Object.entries(headers)) {
				response.setHeader(key, value)
			}
			// non-awaited cleanup to keep the response snappy
			fs.rm(path)
			return response.send()
		}
	} catch (error) {
		return response.status(500)
	}

	return response.send()
}

/**
 * @openapi
 * /videos/{id}:
 *   get:
 *     summary: Download a video
 *     description: Download a video from either the raw or uploaded videos
 *     parameters:
 *     - name: id
 *       description: The ID of the video to download
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     responses:
 *       400:
 *         description: Missing or malformed ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Malformed ID
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   description: The error message
 *                   type: string
 *                   example: Video not found
 *       200:
 *         description: A video file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   description: The ID of the video
 *                   type: string
 *                   format: uuid
 */
export const get: Handler = (request, response) => {
	const { id } = request.params
	if (!id) return response.status(400).json({ error: 'Missing ID' })
	if (!validate(id)) return response.status(400).json({ error: 'Malformed ID' })
	return response.json({ id })
}
