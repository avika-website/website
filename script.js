/* ============================================================
   Chat widget behavior
   ------------------------------------------------------------
   Two jobs:
     1. Open / close the chat window when the round button is clicked.
     2. When the visitor hits "send", show their message and email it
        to you using Web3Forms (a free form-to-email service — no
        server needed, works perfectly on a static S3 / CloudFront site).

   HOW TO MAKE IT REALLY EMAIL YOU (2 minutes, free):
     1. Go to https://web3forms.com and enter your email.
     2. They send you an "Access Key" (a long string).
     3. Paste it below in place of "YOUR-WEB3FORMS-ACCESS-KEY".
   Until you do that, the chat still works — it just replies locally
   instead of actually emailing you.
   ============================================================ */

const WEB3FORMS_ACCESS_KEY = "YOUR-WEB3FORMS-ACCESS-KEY";


/* ---------- Grab the elements we need from the page ---------- */
const launcher    = document.getElementById("chatLauncher");
const launcherIcon = document.getElementById("chatLauncherIcon");
const badge       = document.getElementById("chatBadge");
const chatWindow  = document.getElementById("chatWindow");
const chatBody    = document.getElementById("chatBody");
const chatForm    = document.getElementById("chatForm");
const chatInput   = document.getElementById("chatInput");
const chatTime    = document.getElementById("chatTime");


/* ---------- Stamp the welcome message with the current time ---------- */
chatTime.textContent = "· " + formatTime(new Date());


/* ---------- 1. Open / close the chat window ---------- */
launcher.addEventListener("click", function () {
  const isOpen = !chatWindow.hidden;

  if (isOpen) {
    // Close it
    chatWindow.hidden = true;
    launcherIcon.innerHTML = "&#128172;"; // speech-bubble icon
    launcher.setAttribute("aria-label", "Open chat");
  } else {
    // Open it
    chatWindow.hidden = false;
    launcherIcon.innerHTML = "&#10005;";  // "x" icon
    launcher.setAttribute("aria-label", "Close chat");
    badge.hidden = true;                  // clear the little red "1"
    chatInput.focus();
  }
});


/* ---------- 2. Send a message ---------- */
chatForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // stop the page from reloading

  const text = chatInput.value.trim();
  if (!text) return; // ignore empty messages

  // Show the visitor's message immediately
  addMessage(text, "visitor");
  chatInput.value = "";

  // If no Web3Forms key is set yet, just reply locally.
  if (WEB3FORMS_ACCESS_KEY.indexOf("YOUR-") === 0) {
    addMessage(
      "Thanks! (Heads up: add your Web3Forms key in script.js so this " +
      "actually lands in your inbox.)",
      "host"
    );
    return;
  }

  // Otherwise, email it via Web3Forms
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: "New message from your portfolio chat",
        message: text,
        from_page: window.location.href,
      }),
    });

    const result = await response.json();

    if (result.success) {
      addMessage("Thanks for your message! I'll get back to you soon.", "host");
    } else {
      addMessage("Hmm, that didn't send. Please try again later.", "host");
    }
  } catch (error) {
    addMessage("Network error — please try again in a moment.", "host");
  }
});


/* ---------- Helper: add a message bubble to the chat ---------- */
function addMessage(text, who) {
  // who = "visitor" (right, blue) or "host" (left, gray)
  const row = document.createElement("div");
  row.className = "chat-row chat-row--" + who;

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar chat-avatar--small";
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = "&#128100;";

  const wrap = document.createElement("div");
  wrap.className = "chat-bubble-wrap";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--" + who;
  bubble.textContent = text;

  const meta = document.createElement("p");
  meta.className = "chat-meta";
  meta.textContent = (who === "visitor" ? "You" : "Avika") + " · " + formatTime(new Date());

  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  row.appendChild(avatar);
  row.appendChild(wrap);
  chatBody.appendChild(row);

  // Always scroll to the newest message
  chatBody.scrollTop = chatBody.scrollHeight;
}


/* ---------- Helper: format a time like "7:01 PM" ---------- */
function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // 0 -> 12
  return hours + ":" + minutes + " " + ampm;
}


/* ============================================================
   "Giving Back" slideshow
   ------------------------------------------------------------
   Cross-fades through the images in the slideshow every few
   seconds, looping forever. The fade itself is done in CSS
   (the ".is-active" class); this code just moves that class
   from one image to the next on a timer.

   It also shows a labeled gray placeholder for any image file
   that isn't there yet, so the section looks fine until you
   drop your real photos into /assets.
   ============================================================ */
(function () {
  const slideshow = document.getElementById("givingSlideshow");
  if (!slideshow) return; // section not on the page — do nothing

  const slides = slideshow.querySelectorAll(".slide");
  const SECONDS_PER_IMAGE = 3.5; // how long each photo stays before fading

  // Show a placeholder if a photo file is missing (404)
  slides.forEach(function (img) {
    function showPlaceholder() {
      const label = img.getAttribute("data-label") || "image";
      img.src =
        "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">' +
            '<rect width="100%" height="100%" fill="#dfe3f5"/>' +
            '<text x="50%" y="50%" font-family="sans-serif" font-size="24" ' +
            'fill="#6b7280" text-anchor="middle">Add assets/' + label + "</text>" +
            "</svg>"
        );
    }
    // catch a failure that happens after this script runs...
    img.addEventListener("error", showPlaceholder, { once: true });
    // ...and one that already happened before it ran
    if (img.complete && img.naturalWidth === 0) showPlaceholder();
  });

  // Advance to the next image on a loop (only if there's more than one)
  if (slides.length > 1) {
    let current = 0;
    setInterval(function () {
      slides[current].classList.remove("is-active"); // fade current out
      current = (current + 1) % slides.length;       // wrap back to 0 at the end
      slides[current].classList.add("is-active");     // fade next in
    }, SECONDS_PER_IMAGE * 1000);
  }
})();
