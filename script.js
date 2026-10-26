const $ = selector => document.querySelector(selector);

const KEY = "connectly_posts_green_v1";
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

const starterPosts = [
  {
    id: 1, name: "Sarah Malik", initials: "SM", avatar: "pink",
    time: "15 minutes ago",
    text: "A little reminder: progress is progress, no matter how small. Keep learning, stay curious, and trust your journey. 🌿",
    image: "", likes: 12, liked: false, saved: false, comments: []
  },
  {
    id: 2, name: "Hamza Ali", initials: "HA", avatar: "blue",
    time: "1 hour ago",
    text: "Building something new with HTML, CSS and JavaScript today. Clean interfaces and a great user experience make all the difference! 💻",
    image: "", likes: 8, liked: false, saved: false, comments: []
  },
  {
    id: 3, name: "Zoya Ahmed", initials: "ZA", avatar: "orange",
    time: "3 hours ago",
    text: "Creativity starts when you give yourself space to explore new ideas. What's inspiring you today? ✨",
    image: "", likes: 21, liked: false, saved: false, comments: []
  }
];

function loadPosts() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(data)) return data;
  } catch (error) {
    console.warn("Could not load saved posts", error);
  }
  return starterPosts.map(post => ({ ...post, comments: [] }));
}

let posts = loadPosts();
let filter = "home";
let imageData = "";
let toastTimer;

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(posts));
  } catch (error) {
    toast("Browser storage is full. Try a smaller image.");
  }
}

function visiblePosts() {
  let list = [...posts];
  const query = $("#search").value.trim().toLowerCase();

  if (filter === "saved") list = list.filter(post => post.saved);
  if (filter === "profile") list = list.filter(post => post.name === "Abisha Kamran");
  if (query) {
    list = list.filter(post =>
      post.text.toLowerCase().includes(query) ||
      post.name.toLowerCase().includes(query)
    );
  }
  return list;
}

function render() {
  const list = visiblePosts();
  $("#feedTitle").textContent = filter === "saved" ? "Bookmarks" :
    filter === "profile" ? "My Posts" :
    filter === "explore" ? "Explore Community" : "Your Feed";

  $("#posts").innerHTML = list.map(post => `
    <article class="card post" data-id="${post.id}">
      <div class="post-header">
        <div class="avatar ${escapeHTML(post.avatar || "green")}">${escapeHTML(post.initials || "AK")}</div>
        <div class="post-author">
          <strong>${escapeHTML(post.name)}</strong>
          <small>${escapeHTML(post.time)} · <i class="fa-solid fa-earth-americas"></i> Public</small>
        </div>
        ${post.name === "Abisha Kamran" ? `<button class="post-menu delete" data-id="${post.id}" aria-label="Delete post"><i class="fa-solid fa-ellipsis"></i></button>` : ""}
      </div>

      <div class="post-content">${escapeHTML(post.text)}</div>
      ${post.image ? `<img class="post-image" src="${post.image}" alt="Post image">` : ""}

      <div class="post-stats">
        <span><i class="fa-solid fa-heart" style="color:#059669"></i> ${post.likes} likes</span>
        <span>${post.comments.length} comments</span>
      </div>

      <div class="post-actions">
        <button class="action like ${post.liked ? "selected" : ""}" data-id="${post.id}">
          <i class="${post.liked ? "fa-solid" : "fa-regular"} fa-heart"></i> ${post.liked ? "Liked" : "Like"}
        </button>
        <button class="action focus-comment" data-id="${post.id}">
          <i class="fa-regular fa-comment"></i> Comment
        </button>
        <button class="action save ${post.saved ? "selected" : ""}" data-id="${post.id}">
          <i class="${post.saved ? "fa-solid" : "fa-regular"} fa-bookmark"></i> ${post.saved ? "Saved" : "Save"}
        </button>
      </div>

      <div class="comments">
        ${post.comments.map(comment => `
          <div class="comment"><strong>${escapeHTML(comment.name)}</strong>${escapeHTML(comment.text)}</div>
        `).join("")}
      </div>

      <form class="comment-form" data-id="${post.id}">
        <input name="comment" maxlength="300" placeholder="Write a comment..." required>
        <button aria-label="Send comment"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    </article>
  `).join("");

  $("#empty").classList.toggle("hidden", list.length > 0);
}

$("#publish").addEventListener("click", () => {
  const text = $("#postText").value.trim();
  if (!text && !imageData) {
    toast("Write something or choose a photo first.");
    return;
  }

  posts.unshift({
    id: Date.now(), name: "Abisha Kamran", initials: "AK",
    avatar: "green", time: "Just now", text, image: imageData,
    likes: 0, liked: false, saved: false, comments: []
  });

  persist();
  $("#postText").value = "";
  imageData = "";
  $("#photo").value = "";
  $("#preview").innerHTML = "";
  $("#search").value = "";
  filter = "home";
  updateNav();
  render();
  toast("Your post is published!");
});

$("#photo").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast("Please select an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 1024 * 1024) {
    toast("Please choose an image smaller than 1 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageData = reader.result;
    $("#preview").innerHTML = `<img src="${imageData}" alt="Image preview">`;
  };
  reader.readAsDataURL(file);
});

$("#postText").addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") $("#publish").click();
});

$("#posts").addEventListener("click", event => {
  const likeButton = event.target.closest(".like");
  const saveButton = event.target.closest(".save");
  const commentButton = event.target.closest(".focus-comment");
  const deleteButton = event.target.closest(".delete");

  if (likeButton) {
    const post = posts.find(item => item.id === Number(likeButton.dataset.id));
    if (!post) return;
    post.liked = !post.liked;
    post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
    persist();
    render();
  }

  if (saveButton) {
    const post = posts.find(item => item.id === Number(saveButton.dataset.id));
    if (!post) return;
    post.saved = !post.saved;
    persist();
    render();
    toast(post.saved ? "Post bookmarked." : "Bookmark removed.");
  }

  if (commentButton) {
    commentButton.closest(".post").querySelector('input[name="comment"]').focus();
  }

  if (deleteButton) {
    const id = Number(deleteButton.dataset.id);
    if (!confirm("Delete this post?")) return;
    posts = posts.filter(post => post.id !== id);
    persist();
    render();
    toast("Post deleted.");
  }
});

$("#posts").addEventListener("submit", event => {
  if (!event.target.matches(".comment-form")) return;
  event.preventDefault();

  const id = Number(event.target.dataset.id);
  const input = event.target.querySelector('input[name="comment"]');
  const text = input.value.trim();
  if (!text) return;

  const post = posts.find(item => item.id === id);
  if (!post) return;

  post.comments.push({ name: "Abisha Kamran", text });
  persist();
  render();
  toast("Comment added.");
});

function updateNav() {
  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle("active", button.dataset.view === filter);
  });
}


const pageContent = {
  explore: {
    title: "Explore",
    description: "Discover posts and people in your community.",
    icon: "fa-compass"
  },
  saved: {
    title: "Bookmarks",
    description: "All your saved posts in one place.",
    icon: "fa-bookmark"
  },
  profile: {
    title: "My Profile",
    description: "Your profile and posts.",
    icon: "fa-user"
  },
  settings: {
    title: "Settings",
    description: "Manage your profile and preferences.",
    icon: "fa-gear"
  }
};

function openPage(page) {
  const info = pageContent[page];
  if (!info) return;

  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.history.pushState({ page }, "", url);

  renderPage(page);
}

function renderPage(page) {
  const info = pageContent[page];
  if (!info) {
    render();
    return;
  }

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle("active", button.dataset.view === page);
  });

  const feed = document.querySelector(".feed");

  if (page === "saved") {
    feed.innerHTML = `
      <section class="welcome">
        <span class="eyebrow">YOUR COLLECTION</span>
        <h1><i class="fa-regular ${info.icon}"></i> ${info.title}</h1>
        <p>${info.description}</p>
      </section>
      <section id="posts"></section>
      <div id="empty" class="card empty hidden">No saved posts yet.</div>
    `;

    const savedPosts = posts.filter(post => post.saved);
    showPostsOnPage(savedPosts, "No saved posts yet.");
    return;
  }

  if (page === "profile") {
    feed.innerHTML = `
      <section class="card" style="padding:28px;margin-bottom:22px">
        <div class="avatar green" style="width:75px;height:75px;font-size:23px">AK</div>
        <h1 style="margin-top:16px">Abisha Kamran</h1>
        <p style="margin-top:8px;color:var(--muted)">@abisha · Social Network Member</p>
        <p style="margin-top:14px">Welcome to my Connectly profile!</p>
        <button class="primary-btn" id="editProfile" style="margin-top:18px">Edit Profile</button>
      </section>
      <h2 style="margin-bottom:15px">My Posts</h2>
      <section id="posts"></section>
      <div id="empty" class="card empty hidden">You haven't published any posts yet.</div>
    `;

    showPostsOnPage(
      posts.filter(post => post.name === "Abisha Kamran"),
      "You haven't published any posts yet."
    );

    document.querySelector("#editProfile").addEventListener("click", () => {
      const newName = prompt("Enter your display name:", "Abisha Kamran");
      if (!newName || !newName.trim()) return;

      const cleanName = newName.trim();
      posts.forEach(post => {
        if (post.name === "Abisha Kamran") post.name = cleanName;
      });

      persist();
      renderPage("profile");
    });
    return;
  }

  if (page === "settings") {
    feed.innerHTML = `
      <section class="welcome">
        <span class="eyebrow">PERSONALIZE</span>
        <h1><i class="fa-solid ${info.icon}"></i> ${info.title}</h1>
        <p>${info.description}</p>
      </section>
      <section class="card" style="padding:24px">
        <h3>Account preferences</h3>
        <label style="display:block;margin-top:22px">Display name</label>
        <input id="settingName" value="Abisha Kamran"
          style="width:100%;padding:12px;border:1px solid var(--border);border-radius:9px;margin-top:8px">
        <label style="display:flex;align-items:center;gap:10px;margin-top:22px">
          <input type="checkbox" id="darkMode" style="width:auto">
          Enable dark appearance
        </label>
        <button class="primary-btn" id="saveSettings" style="margin-top:22px">Save Settings</button>
      </section>
    `;

    document.querySelector("#saveSettings").addEventListener("click", () => {
      const name = document.querySelector("#settingName").value.trim();
      if (!name) {
        toast("Please enter a display name.");
        return;
      }

      localStorage.setItem("connectly_display_name", name);
      document.body.classList.toggle(
        "dark-mode",
        document.querySelector("#darkMode").checked
      );
      toast("Settings saved!");
    });

    return;
  }

  feed.innerHTML = `
    <section class="welcome">
      <span class="eyebrow">YOUR COMMUNITY</span>
      <h1><i class="fa-solid ${info.icon}"></i> ${info.title}</h1>
      <p>${info.description}</p>
    </section>
    <section id="posts"></section>
    <div id="empty" class="card empty hidden">No posts to explore yet.</div>
  `;

  showPostsOnPage(posts, "No posts to explore yet.");
}

function showPostsOnPage(list, emptyText) {
  const container = document.querySelector("#posts");
  const empty = document.querySelector("#empty");

  if (!list.length) {
    empty.textContent = emptyText;
    empty.classList.remove("hidden");
    return;
  }

  container.innerHTML = list.map(post => `
    <article class="card post">
      <div class="post-header">
        <div class="avatar ${escapeHTML(post.avatar || "green")}">
          ${escapeHTML(post.initials || "AK")}
        </div>
        <div class="post-author">
          <strong>${escapeHTML(post.name)}</strong>
          <small>${escapeHTML(post.time)}</small>
        </div>
      </div>
      <div class="post-content">${escapeHTML(post.text)}</div>
      ${post.image ? `<img class="post-image" src="${post.image}" alt="Post image">` : ""}
      <div class="post-stats">
        <span>${post.likes} likes</span>
        <span>${post.comments.length} comments</span>
      </div>
    </article>
  `).join("");
}

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.view);
  });
});

window.addEventListener("popstate", () => {
  const page = new URLSearchParams(window.location.search).get("page");
  if (page && pageContent[page]) renderPage(page);
  else location.reload();
});

const initialPage = new URLSearchParams(window.location.search).get("page");
if (initialPage && pageContent[initialPage]) {
  renderPage(initialPage);
}


$("#search").addEventListener("input", render);

document.querySelectorAll(".follow").forEach(button => {
  button.addEventListener("click", () => {
    button.textContent = "Requested ✓";
    button.disabled = true;
    toast("Friend request sent!");
  });
});

document.querySelectorAll(".trend").forEach(button => {
  button.addEventListener("click", () => {
    $("#search").value = button.dataset.tag;
    filter = "explore";
    updateNav();
    render();
  });
});

document.querySelectorAll("[data-story]").forEach(button => {
  button.addEventListener("click", () => toast(button.dataset.story + "'s story"));
});

$("#addStory").addEventListener("click", () => toast("Story upload can be added next."));
$("#notifications").addEventListener("click", () => toast("You're all caught up!"));

render();
