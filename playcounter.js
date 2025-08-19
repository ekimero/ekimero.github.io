// Track play counts for all audio elements on the page
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

  // Function to increment play count
  function incrementPlayCount() {
    const counterRef = firebase.database().ref("totalPlays");
    counterRef.transaction((currentCount) => {
      return (currentCount || 0) + 1;
    });
  }

  // Attach event listeners to all audio elements
  function setupAudioListeners() {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      // Only add listener if not already added
      if (!audio.dataset.playListenerAdded) {
        audio.addEventListener('play', incrementPlayCount);
        audio.dataset.playListenerAdded = 'true';
      }
    });
  }

  // Initial setup
  setupAudioListeners();

  // Also set up a MutationObserver to catch dynamically added audio elements
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        setupAudioListeners();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});