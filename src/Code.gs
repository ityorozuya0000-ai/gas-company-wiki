/**
 * Webアプリのエントリーポイント
 */
function doGet(e) {
  // 設定が未完了の場合はセットアップ画面を表示
  if (!Config.isValid()) {
    return HtmlService.createTemplateFromFile('setup')
      .evaluate()
      .setTitle('Setup - Company Wiki')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const template = HtmlService.createTemplateFromFile('index');
  template.appName = Config.APP_NAME; // Pass App Name to template
  
  return template.evaluate()
    .setTitle(Config.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTMLファイルをインクルードするためのヘルパー
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- API Functions ---

/**
 * 設定を保存する (Setup画面用)
 */
function apiSaveConfig(form) {
  Config.set(CONFIG_KEYS.SHEET_ID, form.sheetId);
  Config.set(CONFIG_KEYS.FOLDER_ID, form.folderId);
  Config.set(CONFIG_KEYS.APP_NAME, form.appName || 'Company Wiki');
  
  // Setup logic: Initialize DB if possible
  try {
    setup(); 
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}


// --- API Functions ---

/**
 * ページ一覧を取得する（最新の更新順）
 */
function apiGetPages() {
  const sheet = getDB().getSheetByName('Pages');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // ヘッダー除去
  
  // 削除されていないページのみをマッピング
  const pages = data
    .filter(row => row[8] !== true) // is_deleted check
    .map(row => ({
      id: row[0],
      title: row[1],
      updated_at: row[6],
      author_email: row[4],
      tags: row[7]
    }))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)); // 更新日時降順
    
  return pages;
}

/**
 * 指定されたIDのページ詳細を取得する
 */
function apiGetPage(id) {
  const sheet = getDB().getSheetByName('Pages');
  const data = sheet.getDataRange().getValues();
  // ヘッダー行を含めて検索しないように注意（ID列はA列=index0）
  const row = data.find(r => r[0] === id);
  
  if (!row) return null;
  
  return {
    id: row[0],
    title: row[1],
    content: row[2],
    format: row[3],
    author_email: row[4],
    created_at: row[5],
    updated_at: row[6],
    tags: row[7]
  };
}

/**
 * ページを保存（新規作成 or 更新）
 */
function apiSavePage(data) {
  const sheet = getDB().getSheetByName('Pages');
  const userEmail = Session.getActiveUser().getEmail();
  const timestamp = new Date().toISOString();
  
  if (data.id) {
    // 更新
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex(r => r[0] === data.id);
    
    if (rowIndex === -1) throw new Error('Page not found');
    
    // 行番号は1-based indexなので +1
    const range = sheet.getRange(rowIndex + 1, 1, 1, 9);
    const row = values[rowIndex];
    
    // 更新する部分のみ書き換え (ID, created_atは維持)
    row[1] = data.title;
    row[2] = data.content;
    row[3] = data.format;
    row[4] = userEmail; // 更新者
    row[6] = timestamp; // updated_at
    row[7] = data.tags;
    
    range.setValues([row]);
    return { id: data.id };
    
  } else {
    // 新規作成
    const newId = Utilities.getUuid();
    const newRow = [
      newId,
      data.title,
      data.content,
      data.format || 'html',
      userEmail,
      timestamp, // created_at
      timestamp, // updated_at
      data.tags,
      false // is_deleted
    ];
    
    sheet.appendRow(newRow);
    return { id: newId };
  }
}

/**
 * ファイル（画像/動画）をドライブにアップロードする
 * @param {Object} fileData { name, type, base64 }
 */
function apiUploadFile(fileData) {
  const folder = getAssetsFolder();
  const blob = Utilities.newBlob(
    Utilities.base64Decode(fileData.base64),
    fileData.type,
    fileData.name
  );
  
  const file = folder.createFile(blob);
  
  // 閲覧権限を付与（ドメイン内の全員が閲覧可能にするか、リンクを知っている人にするか）
  // ここではシンプルに「リンクを知っている全員」にはせず、権限はフォルダ設定に依存させるが、
  // 画像として表示させるためにDownload URLではなくthumbnailLinkやwebContentLinkを使う必要がある。
  // しかしDriveの画像表示は工夫が必要。setSharingでANYONE_WITH_LINKにするのが確実。
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  let displayUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
  
  // 画像の場合はサムネイル取得用URLを使用する（ブラウザのクッキー制限を回避するため）
  if (fileData.type.startsWith('image/')) {
    displayUrl = "https://drive.google.com/thumbnail?sz=w4096&id=" + file.getId();
  }

  return {
    url: displayUrl,
    downloadUrl: file.getDownloadUrl(),
    id: file.getId()
  };
}

/**
 * ページ検索
 */
function apiSearchPages(query) {
  if (!query) return apiGetPages();
  
  const sheet = getDB().getSheetByName('Pages');
  const data = sheet.getDataRange().getValues();
  data.shift(); // ヘッダー除去
  
  const lowerQuery = query.toLowerCase();
  
  const results = data
    .filter(row => {
      // タイトル、タグ、本文(一部)で検索
      const text = (row[1] + " " + row[7] + " " + row[2]).toLowerCase();
      return text.includes(lowerQuery) && row[8] !== true;
    })
    .map(row => ({
      id: row[0],
      title: row[1],
      updated_at: row[6],
      author_email: row[4],
      tags: row[7]
    }));
    
  return results;
}

/**
 * 初期セットアップ
 * スプレッドシートにシートとヘッダーを作成します
 */
function setup() {
  const ss = getDB();
  let sheet = ss.getSheetByName('Pages');
  if (!sheet) {
    sheet = ss.insertSheet('Pages');
  }
  
  const headers = [
    'id', 'title', 'content', 'format', 
    'author_email', 'created_at', 'updated_at', 'tags', 'is_deleted'
  ];
  
  // 既にデータがあるかチェックして、なければヘッダー設定
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    console.log('Setup completed: Headers created.');
  } else {
    console.log('Setup skipped: Sheet already has data.');
  }
}
