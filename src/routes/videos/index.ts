import { Handler } from 'express'
import { v4 as uuidv4 } from 'uuid'
import * as os from 'node:os'
import * as fs from 'node:fs/promises'
import multer from 'multer'

import { uploadVideo } from '../../lib/supabase'
import { encodeStandard } from '../../lib/ffmpeg'

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
 *               type: object
 *               properties:
 *                 error:
 *                   description: The error message
 *                   type: string
 *                   example: Invalid video file
 *       500:
 *         description: Error Uploading video
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   description: The error message
 *                   type: string
 *                   example: Error occured uploading video
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
	async (request, response) => {
		// make an id for the file
		const id = uuidv4()

		// grab the filePath and mimetype
		if (!request.file) {
			return response
				.status(400)
				.json({ error: 'Missing video file in request.' })
		}
		if (request.file.fieldname !== 'video') {
			return response.status(400).json({
				error: "Malformed request. Video file field name must be 'video'."
			})
		}
		// reject for invalid mimetypes
		if (!request.file.mimetype.includes('video/')) {
			return response.status(400).json({ error: 'Not a video file.' })
		}
		try {
			const inPath = request.file.path
			const outPath = `${inPath}-converted.mp4`
			await encodeStandard(inPath, outPath)
			await uploadVideo(`uploaded/${id}.mp4`, outPath)

			// delete the temporary files
			// no await here because we don't want to block the response
			fs.rm(inPath)
			fs.rm(outPath)

			// hooray happy path
			return response.json({ id })
		} catch (err: any) {
			console.error(err)
			return response.status(500).json({ error: 'Error uploading video.' })
		}
	}
]
