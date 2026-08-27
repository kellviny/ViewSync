import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const rootPkgPath = path.join(rootDir, 'package.json')
const readmePath = path.join(rootDir, 'README.md')
const setupPath = path.join(rootDir, 'SETUP.md')
const desktopReadmePath = path.join(rootDir, 'apps/desktop-transmissor/README.md')
const viewerReadmePath = path.join(rootDir, 'apps/viewer-web/README.md')

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'))
const currentVersion = rootPkg.version

console.log(`🔍 Verificando sincronização da documentação (.md) para a versão ${currentVersion}...`)

let hasErrors = false
const errors = []

function checkFile(filePath, fileName, checks) {
  if (!fs.existsSync(filePath)) {
    errors.push(`❌ Arquivo não encontrado: ${fileName}`)
    hasErrors = true
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  for (const { desc, test } of checks) {
    if (!test(content)) {
      errors.push(`❌ [${fileName}] Falha na verificação: ${desc}`)
      hasErrors = true
    }
  }
}

// 1. README.md Checks
checkFile(readmePath, 'README.md', [
  {
    desc: `Badge de versão deve conter a versão atual (${currentVersion})`,
    test: (c) => c.includes(`version-${currentVersion}-blue.svg`),
  },
  {
    desc: 'Deve conter comandos de desenvolvimento (npm run dev:normal / dev:inst)',
    test: (c) => c.includes('npm run dev:normal') && c.includes('npm run dev:inst'),
  },
  {
    desc: 'Deve conter comandos de build Windows e macOS',
    test: (c) => c.includes('npm run build:normal:win') && c.includes('npm run build:normal:mac:arm64'),
  },
  {
    desc: `Nomes dos artefatos de saída devem conter a versão atual (${currentVersion})`,
    test: (c) => c.includes(`LanView-Setup-${currentVersion}-win-x64.exe`) && c.includes(`LanView-Portable-${currentVersion}-win-x64.exe`),
  },
])

// 2. SETUP.md Checks
checkFile(setupPath, 'SETUP.md', [
  {
    desc: 'Deve conter instruções para Windows, macOS e Linux',
    test: (c) => c.includes('Windows') && c.includes('macOS') && c.includes('Linux'),
  },
  {
    desc: 'Deve conter seção de rebuild nativo do Mediasoup',
    test: (c) => c.includes('npm run rebuild:native'),
  },
  {
    desc: 'Deve conter os comandos de build multi-plataforma',
    test: (c) => c.includes('npm run build:normal:win') && c.includes('npm run build:normal:mac') && c.includes('npm run build:linux'),
  },
  {
    desc: `Artefatos de release listados devem refletir a versão atual (${currentVersion})`,
    test: (c) => c.includes(`LanView-Setup-${currentVersion}-win-x64.exe`),
  },
])

// 3. apps/desktop-transmissor/README.md Checks
checkFile(desktopReadmePath, 'apps/desktop-transmissor/README.md', [
  {
    desc: 'Deve apontar para a porta HTTP correta (3001)',
    test: (c) => c.includes('3001') && !c.includes('porta 3000)'),
  },
  {
    desc: 'Deve conter comandos de build multi-plataforma',
    test: (c) => c.includes('npm run build:normal:win') && c.includes('npm run build:linux'),
  },
])

// 4. apps/viewer-web/README.md Checks
checkFile(viewerReadmePath, 'apps/viewer-web/README.md', [
  {
    desc: 'Deve documentar o Viewer Web e a porta 3001',
    test: (c) => c.includes('Viewer Web') && c.includes('3001'),
  },
])

if (hasErrors) {
  console.error('\n⚠️ Foram encontradas inconsistências na documentação:')
  for (const err of errors) {
    console.error(`  ${err}`)
  }
  process.exit(1)
} else {
  console.log('\n✅ Todos os arquivos .md estão consistentes, atualizados e sincronizados!')
  process.exit(0)
}
