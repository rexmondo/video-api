import { Handler } from 'express'
import { validate } from 'uuid'

/**
 * @openapi
 * /videos/merge/{id1}/{id2}:
 *   get:
 *     summary: Merge two videos
 *     description: Merge two videos together into a single video and get the new video ID
 *     parameters:
 *     - name: id1
 *       description: The ID of the first video to merge
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     - name: id2
 *       description: The ID of the second video to merge
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *     responses:
 *       400:
 *         description: Missing or malformed IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   description: The error message
 *                   type: string
 *                   example: Malformed ID for id1
 *       404:
 *         description: Video(s) not found
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
 *         description: Merged video successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   description: The ID of the merged video
 *                   type: string
 *                   format: uuid
 */
export const get: Handler = (request, response) => {
	const { id } = request.params
	if (!id) return response.status(400).json({ error: 'Malformed ID' })
	if (!validate(id)) return response.status(400).json({ error: 'Malformed ID' })
	return response.json({ id })
}
