document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
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
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.database();
  const auth = firebase.auth();

  // Sign in anonymously to satisfy auth != null
  auth.signInAnonymously().catch(console.error);

  // Increment totalPlays safely per user (10-second cooldown)
  function incrementPlayCount() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.ref(`users/${user.uid}`);
    const counterRef = db.ref("totalPlays");

    userRef.transaction(userData => {
      const now = Date.now();
      if (!userData) return { lastUpdate: now };
      if (now - userData.lastUpdate > 10000) {
        return { lastUpdate: now };
      }
      return; // abort if within 10s
    }, (error, committed) => {
      if (error || !committed) return;
      counterRef.transaction(current => (current || 0) + 1);
    });
  }

  // Attach event listeners to all audio elements
  function setupAudioListeners() {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.dataset.playListenerAdded) {
        audio.addEventListener('play', incrementPlayCount);
        audio.dataset.playListenerAdded = 'true';
      }
    });
  }

  // Initial setup
  setupAudioListeners();

  // Observe dynamically added audio elements
  const observer = new MutationObserver(() => setupAudioListeners());
  observer.observe(document.body, { childList: true, subtree: true });

  // Real-time update of play counter
  db.ref("totalPlays").on("value", snapshot => {
    const count = snapshot.val() || 0;
    const el = document.getElementById("playCountNumber");
    if (el) el.textContent = count.toLocaleString();
  });
});
