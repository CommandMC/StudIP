import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { BuildOptions } from 'vite'

export default defineConfig(({ mode }) => {
    const commonBuildOptions: BuildOptions = {
        minify: mode === 'production',
        sourcemap: mode === 'development' ? 'inline' : undefined
    }

    return {
        main: {
            build: { ...commonBuildOptions, externalizeDeps: true }
        },
        preload: {
            build: { ...commonBuildOptions, externalizeDeps: true }
        },
        renderer: {
            build: commonBuildOptions,
            plugins: [react()]
        }
    }
})
