const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dokodemo-ekimero-default-rtdb.firebaseio.com"
});

const db = admin.database();


async function updateDailyCounter() {
  const db = admin.database();
  const totalRef = db.ref("totalPlays");
  const dailyRef = db.ref("dailyDisplayCount");

  const snapshot = await totalRef.once("value");
  const count = snapshot.val();
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  await dailyRef.child(today).set(count);
  console.log(`Daily counter updated for ${today}: ${count}`);
}

updateDailyCounter().catch(err => {
  console.error(err);
  process.exit(1);
});
