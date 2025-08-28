document.addEventListener('DOMContentLoaded', function() {
  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyBrgf00OFxksjZuFOQxgB1qUjZmLSG7yqk",
    authDomain: "dokodemo-ekimero.firebaseapp.com",
    databaseURL: "https://dokodemo-ekimero-default-rtdb.firebaseio.com",
    projectId: "dokodemo-ekimero",
    storageBucket: "dokodemo-ekimero.firebasestorage.app",
    messagingSenderId: "189766315545",
    appId: "1:189766315545:web:e88fb50dc039f7d2f28488",
    measurementId: "G-EPCBNCPN4F"
  };

  // Initialize Firebase if not already
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const auth = firebase.auth();

  // Sign in anonymously
  auth.signInAnonymously().catch(console.error);

  // Increment function with limits
  function incrementPlay() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.ref(`users/${user.uid}`);
    const counterRef = db.ref("totalPlays");

    userRef.transaction(userData => {
      const now = Date.now();

      if (!userData) {
        // First-time user
        return {
          lastUpdate: now,
          lastHourStart: now,
          lastHourCount: 1,
          lastDayStart: now,
          lastDayCount: 1
        };
      }



      // Hourly limit
      let hourStart = userData.lastHourStart || now;
      let hourCount = userData.lastHourCount || 0;
      if (now - hourStart > 3600_000) { hourStart = now; hourCount = 0; }
      if (hourCount >= 250) return;

      // Daily limit
      let dayStart = userData.lastDayStart || now;
      let dayCount = userData.lastDayCount || 0;
      if (now - dayStart > 24 * 3600_000) { dayStart = now; dayCount = 0; }
      if (dayCount >= 500) return;

      return {

        lastUpdate: now,
        lastHourStart: hourStart,
        lastHourCount: hourCount + 1,
        lastDayStart: dayStart,
        lastDayCount: dayCount + 1
      };
    }, (error, committed) => {
      if (!committed || error) return;
      // Increment global counter
      counterRef.transaction(current => (current || 0) + 1);
    });
  }

  // Add listeners to audio elements
  function setupAudioListeners() {
    document.querySelectorAll('audio').forEach(audio => {
      if (!audio.dataset.playListenerAdded) {
        audio.addEventListener('play', incrementPlay);
        audio.dataset.playListenerAdded = 'true';
      }
    });
  }

  setupAudioListeners();

  // Observe dynamically added audio elements
  new MutationObserver(() => setupAudioListeners()).observe(document.body, {
    childList: true,
    subtree: true
  });

  // Daily display update
  function updateDailyCounter() {
    const today = new Date().toISOString().split('T')[0]; // e.g., "2025-08-21"
    const lastUpdate = localStorage.getItem('counterLastUpdate');

    if (lastUpdate === today) return; // Already updated today

    db.ref("totalPlays").once("value").then(snapshot => {
      const count = snapshot.val() || 0;
      const el = document.getElementById("playCountNumber");
      if (el) el.textContent = count.toLocaleString();
      localStorage.setItem('counterLastUpdate', today);
    });
  }

  updateDailyCounter();
});