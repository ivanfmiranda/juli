'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const bootstrapModule = require('../src/index.js');
const {
  ensureToken,
  shouldGrantPublicRead,
  shouldRegenerateMissingTokenFiles,
  shouldSeedApiTokens,
} = bootstrapModule._testing;

test('should only enable convenience bootstrap by default in development and test', () => {
  withEnv({ NODE_ENV: 'development' }, () => {
    assert.equal(shouldGrantPublicRead(), true);
    assert.equal(shouldSeedApiTokens(), true);
  });

  withEnv({ NODE_ENV: 'test' }, () => {
    assert.equal(shouldGrantPublicRead(), true);
    assert.equal(shouldSeedApiTokens(), true);
  });

  withEnv({ NODE_ENV: 'staging' }, () => {
    assert.equal(shouldGrantPublicRead(), false);
    assert.equal(shouldSeedApiTokens(), false);
  });

  withEnv({ NODE_ENV: 'production' }, () => {
    assert.equal(shouldGrantPublicRead(), false);
    assert.equal(shouldSeedApiTokens(), false);
  });
});

test('should allow explicit bootstrap flags outside development and test', () => {
  withEnv({
    NODE_ENV: 'production',
    STRAPI_BOOTSTRAP_ALLOW_PUBLIC_READ: 'true',
    STRAPI_BOOTSTRAP_ALLOW_TOKEN_SEED: 'true',
  }, () => {
    assert.equal(shouldGrantPublicRead(), true);
    assert.equal(shouldSeedApiTokens(), true);
  });
});

test('should not rotate an existing token automatically when the token file is missing', async () => {
  await withTempDir(async tempDir => {
    const tokenFile = path.join(tempDir, 'preview-token.txt');
    const strapi = createFakeStrapi({
      existingToken: { id: 42, name: 'ubris-preview-token' },
    });

    await withEnv({
      NODE_ENV: 'development',
      STRAPI_BOOTSTRAP_REGENERATE_MISSING_TOKEN_FILES: undefined,
    }, async () => {
      await ensureToken(strapi, {
        name: 'ubris-preview-token',
        description: 'Preview token',
        type: 'read-only',
        tokenFile,
        envKey: 'STRAPI_PREVIEW_TOKEN',
      });
    });

    assert.equal(fs.existsSync(tokenFile), false);
    assert.equal(strapi.deleteCalls.length, 0);
    assert.equal(strapi.createCalls.length, 0);
    assert.match(
      strapi.warnMessages.join('\n'),
      /Refusing to rotate automatically/
    );
  });
});

test('should rotate a missing token file only when explicitly requested and should not log the secret', async () => {
  await withTempDir(async tempDir => {
    const tokenFile = path.join(tempDir, 'editor-token.txt');
    const strapi = createFakeStrapi({
      existingToken: { id: 7, name: 'ubris-editor-token' },
      createdToken: { accessKey: 'secret-editor-token' },
    });

    await withEnv({
      NODE_ENV: 'development',
      STRAPI_BOOTSTRAP_REGENERATE_MISSING_TOKEN_FILES: 'true',
    }, async () => {
      assert.equal(shouldRegenerateMissingTokenFiles(), true);

      await ensureToken(strapi, {
        name: 'ubris-editor-token',
        description: 'Editor token',
        type: 'full-access',
        tokenFile,
        envKey: 'STRAPI_EDITOR_TOKEN',
      });
    });

    assert.equal(fs.readFileSync(tokenFile, 'utf8'), 'secret-editor-token');
    assert.deepEqual(strapi.deleteCalls, [{ where: { id: 7 } }]);
    assert.deepEqual(strapi.createCalls, [{
      name: 'ubris-editor-token',
      description: 'Editor token',
      type: 'full-access',
      lifespan: null,
    }]);
    assert.equal(strapi.infoMessages.some(message => message.includes('secret-editor-token')), false);
    assert.equal(strapi.warnMessages.some(message => message.includes('secret-editor-token')), false);
  });
});

function createFakeStrapi({ existingToken = null, createdToken = { accessKey: 'generated-token' } } = {}) {
  const deleteCalls = [];
  const createCalls = [];
  const infoMessages = [];
  const warnMessages = [];

  return {
    createCalls,
    deleteCalls,
    infoMessages,
    warnMessages,
    log: {
      info: (...args) => infoMessages.push(args.join(' ')),
      warn: (...args) => warnMessages.push(args.join(' ')),
    },
    query(name) {
      if (name !== 'admin::api-token') {
        throw new Error(`Unexpected query target: ${name}`);
      }
      return {
        findOne: async () => existingToken,
        delete: async payload => {
          deleteCalls.push(payload);
        },
      };
    },
    service(name) {
      if (name !== 'admin::api-token') {
        throw new Error(`Unexpected service target: ${name}`);
      }
      return {
        create: async payload => {
          createCalls.push(payload);
          return createdToken;
        },
      };
    },
  };
}

async function withTempDir(run) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strapi-bootstrap-test-'));
  try {
    await run(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function withEnv(overrides, run) {
  const keys = Object.keys(overrides);
  const previous = new Map(keys.map(key => [key, process.env[key]]));

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await run();
  } finally {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
