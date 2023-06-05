import { promisify } from 'node:util'
import { exec } from 'node:child_process'

const execAsync = promisify(exec)

export async function ffmpeg(input: string) {
	return execAsync(`ffmpeg ${input}`)
}

export async function ffprobe(input: string) {
	const { stdout } = await execAsync(`ffprobe ${input}`)
	return JSON.parse(stdout)
}

export async function encodeStandard(inputPath: string, outputPath: string) {
	return ffmpeg(`-i ${inputPath} -c:v libx264 -c:a libfdk_aac ${outputPath}`)
}

export async function getMetadataJSON(inputPath: string) {
	const { stdout } = await ffprobe(
		`-v quiet -print_format json -show_format -show_streams ${inputPath}`
	)
	return JSON.parse(stdout)
}
