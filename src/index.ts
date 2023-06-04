import express, { Express } from 'express'
import { router } from 'express-file-routing'
import dotenv from 'dotenv'
import * as path from 'node:path'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import packageJson from '../package.json'

dotenv.config()

async function startApp() {
	const app: Express = express()
	const port = process.env.PORT

	app.use(
		'/',
		await router({
			directory: path.join(__dirname, 'routes')
		})
	)

	app.use(
		'/api-docs',
		swaggerUi.serve,
		swaggerUi.setup(
			swaggerJSDoc({
				definition: {
					openapi: '3.0.0',
					info: {
						title: packageJson.name,
						version: packageJson.version
					}
				},
				apis: ['./src/routes/**/*.ts']
			})
		)
	)

	app.listen(port, () => {
		console.log(`[server]: Server is running at http://localhost:${port}`)
	})
}

startApp()
