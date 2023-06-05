import { Handler } from 'express'
import { validate } from 'uuid'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import { checkVideoExists, saveVideoLocally } from '../../lib/supabase'
import { getMetadataJSON } from '../../lib/ffmpeg'

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
		...Object.fromEntries([
			...Object.entries(videoStreamHeaders).filter(([_, v]) => Boolean(v)),
			...Object.entries(audioStreamHeaders).filter(([_, v]) => Boolean(v)),
			...Object.entries(formatHeaders).filter(([_, v]) => Boolean(v))
		])
	}
}

const downloadAndGetMetadata = async (folder: string, id: string) => {
	const path = await saveVideoLocally(folder, id)
	const metadata = await getMetadataJSON(path)
	const headers = parseMetadata(metadata)
	return { headers, path }
}

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
export const head: Handler = async (request, response) => {
	const { id } = request.params
	if (!id) return response.status(400).json({ error: 'Missing video ID.' })
	if (!validate(id)) {
		return response.status(400).json({ error: 'Malformed ID.' })
	}

	try {
		// search for the video
		const [uploadedExists, mergedExists] = await Promise.all([
			checkVideoExists('uploaded', id),
			checkVideoExists('merged', id)
		])

		if (!uploadedExists && !mergedExists) {
			return response.status(404).send()
		}

		if (uploadedExists) {
			const { headers, path } = await downloadAndGetMetadata('uploaded', id)
			for (const [key, value] of Object.entries(headers)) {
				response.setHeader(key, value)
			}
			// set content type and disposition manually for head
			response.setHeader('Content-Type', 'video/mp4')
			response.setHeader(
				'Content-Disposition',
				`attachment; filename=${id}.mp4`
			)
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
			// set content type and disposition manually for head
			response.setHeader('Content-Type', 'video/mp4')
			response.setHeader(
				'Content-Disposition',
				`attachment; filename=${id}.mp4`
			)
			// non-awaited cleanup to keep the response snappy
			fs.rm(path)
			return response.send()
		}
	} catch (error) {
		return response.status(500)
	}
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
 *           video/mp4:
 *             schema:
 *                type: string
 *                format: binary
 */
export const get: Handler = async (request, response) => {
	const { id } = request.params
	if (!id) return response.status(400).json({ error: 'Missing ID' })
	if (!validate(id)) return response.status(400).json({ error: 'Malformed ID' })

	try {
		// search for the video
		const [uploadedExists, mergedExists] = await Promise.all([
			checkVideoExists('uploaded', id),
			checkVideoExists('merged', id)
		])

		if (!uploadedExists && !mergedExists) {
			return response.status(404).json({ error: 'Video not found' })
		}

		if (uploadedExists) {
			const { headers, path } = await downloadAndGetMetadata('uploaded', id)
			for (const [key, value] of Object.entries(headers)) {
				response.setHeader(key, value)
			}
			response.attachment(`${id}.mp4`)
			return response.sendFile(path)
		}

		// again, keeping merged as a separate block here in case we want to
		// change the behavior in the future.
		if (mergedExists) {
			const { headers, path } = await downloadAndGetMetadata('merged', id)
			for (const [key, value] of Object.entries(headers)) {
				response.setHeader(key, value)
			}
			response.attachment(`${id}.mp4`)
			return response.sendFile(path)
		}
	} catch (error) {
		console.error(error)
		return response
			.status(500)
			.json({ error: 'Something went wrong fetching the video.' })
	}
}
