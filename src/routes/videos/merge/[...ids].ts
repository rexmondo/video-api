import { Handler } from 'express'
import { validate } from 'uuid'
import * as os from 'node:os'
import * as fs from 'node:fs/promises'
import { v4 as uuidv4 } from 'uuid'
import {
	checkVideoExists,
	saveVideoLocally,
	uploadVideo
} from '../../../lib/supabase'
import { concatVideos, overlayVideo, truncateVideo } from '../../../lib/ffmpeg'

const tmpDir = os.tmpdir()

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
 *       500:
 *         description: Something went wrong merging the videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   description: The error message
 *                   type: string
 *                   example: Something went wrong merging the videos
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
export const get: Handler = async (request, response) => {
	// merge is implemented as a catch-all (https://github.com/matthiaaas/express-file-routing#catch-all-unstable)
	// this is an unstable feature for this library but in all likelihood will get features like those
	// that exist in other fullstack frameworks.
	// This method of doing merge was chosen to allow merge to be easily extended to 3+ videos in the future
	const ids = (request.params[0] ?? '').split('/')

	if (ids.length < 2) {
		return response.status(400).json({ error: 'Missing IDs' })
	}
	if (ids.length > 2) {
		return response.status(400).json({ error: 'Too many IDs' })
	}

	if (ids.some((id) => !validate(id))) {
		return response.status(400).json({ error: 'Malformed ID' })
	}

	try {
		const [id1, id2] = ids
		// check if the videos exist
		const [
			video1ExistsUploaded,
			video2ExistsUploaded,
			video1ExistsMerged,
			video2ExistsMerged
		] = await Promise.all([
			...ids.map((id) => checkVideoExists('uploaded', id)),
			...ids.map((id) => checkVideoExists('merged', id))
		])

		if (
			!video1ExistsUploaded &&
			!video1ExistsMerged &&
			!video2ExistsUploaded &&
			!video2ExistsMerged
		) {
			return response
				.status(404)
				.json({ error: `Videos ${id1} and ${id2} not found` })
		}

		if (!video1ExistsUploaded && !video1ExistsMerged) {
			return response.status(404).json({ error: `Video ${id1} not found` })
		}

		if (!video2ExistsUploaded && !video2ExistsMerged) {
			return response.status(404).json({ error: `Video ${id2} not found` })
		}

		if (video1ExistsMerged && video2ExistsMerged) {
			return response.status(400).json({
				error: `Videos ${id1} and ${id2} are merged videos and can't be merged again`
			})
		}

		if (video1ExistsMerged) {
			return response.status(400).json({
				error: `Video ${id1} is a merged video and can't be merged again`
			})
		}

		if (video2ExistsMerged) {
			return response.status(400).json({
				error: `Video ${id1} is a merged video and can't be merged again`
			})
		}

		// download both videos
		const [path1, path2] = await Promise.all([
			saveVideoLocally('uploaded', ids[0]),
			saveVideoLocally('uploaded', ids[1])
		])

		// truncate videos
		const truncated1Path = `${tmpDir}/${id1}-trunc.mp4`
		const truncated2Path = `${tmpDir}/${id2}-trunc.mp4`
		await Promise.all([
			truncateVideo(path1, truncated1Path, 30),
			truncateVideo(path2, truncated2Path, 30)
		])

		const mergedPath = `${tmpDir}/${id1}-${id2}-merged.mp4`
		await concatVideos(truncated1Path, truncated2Path, mergedPath)

		const overlayPath = `${tmpDir}/${id1}-${id2}-overlay.mp4`
		await overlayVideo(mergedPath, overlayPath)

		const id = uuidv4()
		const uploadPath = `merged/${id}.mp4`
		await uploadVideo(uploadPath, overlayPath)

		fs.rm(truncated1Path)
		fs.rm(truncated2Path)
		fs.rm(mergedPath)
		fs.rm(overlayPath)

		return response.status(200).json({ id })
	} catch (error) {
		console.error(error)
		return response
			.status(500)
			.json({ error: 'Something went wrong merging the videos' })
	}
}
