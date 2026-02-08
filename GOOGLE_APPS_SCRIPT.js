/**
 * ARAHAN DEPLOYMENT:
 * 1. Buka Google Sheet -> Extensions -> Apps Script
 * 2. Paste kod ini ke dalam Code.gs
 * 3. Tekan Deploy -> New Deployment
 * 4. Configuration:
 *    - Type: Web App
 *    - Description: V1
 *    - Execute as: Me (email anda)
 *    - Who has access: Anyone (Sangat Penting!)
 * 5. Copy URL yang diberi dan update dalam fail constants.ts
 */

function doGet(e) {
  // Ambil sheet pertama dalam fail Google Sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  
  // Dapatkan semua data
  var data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];
  var rows = data.slice(1);

  var result = rows.map(function(row, rowIndex) {
    var obj = {};
    obj['id'] = rowIndex; // ID maya untuk React list key
    
    headers.forEach(function(header, i) {
      var value = row[i];
      
      // Handle format tarikh Google Sheet
      if (value instanceof Date) {
        value = value.toISOString();
      }
      
      // Pastikan value string jika bukan null/undefined
      if (value === null || value === undefined) {
        value = "";
      }
      
      obj[header.toString().trim()] = value;
    });
    
    return obj;
  });

  // Buang baris kosong
  var cleanResult = result.filter(function(item) {
    return Object.values(item).some(function(val) { 
      return val !== "" && val !== null && val !== item.id; 
    });
  });

  // Tunjuk yang paling baru dahulu
  cleanResult.reverse();

  return ContentService.createTextOutput(JSON.stringify(cleanResult))
    .setMimeType(ContentService.MimeType.JSON);
}
