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

// DOM Elements & State
let dfMessenger = null;
let currentUser = null;

// Wait for Dialogflow to be ready
window.addEventListener('df-messenger-loaded', () => {
    dfMessenger = document.querySelector('df-messenger');
    console.log("Dialogflow Messenger loaded");

    // If we already have a user from auth listener capable of running before this
    if (currentUser) {
        updateBot(currentUser);
    }
});

// Auth Functions
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            await createUserLocker(user);
            // Auth state listener will handle UI update
        })
        .catch((error) => {
            console.error("Login Error:", error);
            const userStatus = document.getElementById('user-status');
            if (userStatus) userStatus.innerText = "Login failed. Please try again.";
        });
}

function signOut() {
    auth.signOut()
        .then(() => {
            console.log("User signed out");
            // Clear Dialogflow session
            if (dfMessenger && dfMessenger.clearStorage) {
                dfMessenger.clearStorage();
            }
            window.location.reload();
        })
        .catch((error) => {
            console.error("Sign Out Error:", error);
        });
}

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
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userStatus = document.getElementById('user-status');

    if (user) {
        // Logged In
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (userStatus) {
            userStatus.innerHTML = `Welcome back, <strong>${user.displayName}</strong>`;
            userStatus.style.opacity = '1';
        }

        // Update Bot (if loaded)
        updateBot(user);

    } else {
        // Logged Out
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userStatus) userStatus.innerText = "";

        // Hide Bot
        if (dfMessenger) {
            dfMessenger.style.display = 'none';
        }
    }
}

// Helper to update Bot Context
function updateBot(user) {
    if (!dfMessenger) return; // Wait for load event

    dfMessenger.style.display = 'block';

    // Pass user data to bot
    // We use a slight delay to ensure the component is ready to receive events
    setTimeout(() => {
        dfMessenger.setQueryParameters({
            parameters: {
                "user_id": user.uid,
                "user_name": user.displayName
            }
        });
        console.log("Updated Bot Context for:", user.displayName);
    }, 500);
}

// Auth State Listener
auth.onAuthStateChanged((user) => {
    currentUser = user; // Store for late-loading bot
    updateUI(user);
});

// Smooth Scroll
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Expose functions global
window.googleLogin = googleLogin;
window.signOut = signOut;
window.scrollToSection = scrollToSection;
