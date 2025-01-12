let contentQueue = [];
let filteredCount = 0;
let clickedCount = 0;
const contentSelectors = [
  '.x1lliihq.xjkvuk6.x1iorvi4',
  'span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x3x7a5m.x6prxxf.xvq8zen.xo1l8bm.xzsf02u.x1yc453h',
  '[data-e2e="comment-level-1"]',
  '[data-e2e="comment-level-2"]',
  'ytd-comment-view-model'
];

function updateFilteredCount() {
  chrome.storage.local.get(['filteredCount'], (result) => {
      const count = result.filteredCount || 0;
      chrome.storage.local.set({ filteredCount: count + 1 });
  });
}

function updateClickedCount() {
  chrome.storage.local.get(['clickedCount'], (result) => {
      const count = result.clickedCount || 0;
      chrome.storage.local.set({ clickedCount: count + 1 });
  });
}

// Hàm làm sạch văn bản
function cleanText(text) {
    const noEmoji = text.replace(/([\u{1F600}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}])/gu, "");
    return noEmoji.replace(/\s+/g, " ").trim();
}

// Hàm kiểm tra bình luận
async function checkContent(text) {
    const cleanedText = cleanText(text);
    if (cleanedText.length === 0) {
        return "0";
    }

    try {
        const response = await fetch("http://localhost:49385/predict", {
            method: "POST",
            mode: 'cors',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Cache-Control": "no-cache"
            },
            body: JSON.stringify({ "text": cleanedText })
        });

        if (!response.ok) return "0";

        const data = await response.json();
        return data.label;
    } catch (error) {
        return "0";
    }
}

// Hàm xử lý từng bình luận
async function processContent(content) {
    if (content.getAttribute("data-processed") === "true") return;

    const textElement = content.querySelector('[dir="auto"][lang], #content-text') || content;
    if (!textElement) return;

    const text = textElement.innerText;
    const label = await checkContent(text);

    if (label === "1") {
        textElement.style.filter = "blur(5px)";
        textElement.innerText = "Nội dung này chứa ngôn ngữ thô tục!";
        updateFilteredCount();

        content.addEventListener("click", () => {
            if (textElement.innerText === "Nội dung này chứa ngôn ngữ thô tục!") {
                textElement.innerText = text;
                textElement.style.filter = "none";
                updateClickedCount();
            }
        });
    } else if (label === "2") {
        textElement.innerText = "Nội dung thô tục đã bị xóa";
        textElement.style.fontWeight = "700";
        updateFilteredCount();
    }

    content.setAttribute("data-processed", "true");
}

// Hàm tìm và thêm bình luận mới vào hàng đợi xử lý
function findAndQueueNewContents() {
    let contents = document.querySelectorAll(contentSelectors.join(', '));
    
    contents.forEach((content) => {
        if (!content.getAttribute("data-got")) {
            content.setAttribute("data-got", "true");
            contentQueue.push(content);
            processContent(content);
        }
    });
}

// Khởi tạo MutationObserver để giám sát bình luận mới
const parentElement = document.querySelector("body");
const observer = new MutationObserver(findAndQueueNewContents);

observer.observe(parentElement, { childList: true, subtree: true });
findAndQueueNewContents();


