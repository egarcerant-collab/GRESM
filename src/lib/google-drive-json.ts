import crypto from 'crypto';

const DEFAULT_DRIVE_FOLDER_ID = '1utogSez40qMqHPbB1v9Q-5ZAsnlGFnlE';

const DRIVE_FILE_NAMES: Record<string, string> = {
  users: 'usuarios.json',
  audits: 'base_de_datos.json',
};

type DriveCredentials = {
  client_email: string;
  private_key: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getCredentials(): DriveCredentials | null {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return {
      client_email: parsed.client_email,
      private_key: String(parsed.private_key).replace(/\\n/g, '\n'),
    };
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) return null;

  return {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n'),
  };
}

async function getAccessToken(credentials: DriveCredentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(credentials.private_key);

  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google auth failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findDriveFile(accessToken: string, folderId: string, fileName: string) {
  const query = [
    `'${escapeDriveQueryValue(folderId)}' in parents`,
    `name = '${escapeDriveQueryValue(fileName)}'`,
    'trashed = false',
  ].join(' and ');

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name)',
    spaces: 'drive',
    pageSize: '1',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google Drive search failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.files?.[0]?.id as string | undefined;
}

async function createDriveFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  content: string
) {
  const boundary = `gresm-${crypto.randomUUID()}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    }),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    content,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error(`Google Drive create failed: ${await response.text()}`);
  }
}

async function updateDriveFile(accessToken: string, fileId: string, content: string) {
  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: content,
    }
  );

  if (!response.ok) {
    throw new Error(`Google Drive update failed: ${await response.text()}`);
  }
}

export async function syncJsonTableToDrive(table: string, rows: unknown[]) {
  if (process.env.GOOGLE_DRIVE_WEBHOOK_URL) {
    const response = await fetch(process.env.GOOGLE_DRIVE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table,
        fileName: DRIVE_FILE_NAMES[table] || `${table}.json`,
        rows,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Drive webhook failed: ${await response.text()}`);
    }

    return;
  }

  const credentials = getCredentials();
  if (!credentials) return;

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_DRIVE_FOLDER_ID;
  const fileName = DRIVE_FILE_NAMES[table] || `${table}.json`;
  const content = JSON.stringify(rows, null, 2);
  const accessToken = await getAccessToken(credentials);
  const fileId = await findDriveFile(accessToken, folderId, fileName);

  if (fileId) {
    await updateDriveFile(accessToken, fileId, content);
  } else {
    await createDriveFile(accessToken, folderId, fileName, content);
  }
}
