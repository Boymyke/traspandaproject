/** Trash Pandas whitelist backend — Google Apps Script / Google Sheets **/
const SHEET_NAME = 'Whitelist';

/**
 * Run setup() once after attaching this Apps Script project to your Sheet.
 * New/empty sheets use only two columns: X Username + Wallet.
 * If you still have the older 5-column sheet, doPost() will safely write only
 * the username and wallet into their matching legacy columns.
 */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 2).setValues([['X Username', 'Wallet']]);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'Trash Pandas whitelist' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const p = e.parameter || {};
    const handle = String(p.handle || '').replace(/^@/, '').trim();
    const wallet = String(p.wallet || '').trim();

    if (!/^[A-Za-z0-9_]{3,15}$/.test(handle)) {
      throw new Error('Invalid X username');
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      throw new Error('Invalid EVM wallet');
    }

    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, 2).setValues([['X Username', 'Wallet']]);
    }

    const columnCount = Math.max(sh.getLastColumn(), 2);
    const headers = sh.getRange(1, 1, 1, columnCount).getDisplayValues()[0];

    // Support both the new 2-column layout and your older sheet layout.
    let handleColumn = headers.findIndex(h => /^(X Username|X Handle)$/i.test(String(h).trim()));
    let walletColumn = headers.findIndex(h => /^(Wallet|EVM Wallet)$/i.test(String(h).trim()));

    if (handleColumn === -1 || walletColumn === -1) {
      // No recognized headers: use a clean 2-column layout.
      sh.getRange(1, 1, 1, 2).setValues([['X Username', 'Wallet']]);
      handleColumn = 0;
      walletColumn = 1;
    }

    // Only X username + wallet receive values. Everything else stays blank.
    const rowLength = Math.max(columnCount, handleColumn + 1, walletColumn + 1);
    const row = Array(rowLength).fill('');
    row[handleColumn] = handle;
    row[walletColumn] = wallet;
    sh.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
