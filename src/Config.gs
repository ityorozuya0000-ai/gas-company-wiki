const CONFIG = {
  // STEP 1で作成したスプレッドシートのIDをここに貼り付けてください
  SHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  
  // STEP 2で作成したフォルダのIDをここに貼り付けてください
  ASSETS_FOLDER_ID: 'YOUR_FOLDER_ID_HERE',

  // アプリ名
  APP_NAME: 'Company Wiki'
};

/**
 * スプレッドシートを取得するヘルパー関数
 */
function getDB() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

/**
 * 画像保存用フォルダを取得するヘルパー関数
 */
function getAssetsFolder() {
  return DriveApp.getFolderById(CONFIG.ASSETS_FOLDER_ID);
}
