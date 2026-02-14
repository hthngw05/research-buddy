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

// Auth Functions
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            await createUserLocker(user);
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
            const dfMessenger = document.querySelector('df-messenger');
            // Clear storage if available
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
    const dfMessenger = document.querySelector('df-messenger');

    // Always ensure bot is visible/updated
    updateBot(user);

    if (user) {
        // Logged In
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (userStatus) {
            userStatus.innerHTML = `Welcome back, <strong>${user.displayName}</strong>`;
            userStatus.style.opacity = '1';
        }

    } else {
        // Logged Out
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userStatus) userStatus.innerText = "";
    }
}

// Helper to update Bot Context and Visibility
function updateBot(user) {
    const dfMessenger = document.querySelector('df-messenger');

    if (!dfMessenger) {
        console.warn("df-messenger element not found in DOM yet. Retrying...");
        setTimeout(() => updateBot(user), 500);
        return;
    }

    // Ensure the web component is fully upgraded
    customElements.whenDefined('df-messenger').then(() => {

        // Show the bot
        dfMessenger.style.display = 'block';

        // Set parameters if user exists
        if (user) {
            try {
                dfMessenger.setQueryParameters({
                    parameters: {
                        "user_id": user.uid,
                        "user_name": user.displayName
                    }
                });
                console.log("Bot Parameters Set:", user.displayName);
            } catch (e) {
                console.error("Error setting bot parameters:", e);
            }
        }

        // Always trigger the WELCOME intent
        // This makes the bot greet the user (or show a notification) immediately
        try {
            dfMessenger.setAttribute("intent", "WELCOME");
        } catch (e) {
            console.error("Error triggering WELCOME intent:", e);
        }
    });
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

// Expose functions global
window.googleLogin = googleLogin;
window.signOut = signOut;
window.scrollToSection = scrollToSection;
