import { Handler } from 'express'
import { validate } from 'uuid'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import {
	checkVideoExists,
	downloadVideo,
	saveVideoLocally
} from '../../lib/supabase'
import { getMetadata } from '../../lib/ffmpeg'

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
			const savePath = await saveVideoLocally('uploaded', id)
			const metadata = await getMetadata(savePath)
			console.log(savePath, metadata)
			return response.set('boogie', 'woogie').send()
		}

		if (mergedExists) {
			const savePath = await saveVideoLocally('uploaded', id)
			const output = await getMetadata(savePath)
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
	if (!id) return response.status(400).json({ error: 'Malformed ID' })
	if (!validate(id)) return response.status(400).json({ error: 'Malformed ID' })
	return response.json({ id })
}
