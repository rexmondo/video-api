## Take-Home Test -- Video API

### Description

This video API project uses `ffmpeg` and `ffprobe` from the host machine's environment to upload and
download video files and metadata from supabase. It also lets the user merge two previously uploaded
video files into a single merged file.

### Running the project locally

1. Make sure you have `ffmpeg` and `ffprobe` installed on your machine, with `libx264` for video
   and `libfdk_aac` for audio. For example, on MacOS/Linux (using [homebrew](https://brew.sh/)):

   ```sh
   $ brew tap homebrew-ffmpeg/ffmpeg
   $ brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-fdk-aac
   ```

1. Install node using nvm (or whatever method you prefer). Its always a good idea to click through  
   and check scripts for nastiness before piping them directly into bash. A .nvmrc file has been
   provided in this project to make sure the node version is correct.

   ```sh
   $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   $ cd path/to/project
   $ nvm use
   ```

1. Install pnpm and project dependencies

   ```sh
   $ npm install -g pnpm
   $ pnpm install
   ```

1. Add a `.env` file. This file should contain the following
   properties, used to connect to a properly configured supabase service: `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

1. Choose whether you want to run the development or production build version of the project.
   For Development:

   ```sh
   $ pnpm dev
   ```

   For Production Build

   ```sh
   $ pnpm build && pnpm start
   ```

### Running the project in a container

A [Dockerfile](./Dockerfile) has been provided to build the project into a container.
Note that we have to build ffmpeg from source because we are using libfdk-aac.
The docker command to run the build has been provided in the scripts tag.

```sh
$ pnpm build:docker
```

### API Docs

Swagger API docs are available at `localhost:4000/api-docs` (or wherever you map the
container url and port to). These let you try out the live api if you want to test it.

### Notes about the solution

- **Folder based routing**:

  Routes are defined by adding folders and files into the router directory.
  Folders represent path segments, and `[bracketed-values]` represent dynamic
  path segments that are injected into the handler as `request.params`.

  Each route can have middleware provided to it by exporting an array instead of a single
  `Handler` function. This is whats happening with `multer` in the `/videos` `POST` endpoint.

- **Co-located API docs**:

  This project uses `swagger-ui` and `swagger-jsdoc` to co-locate the API documentation with
  the endpoints. Colocation is better for this because it removes a barrier from keeping docs
  up to date. Nobody likes stale API docs. Swagger was chosen so that we have the tools to
  live test the API. Live testing using the docs is also a great way to encourage docs to
  stay up to date.

- **Web streams**:

  Wherever possible, this project endeavors to use web standards. Fetch was recently added to
  node.js core, and the version that was added aligns with the whatwg spec. This makes it mildly
  annoying to interact with the fs, which is written on the older node.js stream standard, but
  that is the cost of future-proofing.
