import { Handler } from 'express'
import { v4 as uuidv4 } from 'uuid'
import ffmpeg from 'fluent-ffmpeg'
import * as os from 'node:os'
import multer from 'multer'

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
const tmpDir = os.tmpdir()
export const post: Handler[] = [
	// parse multipart/form-data into a file field in the request
	multer({ dest: tmpDir }).single('video'),
	(request, response) => {
		const id = uuidv4()
		// convert saved file
		console.log(process.env, request.file)

		// send saved file to supabase
		// return id
		return response.json({ id })
	}
]
