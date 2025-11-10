import type { Options } from 'semantic-release';

const config: Options = {
  branches: ['main', 
    { name: 'development', prerelease: false },
    { name: 'test-merge-draft', prerelease: false }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
        draft: true,
        assets: [
          './release/**',
        ],
        releaseName: 'INTO-CPS Application ${nextRelease.version}',
      },
    ],
  ],
};

export default config;