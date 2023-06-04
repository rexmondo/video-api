import { Handler } from 'express'
import { validate } from 'uuid'

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
export const head: Handler = (request, response) => {
	const { id } = request.params
	if (!id) return response.status(400).json({ error: 'Malformed ID' })
	if (!validate(id)) return response.status(400).json({ error: 'Malformed ID' })
	return response.json({ id })
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
