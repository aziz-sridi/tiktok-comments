// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

$(document).ready(() => {
    $('#connectButton').click(connect);
    // Remove username input logic
    // $('#uniqueIdInput').on('keyup', function (e) { ... });
    // Always connect to the constant channel if not already connected
    // Optionally auto-connect on load if desired
    // connect();
})

// Hardcoded TikTok channel
const HARDCODED_CHANNEL = "tayssirmansourbrigui";

function connect() {
    let uniqueId = HARDCODED_CHANNEL;
    if (uniqueId !== '') {
        $('#stateText').text('Connecting...');
        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text(`Connected to roomId ${state.roomId}`);
            // reset stats
            viewerCount = 0;
            likeCount = 0;
            updateRoomStats();
        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);
            // schedule next try if obs username set
            // (not needed for hardcoded channel)
        })
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
    // Use translation for "Viewers" and "Likes"
    let lang = window.currentLang || 'en';
    let t = window.translations[lang];
    $('#roomStats').html(`${t.viewers}: <b>${viewerCount.toLocaleString()}</b> ${t.likes}: <b>${likeCount.toLocaleString()}</b>`)
}

function generateUsernameLink(data) {
    return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}


function addChatItem(color, data, text, summarize) {
    let container = $('.chatcontainer'); // Always use chatcontainer

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    container.find('.temporary').remove();

    container.append(`
        <div class=${summarize ? 'temporary' : 'static'}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>
            </span>
        </div>
    `);
}


// Settings state
const notificationSettings = {
    joins: true,
    likes: true,
    chats: true,
    gifts: true,
    follows: true
};

// Load settings from localStorage if available
function loadNotificationSettings() {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
        Object.assign(notificationSettings, JSON.parse(saved));
    }
    // Update checkboxes in modal
    $('#toggleJoins').prop('checked', notificationSettings.joins);
    $('#toggleLikes').prop('checked', notificationSettings.likes);
    $('#toggleChats').prop('checked', notificationSettings.chats);
    $('#toggleGifts').prop('checked', notificationSettings.gifts);
    $('#toggleFollows').prop('checked', notificationSettings.follows);
}

// Save settings to localStorage
function saveNotificationSettings() {
    notificationSettings.joins = $('#toggleJoins').is(':checked');
    notificationSettings.likes = $('#toggleLikes').is(':checked');
    notificationSettings.chats = $('#toggleChats').is(':checked');
    notificationSettings.gifts = $('#toggleGifts').is(':checked');
    notificationSettings.follows = $('#toggleFollows').is(':checked');
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
}

// On settings modal open
$('#settingsBtn').on('click', loadNotificationSettings);
// On save
$('#saveSettingsBtn').on('click', saveNotificationSettings);

// --- UI helpers ---

function addPhoneNumberChatItem(data, text, numbers) {
    let container = $('#phoneNumbersContainer');
    if (container.find('div.chatitem').length > 500) {
        container.find('div.chatitem').slice(0, 200).remove();
    }
    // For each number, just display (no edit/delete)
    numbers.forEach(number => {
        container.append(`
            <div class="chatitem" data-number="${number}">
                <img class="miniprofilepicture" src="${data.profilePictureUrl}">
                <span>
                    <b>${generateUsernameLink(data)}:</b> 
                    <span style="color:#18508f">${sanitize(text)}</span>
                    <span style="color:#21b2c2; margin-left:8px;" class="number-value">${number}</span>
                </span>
            </div>
        `);
    });
    $('#phoneNumbersCount').text(uniqueNumbers.size);
}

// Add to Phone Numbers from All Notifications
function addNotificationItem(color, data, text, temporary = false) {
    // Only add if notifications section is visible
    if (typeof notificationsVisible !== 'undefined' && !notificationsVisible) return;
    let container = $('#notificationsContainer');
    if (container.find('div.chatitem').length > 500) {
        container.find('div.chatitem').slice(0, 200).remove();
    }
    // Remove previous temporary notifications if any
    if (temporary) {
        container.find('.chatitem.temporary').remove();
    }
    // No "Add to Numbers" button
    container.append(`
        <div class="chatitem${temporary ? ' temporary' : ''}">
            <img class="miniprofilepicture" src="${data.profilePictureUrl || ''}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>
            </span>
        </div>
    `);

    // If temporary, remove after 2 seconds
    if (temporary) {
        setTimeout(() => {
            container.find('.chatitem.temporary').fadeOut(300, function() { $(this).remove(); });
        }, 2000);
    }
}

// --- Editing and Adding Numbers ---
// Remove event delegation for edit, delete, add-to-numbers

// $('#phoneNumbersContainer').on('click', '.edit-number-btn', ...);
// $('#phoneNumbersContainer').on('click', '.delete-number-btn', ...);
// $('#notificationsContainer').on('click', '.add-to-numbers-btn', ...);

// --- Counters ---
let subscriptionsCount = 0;
let sharesCount = 0;

// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }
    if (!notificationSettings.likes) return;
    if (typeof msg.likeCount === 'number') {
        let lang = window.currentLang || 'en';
        let t = window.translations[lang];
        let label = typeof msg.label === 'string'
            ? msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} ${t.likes}`)
            : `${msg.likeCount} ${t.likes}`;
        addNotificationItem('#447dd4', msg, label);
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
    if (!notificationSettings.joins) return;
    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;
    joinMsgDelay += addDelay;
    setTimeout(() => {
        joinMsgDelay -= addDelay;
        // Show as temporary notification (pops and disappears)
        let lang = window.currentLang || 'en';
        let t = window.translations[lang];
        addNotificationItem('#21b2c2', msg, t.joined, true);
    }, joinMsgDelay);
})

const uniqueNumbers = new Set();

// Fix phone number extraction to handle slashes and spaces before the number
function extractUniqueNumbers(text) {
    // Find all possible digit groups that could be phone numbers
    let chunks = text.match(/[2459][\d\s./-]{7,20}/g) || [];
    let results = [];
    for (let chunk of chunks) {
        // Remove separators inside the chunk
        let cleaned = chunk.replace(/[\s./-]/g, '');
        // Check for exact 8 digits starting with 2, 4, 5, or 9
        if (/^[2459]\d{7}$/.test(cleaned)) {
            results.push(cleaned);
        }
    }
    // Also check for numbers after a slash or space (e.g., "/23236110")
    let extra = (text.match(/[\s/\\-]([2459]\d{7})\b/g) || []).map(m => m.replace(/^[\s/\\-]/, ''));
    for (let n of extra) {
        if (!results.includes(n)) results.push(n);
    }
    return results;
}

// Expose for download logic
window.getAllUniqueNumbers = function() {
    // Only return numbers currently in the phoneNumbersContainer (in case of edits/deletes)
    let numbers = [];
    $('#phoneNumbersContainer .chatitem').each(function() {
        let num = $(this).attr('data-number');
        if (num && !numbers.includes(num)) numbers.push(num);
    });
    return numbers;
}

// New chat comment received
connection.on('chat', (msg) => {
    // Always process for phone numbers
    let numbers = extractUniqueNumbers(msg.comment);
    let unseen = numbers.filter(num => !uniqueNumbers.has(num));
    if (unseen.length > 0) {
        addPhoneNumberChatItem(msg, msg.comment, unseen);
        unseen.forEach(num => uniqueNumbers.add(num));
    }
    // Show in notifications if enabled
    if (notificationSettings.chats) {
        addNotificationItem('', msg, msg.comment);
    }
})

// Shares
connection.on('social', (data) => {
    let lang = window.currentLang || 'en';
    let t = window.translations[lang];
    if (data.displayType && data.displayType.includes('share')) {
        sharesCount++;
        $('#sharesCount').text(sharesCount);
        addNotificationItem('#2fb816', data, t.shared);
    } else if (!notificationSettings.follows) {
        return;
    } else {
        let label = typeof data.label === 'string'
            ? data.label.replace('{0:user}', '')
            : '';
        let color = data.displayType && data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
        addNotificationItem(color, data, label);
    }
})

connection.on('streamEnd', () => {
    $('#stateText').text('Stream ended.');
    // Reset counters for new live
    subscriptionsCount = 0;
    sharesCount = 0;
    $('#subscriptionsCount').text(subscriptionsCount);
    $('#sharesCount').text(sharesCount);
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
})

// Download comments with phone numbers logic
$('#downloadCommentsBtn').on('click', function() {
    let fileName = $('#fileNameInput').val().trim() || 'comments_with_numbers.txt';
    let lines = [];
    $('#phoneNumbersContainer .chatitem').each(function() {
        let username = $(this).find('.usernamelink').text();
        let comment = $(this).find('span').eq(1).clone().children('.number-value').remove().end().text().trim();
        let number = $(this).attr('data-number');
        // Format number with dots: 24405154 -> 24.405.154
        let formatted = number ? number.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3') : '';
        lines.push(`${username} : [${formatted}]`);
    });
    if (lines.length === 0) {
        $('#downloadStatus').text('No comments with numbers found.');
        return;
    }
    let blob = new Blob([lines.join('\n')], {type: 'text/plain'});
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    $('#downloadStatus').text('Downloaded ' + lines.length + ' comments.');
});

// --- Scroll-to-bottom button logic ---
function setupScrollFollow(containerSelector, btnSelector) {
    let container = $(containerSelector);
    let button = $(btnSelector);

    // Initial check
    checkScrollPosition(container, button);

    // Check on scroll
    container.on('scroll', function() {
        checkScrollPosition(container, button);
    });

    // Check on resize
    $(window).on('resize', function() {
        checkScrollPosition(container, button);
    });

    // Button click scrolls to bottom
    button.on('click', function() {
        container.animate({ scrollTop: container.prop("scrollHeight")}, 500);
    });
}

// --- Setup scroll follow for both containers ---
$(function() {
    setupScrollFollow('#notificationsContainer', '#scrollNotificationsBtn');
    setupScrollFollow('#phoneNumbersContainer', '#scrollPhoneNumbersBtn');
});