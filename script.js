// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkwMKn-hMkcJhS0X-IY-npDCmTQPRNvIk",
    authDomain: "research-buddy-chatbot.firebaseapp.com",
    projectId: "research-buddy-chatbot",
    storageBucket: "research-buddy-chatbot.firebasestorage.app",
    messagingSenderId: "94866700919",
    appId: "1:94866700919:web:1fabb8feefb109622f6472"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userStatus = document.getElementById('user-status');
const dfMessenger = document.querySelector('df-messenger');

// Auth Functions
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            await createUserLocker(user);
            updateUI(user);
            console.log("Logged in as:", user.displayName);
        })
        .catch((error) => {
            console.error("Login Error:", error);
            userStatus.innerText = "Login failed. Please try again.";
        });
}

function signOut() {
    auth.signOut()
        .then(() => {
            console.log("User signed out");
            updateUI(null);
            // Clear Dialogflow session
            if (dfMessenger && dfMessenger.clearStorage) {
                dfMessenger.clearStorage();
            }
            // Force reload to clear any lingering state
            window.location.reload();
        })
        .catch((error) => {
            console.error("Sign Out Error:", error);
        });
}

// Firestore: Create "Locker" for new users
async function createUserLocker(user) {
    const userRef = db.collection('users').doc(user.uid);
    try {
        const doc = await userRef.get();
        if (!doc.exists) {
            await userRef.set({
                username: user.displayName,
                email: user.email,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Created new user locker.");
        }
    } catch (error) {
        console.error("Firestore Error:", error);
    }
}

// UI Updates
function updateUI(user) {
    if (user) {
        // Logged In
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (userStatus) {
            userStatus.innerHTML = `Welcome back, <strong>${user.displayName}</strong>`;
            userStatus.style.opacity = '1';
        }

        // Show Dialogflow
        if (dfMessenger) {
            dfMessenger.style.display = 'block';
            // Pass user data to bot
            dfMessenger.setQueryParameters({
                parameters: {
                    "user_id": user.uid,
                    "user_name": user.displayName
                }
            });
        }
    } else {
        // Logged Out
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userStatus) userStatus.innerText = ""; // Hide status text when logged out

        // Hide Dialogflow
        if (dfMessenger) {
            dfMessenger.style.display = 'none';
        }
    }
}

// Auth State Listener
auth.onAuthStateChanged((user) => {
    updateUI(user);
});

// Smooth Scroll
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Expose functions to window for HTML onclick events
window.googleLogin = googleLogin;
window.signOut = signOut;
window.scrollToSection = scrollToSection;
