/** Trash Pandas whitelist backend — Google Apps Script / Google Sheets **/
const SHEET_NAME = 'Whitelist';

/**
 * Run setup() once after attaching this Apps Script project to your Sheet.
 * New/empty sheets use only two columns: X Username + Wallet.
 */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 2).setValues([['X Username', 'Wallet']]);
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'Trash Pandas whitelist'
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    const p = (e && e.parameter) || {};
    const handle = String(p.handle || '').replace(/^@/, '').trim();
    const wallet = String(p.wallet || '').trim();

    if (!/^[A-Za-z0-9_]{3,15}$/.test(handle)) {
      throw new Error('Invalid X username');
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      throw new Error('Invalid EVM wallet');
    }

    /*
     * Prevent two near-simultaneous taps/retries from inserting twice.
     * This is especially useful on slow mobile networks.
     */
    lock.waitLock(10000);

    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, 2).setValues([['X Username', 'Wallet']]);
    }

    const columnCount = Math.max(sh.getLastColumn(), 2);
    const headers = sh
      .getRange(1, 1, 1, columnCount)
      .getDisplayValues()[0];

    // Support both the current 2-column layout and the older sheet layout.
    let handleColumn = headers.findIndex(h =>
      /^(X Username|X Handle)$/i.test(String(h).trim())
    );
    let walletColumn = headers.findIndex(h =>
      /^(Wallet|EVM Wallet)$/i.test(String(h).trim())
    );

    if (handleColumn === -1 || walletColumn === -1) {
      sh.getRange(1, 1, 1, 2).setValues([['X Username', 'Wallet']]);
      handleColumn = 0;
      walletColumn = 1;
    }

    /*
     * De-duplicate on either X username OR wallet.
     * This means a retry after a weak-network false error does not create
     * another row, while the Sheet still contains only username + wallet.
     */
    const lastRow = sh.getLastRow();

    if (lastRow > 1) {
      const rowCount = lastRow - 1;
      const existingHandles = sh
        .getRange(2, handleColumn + 1, rowCount, 1)
        .getDisplayValues()
        .flat()
        .map(v => String(v).replace(/^@/, '').trim().toLowerCase());

      const existingWallets = sh
        .getRange(2, walletColumn + 1, rowCount, 1)
        .getDisplayValues()
        .flat()
        .map(v => String(v).trim().toLowerCase());

      const duplicateHandle =
        existingHandles.includes(handle.toLowerCase());
      const duplicateWallet =
        existingWallets.includes(wallet.toLowerCase());

      if (duplicateHandle || duplicateWallet) {
        return jsonResponse({
          ok: true,
          duplicate: true,
          reason: duplicateHandle && duplicateWallet
            ? 'username_and_wallet'
            : duplicateHandle
              ? 'username'
              : 'wallet'
        });
      }
    }

    // Only X username + wallet receive values. Everything else stays blank.
    const rowLength = Math.max(
      columnCount,
      handleColumn + 1,
      walletColumn + 1
    );
    const row = Array(rowLength).fill('');
    row[handleColumn] = handle;
    row[walletColumn] = wallet;
    sh.appendRow(row);

    return jsonResponse({
      ok: true,
      duplicate: false
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}
