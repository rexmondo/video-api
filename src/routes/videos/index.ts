import { Handler } from 'express'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../../lib/supabase'

/**
 * @openapi
 * /videos:
 *   post:
 *     summary: Upload a video
 *     description: Uploads a video to the uploaded videos folder
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *            schema:
 *              type: object
 *              properties:
 *                video:
 *                  type: string
 *                  format: binary
 *     responses:
 *       400:
 *         description: Malformed video file
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               error:
 *                 description: The error message
 *                 type: string
 *                 example: Invalid video file
 *       500:
 *         description: Error Uploading video
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               error:
 *                 description: The error message
 *                 type: string
 *                 example: Error occured uploading video
 *
 *       200:
 *         description: An id for the video that was just uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   description: The id of the uploaded video
 *                   type: string
 *                   format: uuid
 */
export const post: Handler = (request, response) => {
	const id = uuidv4()
	// convert video

	// upload video
	// return id
	return response.json({ id: uuidv4() })
}
