const webpush = require("web-push");
const { getPool, sql } = require("../config/db.config");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:itdhineshkumarthirupathi@gmail.com",
  process.env.VAPID_PUBLIC_KEY ||
    "BMDwwOAo-rKAXjnbRXBKLinsUEsEaoGlg2t1IZ2aOKE1iuWQHSqud57z4ET7mzI-RRV2Tr8cr6BAOPlFU9R-wFY",
  process.env.VAPID_PRIVATE_KEY || "qTufmcPJWw5iXf1-ES_jn4carG2BIKQwin4d-LMlDxg"
);

async function notifyAllClients(payload) {
  try {
    const pool = await getPool();
    const res = await pool.request().execute("sp_GetAllPushSubscriptions");
    const subs = res.recordset || [];

    const promises = subs.map((s) => {
      let pushObj;
      try {
        pushObj = JSON.parse(s.Keys);
      } catch (e) {
        pushObj = {};
      }
      const pushSubscription = {
        endpoint: s.Endpoint,
        keys: pushObj,
      };
      return webpush
        .sendNotification(pushSubscription, JSON.stringify(payload))
        .catch((err) => {
          console.warn("push failed", err && err.statusCode);
        });
    });

    await Promise.all(promises);
  } catch (err) {
    console.error("notifyAllClients error", err);
  }
}

module.exports = { notifyAllClients };
