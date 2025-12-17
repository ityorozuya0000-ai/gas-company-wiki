const CONFIG_KEYS = {
  SHEET_ID: 'SHEET_ID',
  FOLDER_ID: 'ASSETS_FOLDER_ID',
  APP_NAME: 'APP_NAME'
};

const Config = {
  get: function(key) {
    return PropertiesService.getScriptProperties().getProperty(key);
  },
  
  set: function(key, value) {
    PropertiesService.getScriptProperties().setProperty(key, value);
  },
  
  getAll: function() {
    return PropertiesService.getScriptProperties().getProperties();
  },
  
  isValid: function() {
    const props = this.getAll();
    return props[CONFIG_KEYS.SHEET_ID] && props[CONFIG_KEYS.FOLDER_ID];
  },
  
  // Helpers for code access
  get SHEET_ID() { return this.get(CONFIG_KEYS.SHEET_ID); },
  get ASSETS_FOLDER_ID() { return this.get(CONFIG_KEYS.FOLDER_ID); },
  get APP_NAME() { return this.get(CONFIG_KEYS.APP_NAME) || 'Company Wiki'; }
};

/**
 * スプレッドシートを取得するヘルパー関数
 */
function getDB() {
  const id = Config.SHEET_ID;
  if (!id) throw new Error('Configuration missing: SHEET_ID');
  return SpreadsheetApp.openById(id);
}

/**
 * 画像保存用フォルダを取得するヘルパー関数
 */
function getAssetsFolder() {
  const id = Config.ASSETS_FOLDER_ID;
  if (!id) throw new Error('Configuration missing: ASSETS_FOLDER_ID');
  return DriveApp.getFolderById(id);
}
