import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react-swc'
import type { BuildOptions } from 'vite'

export default defineConfig(({ mode }) => {
    const commonBuildOptions: BuildOptions = {
        minify: mode === 'production',
        sourcemap: mode === 'development' ? 'inline' : undefined
    }

    return {
        main: {
            build: commonBuildOptions,
            plugins: [externalizeDepsPlugin()]
        },
        preload: {
            build: commonBuildOptions,
            plugins: [externalizeDepsPlugin()]
        },
        renderer: {
            build: commonBuildOptions,
            plugins: [react()]
        }
    }
})
