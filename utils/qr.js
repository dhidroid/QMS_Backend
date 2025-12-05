const QRCode = require("qrcode");

async function generateQRCodeBase64(payload) {
  // payload: string or JSON
  const str = typeof payload === "string" ? payload : JSON.stringify(payload);
  // create data-url PNG
  const dataUrl = await QRCode.toDataURL(str, { margin: 1 });
  // dataUrl = "data:image/png;base64,...."
  return dataUrl;
}

module.exports = { generateQRCodeBase64 };

