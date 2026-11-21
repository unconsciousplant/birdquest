import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vite settings. Docs: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative file paths, so the built site works in any folder: on your computer
  // at "/" and on GitHub Pages at "/birdquest/". This is safe because every
  // screen is part of the same page (addresses like #/plan), never a sub-folder.
  base: './',
})
