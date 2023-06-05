import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import watermark from '../assets/watermark.png'

const tmpDir = os.tmpdir()

const execAsync = promisify(exec)

export async function ffmpeg(input: string) {
	const { stdout, stderr } = await execAsync(`ffmpeg ${input}`)
	if (stderr) throw new Error(stderr)
	return stdout
}

export async function ffprobe(input: string) {
	const { stdout, stderr } = await execAsync(`ffprobe ${input}`)
	if (stderr) throw new Error(stderr)
	return stdout
}

export async function encodeStandard(inputPath: string, outputPath: string) {
	return ffmpeg(`-i ${inputPath} -c:v libx264 -c:a libfdk_aac ${outputPath}`)
}

export async function getMetadataJSON(inputPath: string) {
	const data = await ffprobe(
		`-v quiet -print_format json -show_format -show_streams ${inputPath}`
	)
	return JSON.parse(data)
}

export async function truncateVideo(
	inputPath: string,
	outputPath: string,
	duration: number
) {
	const metadata = await getMetadataJSON(inputPath)
	if (metadata.format?.duration < duration) {
		await fs.copyFile(inputPath, outputPath)
		return
	}
	return ffmpeg(`-i ${inputPath} -t ${duration} ${outputPath}`)
}

export async function concatVideos(
	inputPath1: string,
	inputPath2: string,
	outputPath: string
) {
	const instructionPath = `${tmpDir}/input.txt`
	await fs.writeFile(
		instructionPath,
		`file '${inputPath1}'\nfile '${inputPath2}'`
	)
	await ffmpeg(`-f concat -safe 0 -i ${instructionPath} -c copy ${outputPath}`)
	fs.rm(instructionPath)
	return
}

export async function overlayVideo(inputPath: string, outputPath: string) {
	return ffmpeg(
		`-i ${inputPath} -i ../assets/watermark.png -filter_complex "[1][0]scale2ref=oh*mdar:ih*0.2[logo][video];[video][logo]overlay" ${outputPath}`
	)
}
