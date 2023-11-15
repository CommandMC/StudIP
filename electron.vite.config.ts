import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => ({
    main: {
        build: {
            minify: mode === 'production'
        },
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        build: {
            minify: mode === 'production'
        },
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        build: {
            minify: mode === 'production'
        },
        plugins: [react()]
    }
}))
