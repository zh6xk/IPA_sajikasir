const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Execute command and return stdout string
const execCmd = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return null;
  }
};

// Execute command and stream output to console
const execCmdLive = (cmd) => {
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (e) {
    return false;
  }
};

async function main() {
  console.log('\n🚀 --- SajiKasir Auto Publisher ---\n');

  // Set the working directory to the project directory
  const projectPath = 'E:\\AI\\sajikasir';
  try {
    process.chdir(projectPath);
    console.log(`Berjalan di direktori proyek: ${projectPath}\n`);
  } catch (e) {
    console.error(`Gagal masuk ke folder proyek: ${projectPath}`);
    console.error('Pastikan folder tersebut ada dan Anda memiliki hak akses.');
    process.exit(1);
  }

  // 1. Read Current Config
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const appJsonPath = path.join(process.cwd(), 'app.json');
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  const currentVersion = packageJson.version;
  console.log(`Versi saat ini: ${currentVersion}`);

  // 2. Ask for Version
  let newVersion = await question(`Masukkan versi baru (tekan Enter untuk tetap ${currentVersion}): `);
  if (!newVersion.trim()) newVersion = currentVersion;

  // 3. Ask for Update Description
  let updateDesc = await question('Masukkan deskripsi update (contoh: Menambah fitur A): ');
  while (!updateDesc.trim()) {
    console.log('Deskripsi tidak boleh kosong!');
    updateDesc = await question('Masukkan deskripsi update: ');
  }

  // 3.5 Ask for Target Platform
  console.log('\nPlatform yang ingin di-build oleh GitHub Actions:');
  console.log('1. Android Saja');
  console.log('2. iOS Saja');
  console.log('3. Keduanya (Android & iOS)');
  let platformChoice = '';
  while (!['1', '2', '3'].includes(platformChoice.trim())) {
    platformChoice = await question('Pilih platform (1/2/3): ');
  }
  let platformSuffix = '-all';
  if (platformChoice.trim() === '1') platformSuffix = '-android';
  if (platformChoice.trim() === '2') platformSuffix = '-ios';

  // 4. Git User Config
  let gitUser = execCmd('git config user.name');
  if (!gitUser) {
    console.log('\nGit Username belum diatur.');
    gitUser = await question('Masukkan nama Anda untuk Git: ');
    execCmd(`git config --global user.name "${gitUser}"`);
  }

  let gitEmail = execCmd('git config user.email');
  if (!gitEmail) {
    console.log('\nGit Email belum diatur.');
    gitEmail = await question('Masukkan email Anda untuk Git: ');
    execCmd(`git config --global user.email "${gitEmail}"`);
  }

  // 5. Git Remote Config
  let remoteUrl = execCmd('git remote get-url origin');
  if (!remoteUrl) {
    console.log('\nRepository GitHub belum diatur (remote origin tidak ditemukan).');
    remoteUrl = await question('Masukkan link .git dari GitHub Anda (contoh: https://github.com/user/repo.git): ');
    if (remoteUrl.trim()) {
      execCmd('git remote add origin ' + remoteUrl.trim());
    }
  } else {
    console.log(`\nURL GitHub saat ini: ${remoteUrl}`);
    const changeRemote = await question('Ingin mengubah URL GitHub ini? (y/N): ');
    if (changeRemote.toLowerCase() === 'y') {
      remoteUrl = await question('Masukkan link .git yang baru: ');
      if (remoteUrl.trim()) {
        execCmd('git remote set-url origin ' + remoteUrl.trim());
      }
    }
  }

  console.log('\n⏳ Memperbarui file konfigurasi...');
  // Update version in files
  packageJson.version = newVersion;
  appJson.expo.version = newVersion;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

  console.log('📦 Menjalankan Git Commit & Push...');
  
  // Git Flow
  execCmdLive('git add .');
  execCmdLive(`git commit -m "${updateDesc}"`);

  // Check if tag already exists, if so delete it so we can re-create or push
  const newTag = `v${newVersion}${platformSuffix}`;
  const existingTags = execCmd('git tag');
  if (existingTags && existingTags.includes(newTag)) {
    console.log(`Tag ${newTag} sudah ada, akan dihapus dan diganti baru.`);
    execCmd(`git tag -d ${newTag}`);
    execCmd(`git push origin :refs/tags/${newTag}`);
  }

  execCmdLive(`git tag -a ${newTag} -m "${updateDesc}"`);

  // Try pushing current branch (usually main or master)
  const branchName = execCmd('git rev-parse --abbrev-ref HEAD') || 'main';
  console.log(`\nMengunggah ke branch: ${branchName}`);
  
  const pushBranchSuccess = execCmdLive(`git push -u origin ${branchName}`);
  const pushTagSuccess = execCmdLive(`git push origin ${newTag}`);

  if (pushBranchSuccess && pushTagSuccess) {
    console.log('\n✅ BERHASIL! Update telah dikirim ke GitHub.');
    console.log(`GitHub Actions akan segera memproses file berdasarkan target Anda: ${newTag}`);
    console.log('Silakan cek tab "Actions" di repository GitHub Anda.');
  } else {
    console.log('\n❌ Terjadi kesalahan saat mengunggah ke GitHub.');
    console.log('Pastikan koneksi internet Anda stabil dan Anda memiliki akses ke repository tersebut.');
  }

  console.log('\nTekan Enter untuk keluar...');
  await question('');
  rl.close();
}

main().catch(async err => {
  console.error(err);
  console.log('\nTekan Enter untuk keluar...');
  await question('');
  rl.close();
});
