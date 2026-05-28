const DRIVE_FOLDER_ID = '1utogSez40qMqHPbB1v9Q-5ZAsnlGFnlE';

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const fileName = payload.fileName;
  const rows = payload.rows || [];
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const content = JSON.stringify(rows, null, 2);
  const existing = folder.getFilesByName(fileName);

  if (existing.hasNext()) {
    existing.next().setContent(content);
  } else {
    folder.createFile(fileName, content, MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, fileName }))
    .setMimeType(ContentService.MimeType.JSON);
}
