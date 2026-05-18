import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const REACT_VENDOR_PACKAGES = new Set(['react', 'react-dom', 'scheduler'])
const ROUTER_VENDOR_PACKAGES = new Set(['react-router', 'react-router-dom'])
const MARKDOWN_VENDOR_PACKAGES = new Set([
  '@types/hast',
  '@types/mdast',
  '@types/unist',
  'bail',
  'ccount',
  'character-entities',
  'comma-separated-tokens',
  'decode-named-character-reference',
  'devlop',
  'estree-util-is-identifier-name',
  'hast-util-to-jsx-runtime',
  'hast-util-whitespace',
  'html-url-attributes',
  'inline-style-parser',
  'is-alphabetical',
  'is-alphanumerical',
  'is-decimal',
  'is-hexadecimal',
  'kleur',
  'longest-streak',
  'markdown-table',
  'mdast-util-to-hast',
  'parse-entities',
  'property-information',
  'react-markdown',
  'space-separated-tokens',
  'style-to-js',
  'style-to-object',
  'trim-lines',
  'trough',
  'unified',
  'web-namespaces',
  'zwitch',
])
const MARKDOWN_VENDOR_PREFIXES = [
  'mdast-util-',
  'micromark',
  'remark-',
  'unist-',
  'vfile',
]

function getNodeModulePackageName(id) {
  const normalizedId = id.replace(/\\/g, '/')
  const marker = '/node_modules/'
  const nodeModulesIndex = normalizedId.lastIndexOf(marker)

  if (nodeModulesIndex === -1) {
    return undefined
  }

  const packagePath = normalizedId.slice(nodeModulesIndex + marker.length)
  const [scopeOrName, packageName] = packagePath.split('/')

  if (!scopeOrName) {
    return undefined
  }

  return scopeOrName.startsWith('@') ? `${scopeOrName}/${packageName}` : scopeOrName
}

function getVendorChunkName(id) {
  const packageName = getNodeModulePackageName(id)

  if (!packageName) {
    return undefined
  }

  if (REACT_VENDOR_PACKAGES.has(packageName)) {
    return 'vendor-react'
  }

  if (ROUTER_VENDOR_PACKAGES.has(packageName)) {
    return 'vendor-router'
  }

  if (packageName.startsWith('@supabase/')) {
    return 'vendor-supabase'
  }

  if (
    MARKDOWN_VENDOR_PACKAGES.has(packageName) ||
    MARKDOWN_VENDOR_PREFIXES.some((prefix) => packageName.startsWith(prefix))
  ) {
    return 'vendor-markdown'
  }

  return 'vendor'
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: getVendorChunkName,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
